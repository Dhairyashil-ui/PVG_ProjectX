const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    picture: { type: String },
    userImage: { type: String }, // base64 encoded
    voiceSample: { type: String }, // base64 encoded
    skippedProfile: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
