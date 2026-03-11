const axios = require("axios");
const AI_MODEL_URL = process.env.AI_MODEL_URL || "http://localhost:5000";
const DISEASE_DB = {
  "Common Cold":       { base: 87, keywords: ["runny nose","sore throat","cough","sneezing","congestion"] },
  "Influenza":         { base: 72, keywords: ["fever","body aches","fatigue","chills","headache","cough"] },
  "Migraine":          { base: 80, keywords: ["headache","nausea","blurred vision","sensitivity","dizziness"] },
  "Gastroenteritis":   { base: 75, keywords: ["nausea","vomiting","diarrhea","abdominal pain","cramping"] },
  "Viral Infection":   { base: 65, keywords: ["fever","fatigue","body aches","weakness","loss of appetite"] },
  "Bronchitis":        { base: 70, keywords: ["cough","chest pain","shortness of breath","wheezing","mucus"] },
  "Allergic Rhinitis": { base: 68, keywords: ["sneezing","runny nose","itching","red eyes","congestion"] },
  "Sinusitis":         { base: 66, keywords: ["facial pain","nasal congestion","headache","sore throat","cough"] },
  "Anxiety Disorder":  { base: 60, keywords: ["anxiety","palpitations","sweating","insomnia","restlessness"] },
  "Pneumonia":         { base: 55, keywords: ["high fever","chest pain","shortness of breath","cough","chills"] },
};
const generateLocalPredictions = (symptoms) => {
  const lowerSymptoms = symptoms.map((s) => s.toLowerCase());
  const scored = Object.entries(DISEASE_DB).map(([disease, data]) => {
    const matches = data.keywords.filter((kw) => lowerSymptoms.some((s) => s.includes(kw) || kw.includes(s))).length;
    const matchRatio = matches / data.keywords.length;
    const noise = (Math.random() - 0.5) * 10;
    const probability = Math.round(Math.min(96, Math.max(18, data.base * (0.4 + matchRatio * 0.6) + noise)));
    return { disease, probability };
  });
  return scored.sort((a, b) => b.probability - a.probability).slice(0, 4);
};
const getPredictionsFromAI = async (symptoms) => {
  try {
    const response = await axios.post(`${AI_MODEL_URL}/predict`, { symptoms }, { timeout: 8000 });
    const data = response.data;
    const predictions = Array.isArray(data) ? data : data?.predictions;
    if (Array.isArray(predictions) && predictions.length > 0) return predictions;
    throw new Error("Bad response shape");
  } catch (error) {
    console.log(`[aiService] Using built-in engine (${error.code || error.message})`);
    return generateLocalPredictions(symptoms);
  }
};
module.exports = { getPredictionsFromAI };
