const jwt = require("jsonwebtoken");

/**
 * Generate a JWT token for a given user ID.
 * @param {string} id - MongoDB user ObjectId
 * @returns {string} - signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * Classify severity based on symptom count or AI response.
 * Falls back to counting severe-associated symptoms.
 * @param {string[]} symptoms
 * @param {string} inputSeverity - severity provided by user (optional)
 * @returns {string} - 'mild' | 'moderate' | 'severe'
 */
const classifySeverity = (symptoms, inputSeverity) => {
  if (
    inputSeverity &&
    ["mild", "moderate", "severe"].includes(inputSeverity.toLowerCase())
  ) {
    return inputSeverity.toLowerCase();
  }

  const severeKeywords = [
    "chest pain",
    "difficulty breathing",
    "shortness of breath",
    "unconscious",
    "seizure",
    "paralysis",
    "severe bleeding",
    "high fever",
    "loss of consciousness",
    "severe headache",
  ];
  const moderateKeywords = [
    "fever",
    "vomiting",
    "diarrhea",
    "dizziness",
    "fatigue",
    "nausea",
    "body ache",
    "persistent cough",
    "severe pain",
  ];

  const lowerSymptoms = symptoms.map((s) => s.toLowerCase());

  const hasSevere = lowerSymptoms.some((s) =>
    severeKeywords.some((kw) => s.includes(kw))
  );
  if (hasSevere) return "severe";

  const hasModerate = lowerSymptoms.some((s) =>
    moderateKeywords.some((kw) => s.includes(kw))
  );
  if (hasModerate) return "moderate";

  return "mild";
};

/**
 * Generate precaution list based on severity.
 * @param {string} severity
 * @returns {string[]}
 */
const generatePrecautions = (severity) => {
  const precautionMap = {
    mild: [
      "Rest at home",
      "Stay hydrated",
      "Monitor symptoms for worsening",
      "Take over-the-counter medication if needed",
      "Maintain good hygiene",
    ],
    moderate: [
      "Consult a doctor within 24-48 hours",
      "Rest and avoid strenuous activity",
      "Stay hydrated and maintain nutrition",
      "Take prescribed medications as directed",
      "Monitor your temperature if fever is present",
    ],
    severe: [
      "Seek immediate medical attention",
      "Call emergency services if symptoms worsen",
      "Do not drive yourself to the hospital",
      "Keep a record of all symptoms for the doctor",
      "Inform family or friend of your condition",
    ],
  };
  return precautionMap[severity] || precautionMap["mild"];
};

/**
 * Generate recommendations based on severity.
 * @param {string} severity
 * @returns {string[]}
 */
const generateRecommendations = (severity) => {
  const recommendationMap = {
    mild: [
      "Get adequate sleep (7-9 hours)",
      "Eat light, nutritious meals",
      "Avoid crowded public spaces",
      "Wash hands frequently to prevent spread",
    ],
    moderate: [
      "Schedule a medical consultation soon",
      "Avoid self-medicating with antibiotics",
      "Keep a symptom diary",
      "Follow medical advice strictly",
      "Stay home if contagious",
    ],
    severe: [
      "Visit the emergency room or urgent care immediately",
      "Inform a family member or friend of your condition",
      "Bring your medical history to the appointment",
      "Keep emergency contact numbers handy",
      "Do not delay seeking professional medical help",
    ],
  };
  return recommendationMap[severity] || recommendationMap["mild"];
};

/**
 * Generate medical notes for common diseases
 */
const medicalNotesMap = {
  "common cold": "A viral infection affecting the upper respiratory tract. Usually self-limiting and resolves in 7-10 days.",
  "influenza": "A contagious respiratory illness caused by influenza viruses. Requires rest and supportive care.",
  "pneumonia": "An infection that inflames the lungs' air sacs. Requires professional medical evaluation.",
  "bronchitis": "Inflammation of the airways in the lungs. Usually caused by viral infection.",
  "allergic rhinitis": "An allergic reaction causing inflammation of the nasal passages.",
  "asthma": "A chronic condition affecting the airways. Requires proper management and medication.",
  "covid-19": "A viral infection caused by SARS-CoV-2. Follow official health guidelines and testing protocols.",
  "gastroenteritis": "Inflammation of the stomach and intestines, often called 'stomach flu'.",
  "migraine": "A neurological condition characterized by intense, throbbing headaches.",
  "sinusitis": "Inflammation of the sinuses, often following a cold or allergic reaction.",
};

/**
 * Enrich raw AI predictions with severity, precautions, and medical notes.
 * @param {Array} rawPredictions - Array from Flask API
 * @param {string} overallSeverity
 * @returns {Array}
 */
const enrichPredictions = (rawPredictions, overallSeverity) => {
  return rawPredictions.map((pred) => {
    let diseaseSeverity;
    if (pred.probability >= 75) {
      diseaseSeverity = overallSeverity;
    } else if (pred.probability >= 40) {
      diseaseSeverity = overallSeverity === "severe" ? "moderate" : "mild";
    } else {
      diseaseSeverity = "mild";
    }

    const diseaseName = (pred.disease || pred.name || "Unknown").toLowerCase();
    const medicalNote =
      pred.medicalNote ||
      pred.description ||
      medicalNotesMap[diseaseName] ||
      `${pred.disease || "This condition"} requires attention based on your reported symptoms.`;

    return {
      disease: pred.disease || pred.name || "Unknown",
      probability: Math.round(pred.probability || pred.confidence || 0),
      severity: diseaseSeverity,
      precautions: pred.precautions || generatePrecautions(diseaseSeverity),
      medicalNote: medicalNote,
    };
  });
};

module.exports = {
  generateToken,
  classifySeverity,
  generatePrecautions,
  generateRecommendations,
  enrichPredictions,
};
