/**
 * followUpEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Follow-Up Question Engine
 * Generates clarifying questions based on entered symptoms to improve
 * prediction accuracy.
 *
 * PLACEMENT: backend/data/followUpEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Follow-up rules ───────────────────────────────────────────────────────────
// Each rule defines: which symptoms trigger the question, the question text,
// and a list of answers that map to additional symptoms for enrichment.

const FOLLOW_UP_RULES = [
  {
    triggers: ["fever", "cough"],
    question: "Do you also have shortness of breath or chest tightness?",
    answerSymptomMap: {
      yes: ["shortness of breath", "chest tightness"],
      no: [],
    },
  },
  {
    triggers: ["headache"],
    question: "Is the headache throbbing / one-sided, or is it a general pressure feeling?",
    answerSymptomMap: {
      throbbing: ["throbbing headache", "light sensitivity"],
      "one-sided": ["throbbing headache", "light sensitivity"],
      pressure: ["sinus headache", "facial pressure"],
    },
  },
  {
    triggers: ["nausea", "vomiting"],
    question: "Have you eaten anything unusual in the last 24 hours, or are you experiencing diarrhoea too?",
    answerSymptomMap: {
      yes: ["food poisoning", "diarrhea"],
      diarrhea: ["diarrhea", "gastroenteritis"],
      no: [],
    },
  },
  {
    triggers: ["chest pain"],
    question: "Does the chest pain radiate to your left arm, jaw, or back?",
    answerSymptomMap: {
      yes: ["left arm pain", "radiating chest pain"],
      no: [],
    },
  },
  {
    triggers: ["runny nose", "sneezing"],
    question: "Do you have itchy eyes or a known allergy history?",
    answerSymptomMap: {
      yes: ["itchy eyes", "allergic reaction"],
      no: [],
    },
  },
  {
    triggers: ["dizziness"],
    question: "Is the dizziness a spinning sensation (vertigo), or more like lightheadedness / faintness?",
    answerSymptomMap: {
      vertigo: ["vertigo"],
      spinning: ["vertigo"],
      lightheaded: ["lightheadedness"],
      faint: ["near-fainting"],
    },
  },
  {
    triggers: ["fatigue", "body aches"],
    question: "Have you been exposed to someone who is sick recently?",
    answerSymptomMap: {
      yes: ["possible infection exposure"],
      no: [],
    },
  },
  {
    triggers: ["skin rash"],
    question: "Is the rash itchy, spreading, or accompanied by fever?",
    answerSymptomMap: {
      itchy: ["itching"],
      spreading: ["spreading rash"],
      fever: ["fever", "rash with fever"],
    },
  },
  {
    triggers: ["abdominal pain"],
    question: "Where is the pain located — upper abdomen, lower right, or diffuse?",
    answerSymptomMap: {
      "upper": ["upper abdominal pain", "possible gastric issue"],
      "lower right": ["lower right abdominal pain", "possible appendicitis"],
      diffuse: ["diffuse abdominal pain"],
    },
  },
  {
    triggers: ["cough"],
    question: "Is the cough dry, or are you producing mucus / phlegm?",
    answerSymptomMap: {
      dry: ["dry cough"],
      mucus: ["productive cough", "mucus"],
      phlegm: ["productive cough", "mucus"],
    },
  },
];

/**
 * Generate follow-up questions based on user's symptom list.
 * Returns at most 2 relevant questions to avoid overwhelming the user.
 *
 * @param {string[]} symptoms - array of symptom strings
 * @returns {Array<{ id: string, question: string, answers: string[], answerSymptomMap: object }>}
 */
function getFollowUpQuestions(symptoms) {
  const lower = symptoms.map((s) => s.toLowerCase());
  const matched = [];

  for (const rule of FOLLOW_UP_RULES) {
    const triggered = rule.triggers.every((t) =>
      lower.some((s) => s.includes(t))
    );
    if (triggered) {
      matched.push({
        id: rule.triggers.join("_"),
        question: rule.question,
        answers: Object.keys(rule.answerSymptomMap),
        answerSymptomMap: rule.answerSymptomMap,
      });
    }
    if (matched.length >= 2) break;
  }

  return matched;
}

/**
 * Resolve follow-up answers into additional symptom strings to append.
 * @param {Array<{ questionId: string, answer: string }>} responses
 * @returns {string[]}
 */
function resolveFollowUpAnswers(responses) {
  const additionalSymptoms = [];

  for (const response of responses) {
    const rule = FOLLOW_UP_RULES.find((r) => r.triggers.join("_") === response.questionId);
    if (!rule) continue;
    const extra = rule.answerSymptomMap[response.answer.toLowerCase()] || [];
    additionalSymptoms.push(...extra);
  }

  // Deduplicate
  return [...new Set(additionalSymptoms)];
}

module.exports = { getFollowUpQuestions, resolveFollowUpAnswers };
