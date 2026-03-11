/**
 * medicalKnowledge.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central medical knowledge base.
 * Provides: OTC medicines, home remedies, specialist recommendations, and
 * age-safety filters for every disease the AI model may return.
 *
 * PLACEMENT: backend/data/medicalKnowledge.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Per-disease knowledge ─────────────────────────────────────────────────────
const DISEASE_KNOWLEDGE = {
  "Common Cold": {
    medicines: [
      { name: "Paracetamol (Acetaminophen)", purpose: "Fever & pain relief", avoidUnder: null, avoidOver: null },
      { name: "Cetirizine", purpose: "Runny nose & sneezing relief", avoidUnder: 2, avoidOver: null },
      { name: "Phenylephrine nasal spray", purpose: "Nasal congestion relief", avoidUnder: 6, avoidOver: null },
    ],
    remedies: ["Steam inhalation for 10 minutes twice daily", "Warm fluids (honey-ginger tea, broth)", "Saltwater gargle 2–3 times daily", "Rest and sleep 8+ hours", "Humidifier in room at night"],
    doctor: "General Physician",
    specialistNote: "See a GP if symptoms persist beyond 10 days or worsen.",
  },

  "Influenza": {
    medicines: [
      { name: "Paracetamol (Acetaminophen)", purpose: "Fever, headache & body ache relief", avoidUnder: null, avoidOver: null },
      { name: "Ibuprofen", purpose: "Anti-inflammatory & pain relief", avoidUnder: 6, avoidOver: 60 },
      { name: "Dextromethorphan (cough syrup)", purpose: "Cough suppression", avoidUnder: 4, avoidOver: null },
    ],
    remedies: ["Complete bed rest for 3–5 days", "Electrolyte-rich fluids (ORS, coconut water)", "Warm compress for body aches", "Vapour rub on chest & neck", "Isolate to prevent spread"],
    doctor: "General Physician",
    specialistNote: "Seek urgent care if fever exceeds 103 °F or breathing difficulty occurs.",
  },

  "Migraine": {
    medicines: [
      { name: "Paracetamol (Acetaminophen)", purpose: "Mild migraine pain relief", avoidUnder: null, avoidOver: null },
      { name: "Ibuprofen", purpose: "Moderate migraine pain & inflammation", avoidUnder: 12, avoidOver: 60 },
      { name: "Aspirin (low dose)", purpose: "Pain relief", avoidUnder: 16, avoidOver: 70 },
    ],
    remedies: ["Rest in a dark, quiet room", "Cold or warm compress on forehead / neck", "Caffeine in small amounts may help early", "Peppermint or lavender essential oil on temples", "Stay hydrated; avoid skipping meals"],
    doctor: "Neurologist",
    specialistNote: "A neurologist can prescribe triptans or preventive medication for frequent migraines.",
  },

  "Gastroenteritis": {
    medicines: [
      { name: "Oral Rehydration Salts (ORS)", purpose: "Rehydration & electrolyte balance", avoidUnder: null, avoidOver: null },
      { name: "Loperamide (Imodium)", purpose: "Diarrhoea relief", avoidUnder: 6, avoidOver: null },
      { name: "Domperidone", purpose: "Nausea & vomiting control", avoidUnder: null, avoidOver: null },
    ],
    remedies: ["BRAT diet (Bananas, Rice, Applesauce, Toast)", "Clear fluids every 15 minutes in small sips", "Avoid dairy, fatty and spicy foods for 48 h", "Ginger tea for nausea", "Probiotic yoghurt once stable"],
    doctor: "Gastroenterologist",
    specialistNote: "See a gastroenterologist if symptoms last >48 h or blood appears in stool.",
  },

  "Viral Infection": {
    medicines: [
      { name: "Paracetamol (Acetaminophen)", purpose: "Fever & general discomfort", avoidUnder: null, avoidOver: null },
      { name: "Vitamin C (500 mg)", purpose: "Immune support", avoidUnder: null, avoidOver: null },
    ],
    remedies: ["Plenty of water and clear soups", "Rest and avoid strenuous activity", "Vitamin C rich foods (citrus, berries)", "Warm baths to reduce fever", "Monitor temperature every 4 h"],
    doctor: "General Physician",
    specialistNote: "Consult a GP if fever persists >3 days or new symptoms develop.",
  },

  "Bronchitis": {
    medicines: [
      { name: "Guaifenesin (expectorant)", purpose: "Loosens chest mucus", avoidUnder: 4, avoidOver: null },
      { name: "Dextromethorphan (cough syrup)", purpose: "Dry cough suppression at night", avoidUnder: 4, avoidOver: null },
      { name: "Paracetamol (Acetaminophen)", purpose: "Fever & chest discomfort", avoidUnder: null, avoidOver: null },
    ],
    remedies: ["Steam inhalation with eucalyptus oil", "Honey and lemon in warm water", "Avoid smoking and second-hand smoke", "Use a humidifier indoors", "Postural drainage (lean forward) to clear mucus"],
    doctor: "Pulmonologist",
    specialistNote: "A pulmonologist should evaluate if symptoms persist >3 weeks or breathing is laboured.",
  },

  "Allergic Rhinitis": {
    medicines: [
      { name: "Cetirizine", purpose: "Antihistamine for sneezing & runny nose", avoidUnder: 2, avoidOver: null },
      { name: "Loratadine", purpose: "Non-drowsy antihistamine", avoidUnder: 2, avoidOver: null },
      { name: "Fluticasone nasal spray", purpose: "Reduces nasal inflammation", avoidUnder: 4, avoidOver: null },
    ],
    remedies: ["Saline nasal rinse twice daily", "Keep windows closed during high pollen season", "Air purifier in bedroom", "Avoid known allergen triggers", "Wear sunglasses outdoors to protect eyes"],
    doctor: "ENT Specialist",
    specialistNote: "An allergist/ENT can perform allergy testing and recommend immunotherapy.",
  },

  "Sinusitis": {
    medicines: [
      { name: "Paracetamol (Acetaminophen)", purpose: "Facial pain & headache relief", avoidUnder: null, avoidOver: null },
      { name: "Xylometazoline nasal drops", purpose: "Temporary nasal decongestion", avoidUnder: 6, avoidOver: null },
      { name: "Cetirizine", purpose: "Reduces allergic sinusitis symptoms", avoidUnder: 2, avoidOver: null },
    ],
    remedies: ["Warm compress over forehead and cheeks", "Steam inhalation 3× daily", "Saline nasal irrigation (neti pot)", "Stay well hydrated", "Sleep with head elevated"],
    doctor: "ENT Specialist",
    specialistNote: "An ENT specialist can assess for chronic sinusitis or polyps requiring further treatment.",
  },

  "Anxiety Disorder": {
    medicines: [
      { name: "Diphenhydramine (Benadryl — sleep aid only)", purpose: "Short-term sleep disruption", avoidUnder: 12, avoidOver: 65 },
    ],
    remedies: ["4-7-8 deep breathing technique", "Progressive muscle relaxation daily", "Limit caffeine and alcohol", "Regular aerobic exercise (30 min/day)", "Journaling to identify triggers"],
    doctor: "Psychiatrist / Psychologist",
    specialistNote: "A psychiatrist or licensed therapist provides the most effective long-term treatment (CBT, medication).",
  },

  "Pneumonia": {
    medicines: [
      { name: "Paracetamol (Acetaminophen)", purpose: "Fever control", avoidUnder: null, avoidOver: null },
    ],
    remedies: ["Complete bed rest", "Adequate hydration (water, soups)", "Breathing exercises as tolerated", "Sleep on the side to help drainage"],
    doctor: "Pulmonologist",
    specialistNote: "Pneumonia requires immediate professional evaluation. Antibiotics or antivirals may be needed.",
  },

  // ── Skin-related fallback ──────────────────────────────────────────────────
  "Skin Condition": {
    medicines: [
      { name: "Hydrocortisone cream (1%)", purpose: "Reduces skin inflammation & itching", avoidUnder: 2, avoidOver: null },
      { name: "Cetirizine", purpose: "Antihistamine for itching", avoidUnder: 2, avoidOver: null },
    ],
    remedies: ["Cool compress on affected area", "Avoid hot water; lukewarm showers only", "Use fragrance-free moisturiser", "Wear loose, breathable clothing"],
    doctor: "Dermatologist",
    specialistNote: "A dermatologist can diagnose and treat most skin conditions accurately.",
  },

  // ── Default fallback ──────────────────────────────────────────────────────
  "Unknown": {
    medicines: [
      { name: "Paracetamol (Acetaminophen)", purpose: "General pain & fever relief", avoidUnder: null, avoidOver: null },
    ],
    remedies: ["Rest adequately", "Stay well hydrated", "Monitor symptoms closely", "Seek medical advice if symptoms worsen"],
    doctor: "General Physician",
    specialistNote: "Please consult a qualified healthcare professional for an accurate diagnosis.",
  },
};

// ── Age-safety filter ─────────────────────────────────────────────────────────
/**
 * Filters medicine list based on patient age.
 * @param {Array}  medicines - raw medicine array from DISEASE_KNOWLEDGE
 * @param {number|null} age  - patient age in years (null = not provided)
 * @returns {Array}          - filtered array with optional age-warning flag
 */
function filterMedicinesByAge(medicines, age) {
  if (!age || isNaN(age)) return medicines.map((m) => ({ ...m, ageWarning: null }));

  const numAge = parseInt(age, 10);

  return medicines
    .map((m) => {
      let ageWarning = null;

      if (m.avoidUnder !== null && numAge < m.avoidUnder) {
        ageWarning = `Not recommended for children under ${m.avoidUnder}`;
      }
      if (m.avoidOver !== null && numAge > m.avoidOver) {
        ageWarning = `Use with caution for patients over ${m.avoidOver} — consult a doctor`;
      }

      // Extra hard safety rules
      if (numAge < 12 && m.name.toLowerCase().includes("ibuprofen")) {
        ageWarning = "Ibuprofen is not recommended under age 12 without medical supervision";
      }
      if (numAge > 60 && (m.name.toLowerCase().includes("aspirin") || m.name.toLowerCase().includes("naproxen") || m.name.toLowerCase().includes("ibuprofen"))) {
        ageWarning = "Strong NSAIDs carry higher GI/cardiovascular risk in patients over 60 — consult a doctor first";
      }
      if (numAge < 16 && m.name.toLowerCase().includes("aspirin")) {
        ageWarning = "Aspirin is contraindicated in patients under 16 (risk of Reye's syndrome)";
      }

      return { ...m, ageWarning };
    })
    .filter((m) => !(m.avoidUnder !== null && numAge < m.avoidUnder)); // Remove fully inappropriate medicines
}

// ── Emergency symptom detection ───────────────────────────────────────────────
const EMERGENCY_COMBINATIONS = [
  {
    triggers: ["chest pain", "shortness of breath"],
    message: "Chest pain combined with breathing difficulty may indicate a cardiac or pulmonary emergency.",
  },
  {
    triggers: ["chest pain", "difficulty breathing"],
    message: "Chest pain combined with breathing difficulty may indicate a cardiac or pulmonary emergency.",
  },
  {
    triggers: ["chest pain", "left arm pain"],
    message: "These symptoms may indicate a heart attack. Call emergency services immediately.",
  },
  {
    triggers: ["loss of consciousness"],
    message: "Loss of consciousness is a medical emergency. Call emergency services immediately.",
  },
  {
    triggers: ["unconscious"],
    message: "Unconsciousness is a medical emergency. Call emergency services immediately.",
  },
  {
    triggers: ["severe bleeding"],
    message: "Severe bleeding requires immediate emergency care.",
  },
  {
    triggers: ["seizures"],
    message: "Seizures require immediate medical attention.",
  },
  {
    triggers: ["high fever", "neck stiffness"],
    message: "High fever with neck stiffness may indicate meningitis — seek emergency care immediately.",
  },
  {
    triggers: ["sudden severe headache"],
    message: "A sudden severe headache (thunderclap headache) may indicate a serious neurological event.",
  },
  {
    triggers: ["paralysis"],
    message: "Paralysis is a medical emergency. Call emergency services immediately.",
  },
  {
    triggers: ["difficulty breathing"],
    message: "Difficulty breathing requires prompt medical attention — seek care immediately.",
  },
];

/**
 * Detect if entered symptoms contain an emergency combination.
 * @param {string[]} symptoms
 * @returns {{ isEmergency: boolean, message: string|null }}
 */
function detectEmergency(symptoms) {
  const lower = symptoms.map((s) => s.toLowerCase());

  for (const combo of EMERGENCY_COMBINATIONS) {
    const allPresent = combo.triggers.every((trigger) =>
      lower.some((s) => s.includes(trigger))
    );
    if (allPresent) {
      return { isEmergency: true, message: combo.message };
    }
  }

  return { isEmergency: false, message: null };
}

// ── Main enrichment function ──────────────────────────────────────────────────
/**
 * Attaches medical knowledge (medicines, remedies, doctor) to each prediction.
 * @param {Array}       predictions  - enriched prediction objects
 * @param {number|null} patientAge   - patient age from request body
 * @returns {Array}
 */
function attachMedicalKnowledge(predictions, patientAge) {
  return predictions.map((pred) => {
    const name = pred.disease || pred.name || "Unknown";

    // Try exact match first, then fuzzy skin/unknown fallback
    const key =
      DISEASE_KNOWLEDGE[name] ? name
      : Object.keys(DISEASE_KNOWLEDGE).find((k) => name.toLowerCase().includes(k.toLowerCase()))
      || (name.toLowerCase().includes("skin") || name.toLowerCase().includes("rash") || name.toLowerCase().includes("eczema") ? "Skin Condition" : null)
      || "Unknown";

    const knowledge = DISEASE_KNOWLEDGE[key] || DISEASE_KNOWLEDGE["Unknown"];

    const safeMedicines = filterMedicinesByAge(knowledge.medicines, patientAge);

    return {
      ...pred,
      medicines: safeMedicines,
      remedies: knowledge.remedies,
      recommendedDoctor: knowledge.doctor,
      specialistNote: knowledge.specialistNote,
    };
  });
}

module.exports = {
  DISEASE_KNOWLEDGE,
  attachMedicalKnowledge,
  filterMedicinesByAge,
  detectEmergency,
};
