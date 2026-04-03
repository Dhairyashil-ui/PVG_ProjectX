// dotenv not needed for now
const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;

// MongoDB Connection
const MONGO_URI = 'mongodb+srv://carbosafe_db_user:8do8Odfd1h6IPgIq@projectx.liycafo.mongodb.net/?appName=projectx';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB via FlipkartCluster'))
  .catch(err => console.error('MongoDB connection error:', err));

// Profile Schema
const profileSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  picture: { type: String },
  userImage: { type: String }, // base64
  voiceSample: { type: String }, // base64
  skippedProfile: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', profileSchema);

// Update this with the real Google Client ID when deploying
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '954199899941-3efq12bhkrbamu96tc31smvfqhvq0r8o.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Main Auth Route
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'No token provided' });
  }

  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user info with token');
    }

    const payload = await response.json();
    if (!payload.email) {
      return res.status(401).json({ success: false, message: 'Invalid payload' });
    }

    console.log(`User mapped visually: ${payload.email} (${payload.name})`);

    // Lookup existing profile
    let profile = await Profile.findOne({ email: payload.email });
    let isProfileComplete = false;

    if (!profile) {
      // Create it inherently from Google Payload
      profile = new Profile({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
      await profile.save();
    } else {
      // It exists - checking if image OR voice was provided OR if they intentionally skipped
      if (profile.userImage || profile.voiceSample || profile.skippedProfile) {
        isProfileComplete = true;
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        isProfileComplete
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error verifying Google token:', error.message);
    return res.status(401).json({ success: false, message: 'Token verification failed' });
  }
}); app.post('/api/profile', async (req, res) => {
  const { email, name, picture, userImage, voiceSample, skippedProfile } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    let profile = await Profile.findOne({ email });
    if (profile) {
      // Update existing profile
      profile.name = name || profile.name;
      profile.picture = picture || profile.picture;
      if (userImage !== undefined) profile.userImage = userImage;
      if (voiceSample !== undefined) profile.voiceSample = voiceSample;
      if (skippedProfile !== undefined) profile.skippedProfile = skippedProfile;
      
      await profile.save();
    } else {
      // Create new profile
      profile = new Profile({
        email, name, picture, userImage, voiceSample, skippedProfile
      });
      await profile.save();
    }

    return res.status(200).json({ success: true, message: 'Profile saved successfully', profile });
  } catch (err) {
    console.error('Error saving profile:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Trinetra Back-End Engine running on http://localhost:${port}`);
});
