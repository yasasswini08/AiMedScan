const mongoose = require("mongoose");
const symptomHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  symptoms: { type: [String], required: true },
  predictedDiseases: [{ disease: String, probability: Number, _id: false }],
  severity: { type: String, enum: ["mild","moderate","severe"], default: null },
  createdAt: { type: Date, default: Date.now, index: true },
});
module.exports = mongoose.model("SymptomHistory", symptomHistorySchema);
