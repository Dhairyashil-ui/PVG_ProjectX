require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const { generalLimiter } = require('./middleware/rateLimiter');
const { detectLimiter } = require('./middleware/rateLimiter');
const { authLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const detectRoutes = require('./routes/detect');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the first proxy (Render, Vercel, etc.) so rate-limit reads real client IP
// Fixes: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

/* ──────────────────────────────────────────────────
   Ensure uploads directory exists
────────────────────────────────────────────────── */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/* ──────────────────────────────────────────────────
   Security Headers (Helmet)
────────────────────────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

/* ──────────────────────────────────────────────────
   CORS
────────────────────────────────────────────────── */
const allowedOrigins = [
  process.env.FRONTEND_URL,           // e.g. https://trinetra.vercel.app
  'https://trenetra.vercel.app',      // explicit addition for production
  'http://localhost:5173',            // Vite dev
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/* ──────────────────────────────────────────────────
   Body Parsers
────────────────────────────────────────────────── */
app.use(express.json({ limit: '10mb' })); // keep small — file uploads use multipart
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/* ──────────────────────────────────────────────────
   Global Rate Limiter
────────────────────────────────────────────────── */
app.use(generalLimiter);

/* ──────────────────────────────────────────────────
   Health Check (Render uses this to verify deployment)
────────────────────────────────────────────────── */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Trinetra Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

/* ──────────────────────────────────────────────────
   Routes
────────────────────────────────────────────────── */
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/detect', detectLimiter, detectRoutes);

/* ──────────────────────────────────────────────────
   404 Handler
────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

/* ──────────────────────────────────────────────────
   Global Error Handler
────────────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err.stack || err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large. Maximum allowed size is 50MB.',
    });
  }
  if (err.message?.startsWith('Unsupported file type')) {
    return res.status(415).json({ success: false, message: err.message });
  }

  // CORS errors
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ──────────────────────────────────────────────────
   MongoDB + Server Start
────────────────────────────────────────────────── */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('[FATAL] MONGO_URI environment variable is not set. Exiting.');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('[DB] Connected to MongoDB');
    const server = app.listen(PORT, () => {
      console.log(`[SERVER] Trinetra Backend running on port ${PORT}`);
      if (!process.env.ZEROTRUE_API_KEY) {
        console.warn('[WARN] ZEROTRUE_API_KEY is not set — detection endpoints will return 503.');
      }
    });

    /* ── Graceful Shutdown ── */
    const shutdown = (signal) => {
      console.log(`[SERVER] ${signal} received — shutting down gracefully.`);
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('[SERVER] MongoDB connection closed. Bye!');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('[FATAL] MongoDB connection failed:', err.message);
    process.exit(1);
  });
