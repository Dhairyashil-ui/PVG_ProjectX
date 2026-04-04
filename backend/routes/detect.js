const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Scan = require('../models/Scan');

const ZEROTRUE_BASE = 'https://app.zerotrue.app/api/v1';
const ZEROTRUE_API_KEY = process.env.ZEROTRUE_API_KEY;

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Multer: disk storage (more reliable for binary files than memory)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

/* ──────────────────────────────────────────────────
   Helper: Poll ZeroTrue until status = completed | failed
   Max wait: 120 seconds (polling every 3s)
────────────────────────────────────────────────── */
async function pollZeroTrue(checkId, maxWaitMs = 120000, intervalMs = 3000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const resp = await axios.get(`${ZEROTRUE_BASE}/checks/${checkId}/`, {
      headers: { Authorization: `Bearer ${ZEROTRUE_API_KEY}` },
      timeout: 15000,
    });
    const data = resp.data;
    if (data.status === 'completed' || data.status === 'failed') {
      return data;
    }
  }
  throw new Error('ZeroTrue polling timeout: analysis took too long.');
}

/* ──────────────────────────────────────────────────
   Helper: Create ZeroTrue check for a file upload
────────────────────────────────────────────────── */
async function createFileCheck(filePath, originalFilename, mimeType) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), {
    filename: originalFilename,
    contentType: mimeType,
  });
  form.append('is_private_scan', 'true');
  form.append('is_deep_scan', 'false');
  form.append('idempotency_key', uuidv4());

  const resp = await axios.post(`${ZEROTRUE_BASE}/check`, form, {
    headers: {
      Authorization: `Bearer ${ZEROTRUE_API_KEY}`,
      ...form.getHeaders(),
    },
    timeout: 30000,
  });
  return resp.data; // { id, status }
}

/* ──────────────────────────────────────────────────
   Helper: Create ZeroTrue check for text
────────────────────────────────────────────────── */
async function createTextCheck(text) {
  const resp = await axios.post(
    `${ZEROTRUE_BASE}/check`,
    {
      input: { type: 'text', value: text },
      is_private_scan: true,
      is_deep_scan: false,
      idempotency_key: uuidv4(),
    },
    {
      headers: {
        Authorization: `Bearer ${ZEROTRUE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return resp.data; // { id, status }
}

/* ──────────────────────────────────────────────────
   Helper: Determine mediaType from mimetype
────────────────────────────────────────────────── */
function resolveMediaType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'text/plain') return 'text';
  return 'image'; // fallback
}

/* ──────────────────────────────────────────────────
   POST /api/detect/upload
   Accepts multipart/form-data with `file` and `userEmail`
────────────────────────────────────────────────── */
router.post('/upload', upload.single('file'), async (req, res) => {
  const { userEmail } = req.body || {};
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }
  if (!ZEROTRUE_API_KEY) {
    return res.status(503).json({ success: false, message: 'ZeroTrue API key not configured on server.' });
  }

  const mediaType = resolveMediaType(file.mimetype);
  let scan = null;

  try {
    // 1. Create ZeroTrue check
    const checkInit = await createFileCheck(file.path, file.originalname, file.mimetype);

    // 2. Persist initial scan record
    scan = new Scan({
      userEmail: userEmail ? userEmail.toLowerCase() : 'anonymous',
      zerotrue_id: checkInit.id,
      mediaType,
      originalFilename: file.originalname,
      status: 'processing',
    });
    await scan.save();

    // 3. Poll for result
    const result = await pollZeroTrue(checkInit.id);

    // 4. Update scan record
    scan.status = result.status;
    if (result.result) {
      scan.aiProbability = result.result.ai_probability ?? null;
      scan.humanProbability = result.result.human_probability ?? null;
      scan.resultType = result.result.result_type ?? null;
      scan.rawResult = result.result;
    }
    if (result.status === 'failed') {
      scan.errorMessage = result.error || 'ZeroTrue processing failed';
    }
    await scan.save();

    // 5. Clean up temp file
    fs.unlink(file.path, () => {});

    return res.status(200).json({
      success: true,
      scanId: scan._id,
      zerotrue_id: checkInit.id,
      mediaType,
      filename: file.originalname,
      status: result.status,
      result: result.result || null,
    });
  } catch (err) {
    console.error('[DETECT/UPLOAD] Error:', err.message);
    // Try to mark scan as failed
    if (scan) {
      scan.status = 'failed';
      scan.errorMessage = err.message;
      await scan.save().catch(() => {});
    }
    // Clean up temp file
    if (file?.path) fs.unlink(file.path, () => {});

    if (err.response?.status === 401) {
      return res.status(401).json({ success: false, message: 'Invalid ZeroTrue API key.' });
    }
    if (err.response?.status === 402) {
      return res.status(402).json({ success: false, message: 'ZeroTrue quota exceeded. Please upgrade your plan.' });
    }
    if (err.message.includes('timeout')) {
      return res.status(504).json({ success: false, message: 'Analysis timed out. Please try a smaller file.' });
    }
    return res.status(500).json({ success: false, message: 'Detection failed. Please try again.' });
  }
});

/* ──────────────────────────────────────────────────
   POST /api/detect/text
   Body: { text: string, userEmail: string }
────────────────────────────────────────────────── */
router.post('/text', async (req, res) => {
  const { text, userEmail } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim().length < 20) {
    return res.status(400).json({
      success: false,
      message: 'Text must be at least 20 characters.',
    });
  }
  if (!ZEROTRUE_API_KEY) {
    return res.status(503).json({ success: false, message: 'ZeroTrue API key not configured on server.' });
  }

  let scan = null;

  try {
    // 1. Create ZeroTrue check
    const checkInit = await createTextCheck(text.trim());

    // 2. Persist initial scan
    scan = new Scan({
      userEmail: userEmail ? userEmail.toLowerCase() : 'anonymous',
      zerotrue_id: checkInit.id,
      mediaType: 'text',
      originalFilename: 'text-input',
      status: 'processing',
    });
    await scan.save();

    // 3. Poll for result
    const result = await pollZeroTrue(checkInit.id);

    // 4. Update scan record
    scan.status = result.status;
    if (result.result) {
      scan.aiProbability = result.result.ai_probability ?? null;
      scan.humanProbability = result.result.human_probability ?? null;
      scan.resultType = result.result.result_type ?? null;
      scan.content = result.result.content ?? text.substring(0, 500);
      scan.rawResult = result.result;
    }
    if (result.status === 'failed') {
      scan.errorMessage = result.error || 'ZeroTrue processing failed';
    }
    await scan.save();

    return res.status(200).json({
      success: true,
      scanId: scan._id,
      zerotrue_id: checkInit.id,
      mediaType: 'text',
      status: result.status,
      result: result.result || null,
    });
  } catch (err) {
    console.error('[DETECT/TEXT] Error:', err.message);
    if (scan) {
      scan.status = 'failed';
      scan.errorMessage = err.message;
      await scan.save().catch(() => {});
    }
    if (err.response?.status === 401) {
      return res.status(401).json({ success: false, message: 'Invalid ZeroTrue API key.' });
    }
    if (err.response?.status === 402) {
      return res.status(402).json({ success: false, message: 'ZeroTrue quota exceeded.' });
    }
    return res.status(500).json({ success: false, message: 'Text analysis failed. Please try again.' });
  }
});

/* ──────────────────────────────────────────────────
   GET /api/detect/history?email=x&page=1&limit=10
────────────────────────────────────────────────── */
router.get('/history', async (req, res) => {
  const { email, page = 1, limit = 10 } = req.query;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email query param required.' });
  }

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [scans, total] = await Promise.all([
      Scan.find({ userEmail: email.toLowerCase() })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-rawResult -content'), // keep payload light
      Scan.countDocuments({ userEmail: email.toLowerCase() }),
    ]);

    return res.status(200).json({
      success: true,
      scans,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('[DETECT/HISTORY] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch history.' });
  }
});

/* ──────────────────────────────────────────────────
   GET /api/detect/scan/:id
   Fetch full result for a single scan (includes rawResult)
────────────────────────────────────────────────── */
router.get('/scan/:id', async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found.' });
    }
    return res.status(200).json({ success: true, scan });
  } catch (err) {
    console.error('[DETECT/SCAN] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch scan.' });
  }
});

module.exports = router;
