const PredictionHistory = require("../models/PredictionHistory");

// @desc    Get dashboard analytics for the logged-in user
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all user predictions
    const allPredictions = await PredictionHistory.find({ userId })
      .sort({ timestamp: -1 })
      .lean();

    const totalChecks = allPredictions.length;

    // Recent 5 predictions
    const recentPredictions = allPredictions.slice(0, 5).map((entry) => ({
      id: entry._id,
      symptoms: entry.symptoms,
      severity: entry.severity,
      predictions: entry.predictions.slice(0, 2), // top 2 for preview
      timestamp: entry.timestamp,
    }));

    // Symptom frequency stats
    const symptomStats = {};
    allPredictions.forEach((entry) => {
      entry.symptoms.forEach((symptom) => {
        const key = symptom.toLowerCase().trim();
        symptomStats[key] = (symptomStats[key] || 0) + 1;
      });
    });

    // Sort symptomStats and return top 10
    const sortedSymptomStats = Object.fromEntries(
      Object.entries(symptomStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    );

    // Severity distribution stats
    const severityStats = { mild: 0, moderate: 0, severe: 0 };
    allPredictions.forEach((entry) => {
      if (severityStats[entry.severity] !== undefined) {
        severityStats[entry.severity]++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalChecks,
        recentPredictions,
        symptomStats: sortedSymptomStats,
        severityStats,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching dashboard data.",
    });
  }
};

module.exports = { getDashboard };
