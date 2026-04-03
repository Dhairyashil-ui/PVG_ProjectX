// dotenv not needed for now
const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const port = process.env.PORT || 5000;

// Update this with the real Google Client ID when deploying
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '1044465224388-72r28oabeq3t3ocigb818edj122g6j2n.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json());

// Main Auth Route
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'No token provided' });
  }

  try {
    // If the frontend used useGoogleLogin (which returns an access token, not an ID token),
    // we use tokeninfo to verify it with Google endpoint or we get profile data
    
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info with token');
    }

    const payload = await response.json();

    // Verify user payload has an email
    if (!payload.email) {
      return res.status(401).json({ success: false, message: 'Invalid payload' });
    }

    console.log(`User logged in: ${payload.email} (${payload.name})`);

    // Here you would typically look up the user in your database, 
    // create a session/JWT, and return it.

    return res.status(200).json({
      success: true,
      user: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error verifying Google token:', error.message);
    return res.status(401).json({ success: false, message: 'Token verification failed' });
  }
});

app.listen(port, () => {
  console.log(`Trinetra Back-End Engine running on http://localhost:${port}`);
});
