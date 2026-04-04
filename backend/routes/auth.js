const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

/* ──────────────────────────────────────────────────
   POST /api/auth/google
   Exchange Google access token for user payload,
   upsert Profile in MongoDB, return user + isProfileComplete
────────────────────────────────────────────────── */
router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'No token provided' });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch Google userinfo');
    }

    const payload = await response.json();
    if (!payload.email) {
      return res.status(401).json({ success: false, message: 'Invalid Google payload' });
    }

    console.log(`[AUTH] Google login: ${payload.email} (${payload.name})`);

    let profile = await Profile.findOne({ email: payload.email.toLowerCase() });
    let isProfileComplete = false;

    if (!profile) {
      profile = new Profile({
        email: payload.email.toLowerCase(),
        name: payload.name,
        picture: payload.picture,
      });
      await profile.save();
    } else {
      isProfileComplete =
        !!(profile.userImage || profile.voiceSample || profile.skippedProfile);
    }

    return res.status(200).json({
      success: true,
      user: {
        email: payload.email.toLowerCase(),
        name: payload.name,
        picture: payload.picture,
        isProfileComplete,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('[AUTH] Google token verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Token verification failed' });
  }
});

/* ──────────────────────────────────────────────────
   POST /api/auth/profile
   Upsert user profile with image/voice data
────────────────────────────────────────────────── */
router.post('/profile', async (req, res) => {
  const { email, name, picture, userImage, voiceSample, skippedProfile } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const update = { name, picture };
    if (userImage !== undefined) update.userImage = userImage;
    if (voiceSample !== undefined) update.voiceSample = voiceSample;
    if (skippedProfile !== undefined) update.skippedProfile = skippedProfile;

    const profile = await Profile.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      profile,
    });
  } catch (err) {
    console.error('[PROFILE] Save error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/* ──────────────────────────────────────────────────
   GET /api/auth/profile/:email
   Fetch existing profile
────────────────────────────────────────────────── */
router.get('/profile/:email', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      email: req.params.email.toLowerCase(),
    }).select('-userImage -voiceSample'); // don't send heavy base64 blobs

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error('[PROFILE] Fetch error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
