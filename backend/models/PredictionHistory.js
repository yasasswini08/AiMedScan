const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
  disease: {
    type: String,
    required: true,
  },
  probability: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  severity: {
    type: String,
    enum: ["mild", "moderate", "severe"],
    default: "mild",
  },
  precautions: {
    type: [String],
    default: [],
  },
  medicalNote: {
    type: String,
    default: "",
  },
});

const predictionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symptoms: {
      type: [String],
      required: true,
    },
    duration: {
      type: String,
      default: "",
    },
    severity: {
      type: String,
      enum: ["mild", "moderate", "severe"],
      default: "mild",
    },
    predictions: {
      type: [predictionSchema],
      default: [],
    },
    precautions: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PredictionHistory", predictionHistorySchema);
