const { getPredictionsFromAI }    = require("../services/aiService");
const PredictionHistory           = require("../models/PredictionHistory");
const SymptomHistory              = require("../models/SymptomHistory");
const {
  classifySeverity,
  generatePrecautions,
  generateRecommendations,
  enrichPredictions,
}                                  = require("../utils/helpers");
const {
  attachMedicalKnowledge,
  detectEmergency,
}                                  = require("../data/medicalKnowledge");
const {
  getFollowUpQuestions,
  resolveFollowUpAnswers,
}                                  = require("../data/followUpEngine");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/predict
// Body: { symptoms, duration, severity, age, followUpAnswers? }
// ─────────────────────────────────────────────────────────────────────────────
const predict = async (req, res) => {
  try {
    const {
      symptoms,
      duration,
      severity: inputSeverity,
      age,
      followUpAnswers,   // optional: [{ questionId, answer }]
    } = req.body;

    // ── Validate symptoms ───────────────────────────────────────────────────
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide at least one symptom." });
    }

    let sanitizedSymptoms = symptoms
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter((s) => s.length > 0);

    if (sanitizedSymptoms.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide valid symptom(s)." });
    }

    // ── Enrich symptoms with follow-up answers ──────────────────────────────
    if (Array.isArray(followUpAnswers) && followUpAnswers.length > 0) {
      const extra = resolveFollowUpAnswers(followUpAnswers);
      if (extra.length > 0) {
        sanitizedSymptoms = [...new Set([...sanitizedSymptoms, ...extra])];
        console.log(`[predict] Follow-up added: ${extra.join(", ")}`);
      }
    }

    // ── Emergency detection ─────────────────────────────────────────────────
    const emergency = detectEmergency(sanitizedSymptoms);

    // ── AI predictions ──────────────────────────────────────────────────────
    let rawPredictions = await getPredictionsFromAI(sanitizedSymptoms);
    if (!Array.isArray(rawPredictions)) rawPredictions = rawPredictions?.predictions || [];
    if (rawPredictions.length === 0) rawPredictions = [{ disease: "Unable to determine", probability: 0 }];

    // ── Sort by probability and keep TOP 2 only ─────────────────────────────
    rawPredictions.sort((a, b) => (b.probability || 0) - (a.probability || 0));
    const top2Raw = rawPredictions.slice(0, 2);

    // ── Severity, enrich ────────────────────────────────────────────────────
    const severity           = classifySeverity(sanitizedSymptoms, inputSeverity);
    const enrichedPredictions = enrichPredictions(top2Raw, severity);

    // ── Attach medical knowledge (medicines + remedies + doctor) ────────────
    const patientAge = age ? parseInt(age, 10) : null;
    const finalPredictions = attachMedicalKnowledge(enrichedPredictions, patientAge);

    // ── Standard precautions & recommendations ──────────────────────────────
    const precautions     = generatePrecautions(severity);
    const recommendations = generateRecommendations(severity);

    // ── Generate follow-up questions for NEXT iteration ────────────────────
    const followUpQuestions = getFollowUpQuestions(sanitizedSymptoms);

    // ── Persist to DB ───────────────────────────────────────────────────────
    const historyEntry = await PredictionHistory.create({
      userId:      req.user._id,
      symptoms:    sanitizedSymptoms,
      duration:    duration || "",
      severity,
      predictions: finalPredictions,
      precautions,
      recommendations,
      timestamp:   new Date(),
    });

    const predictedDiseases = finalPredictions.map((p) => ({
      disease:     p.disease || p.name || "Unknown",
      probability: p.probability > 1
        ? parseFloat((p.probability / 100).toFixed(4))
        : parseFloat(p.probability.toFixed(4)),
    }));

    await SymptomHistory.create({
      userId:           req.user._id,
      symptoms:         sanitizedSymptoms,
      predictedDiseases,
      severity,
      createdAt:        new Date(),
    });

    console.log(
      `[predict] ✅ user=${req.user._id} | symptoms=${sanitizedSymptoms.join(", ")} | severity=${severity} | top2=${finalPredictions.map((p) => p.disease).join(", ")}`
    );

    // ── Response ────────────────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      data: {
        id:              historyEntry._id,
        predictions:     finalPredictions,   // TOP 2 with medicines/remedies/doctor
        severity,
        precautions,
        recommendations,
        emergency,                           // { isEmergency, message }
        followUpQuestions,                   // [] or up to 2 clarifying Qs
        timestamp:       historyEntry.timestamp,
      },
    });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ success: false, message: "Server error during prediction. Please try again." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/predict/followup
// Body: { symptoms, followUpAnswers: [{ questionId, answer }] }
// Returns: refined follow-up questions (or empty if ready to predict)
// ─────────────────────────────────────────────────────────────────────────────
const getFollowUp = async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ success: false, message: "Symptoms required." });
    }

    const questions = getFollowUpQuestions(symptoms.map((s) => s.trim()));
    res.status(200).json({ success: true, data: { followUpQuestions: questions } });
  } catch (error) {
    console.error("Follow-up error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { predict, getFollowUp };
