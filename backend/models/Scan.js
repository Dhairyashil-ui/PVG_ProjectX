const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    zerotrue_id: { type: String, required: true },
    mediaType: {
      type: String,
      enum: ['image', 'audio', 'video', 'text'],
      required: true,
    },
    originalFilename: { type: String },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    // ZeroTrue result fields
    aiProbability: { type: Number, default: null },
    humanProbability: { type: Number, default: null },
    resultType: { type: String, default: null }, // "ai" | "human" | "uncertain"
    content: { type: String, default: null }, // echoed text content if text scan
    rawResult: { type: mongoose.Schema.Types.Mixed, default: null }, // full ZeroTrue result object
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

// Index for fast per-user history queries
scanSchema.index({ userEmail: 1, createdAt: -1 });

module.exports = mongoose.model('Scan', scanSchema);
