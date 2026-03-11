const SymptomHistory = require("../models/SymptomHistory");
const PredictionHistory = require("../models/PredictionHistory");
const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      SymptomHistory.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      SymptomHistory.countDocuments({ userId }),
    ]);
    const history = records.map((entry) => {
      const top = (entry.predictedDiseases || [])[0];
      return {
        _id: entry._id,
        symptoms: entry.symptoms || [],
        predictedDiseases: entry.predictedDiseases || [],
        severity: entry.severity || null,
        createdAt: entry.createdAt,
        timestamp: entry.createdAt,
        overallSeverity: entry.severity || "mild",
        confidence: top ? Math.round(top.probability * 100) : 0,
        predictions: (entry.predictedDiseases || []).map((d) => ({ name: d.disease, probability: Math.round(d.probability * 100), severity: entry.severity || "mild" })),
      };
    });
    res.status(200).json({ success: true, data: { history, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } } });
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ success: false, message: "Server error fetching history." });
  }
};
const getHistoryById = async (req, res) => {
  try {
    const entry = await PredictionHistory.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!entry) return res.status(404).json({ success: false, message: "Not found." });
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};
const deleteHistory = async (req, res) => {
  try {
    await Promise.all([
      PredictionHistory.findOneAndDelete({ _id: req.params.id, userId: req.user._id }),
      SymptomHistory.findOneAndDelete({ _id: req.params.id, userId: req.user._id }),
    ]);
    res.status(200).json({ success: true, message: "Deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};
module.exports = { getHistory, getHistoryById, deleteHistory };
