const followUpQuestions = {

  fever: [
    {
      id: "fever_temp",
      question: "How high is your fever?",
      answers: ["Low (<100°F)", "Moderate (100-102°F)", "High (>102°F)"]
    },
    {
      id: "fever_duration",
      question: "How long have you had the fever?",
      answers: ["Less than 1 day", "1-3 days", "More than 3 days"]
    }
  ],

  headache: [
    {
      id: "headache_type",
      question: "What type of headache do you feel?",
      answers: ["Throbbing", "Pressure", "Sharp pain", "One-sided"]
    },
    {
      id: "light_sensitivity",
      question: "Are you sensitive to light?",
      answers: ["Yes", "No"]
    }
  ],

  cough: [
    {
      id: "cough_type",
      question: "What type of cough do you have?",
      answers: ["Dry cough", "Wet cough", "With mucus"]
    },
    {
      id: "cough_duration",
      question: "How long have you had the cough?",
      answers: ["1-3 days", "4-7 days", "More than a week"]
    }
  ],

  dizziness: [
    {
      id: "dizziness_type",
      question: "How does the dizziness feel?",
      answers: ["Spinning", "Lightheaded", "Fainting feeling"]
    }
  ],

  nausea: [
    {
      id: "nausea_frequency",
      question: "How often do you feel nauseous?",
      answers: ["Sometimes", "Often", "Constantly"]
    }
  ],

  vomiting: [
    {
      id: "vomiting_frequency",
      question: "How frequently are you vomiting?",
      answers: ["Once", "Multiple times", "Continuous"]
    }
  ],

  diarrhea: [
    {
      id: "diarrhea_frequency",
      question: "How frequent are the bowel movements?",
      answers: ["3-5 times/day", "More than 5 times/day"]
    }
  ],

  chest_pain: [
    {
      id: "chest_pain_type",
      question: "What type of chest pain do you feel?",
      answers: ["Sharp", "Pressure", "Burning"]
    }
  ],

  shortness_of_breath: [
    {
      id: "breath_severity",
      question: "When does the breathing difficulty occur?",
      answers: ["During exercise", "At rest", "Constant"]
    }
  ],

  sore_throat: [
    {
      id: "swallow_pain",
      question: "Do you feel pain while swallowing?",
      answers: ["Yes", "No"]
    }
  ],

  runny_nose: [
    {
      id: "nasal_discharge",
      question: "What type of nasal discharge do you have?",
      answers: ["Clear", "Yellow", "Green"]
    }
  ],

  fatigue: [
    {
      id: "fatigue_level",
      question: "How severe is your fatigue?",
      answers: ["Mild", "Moderate", "Severe"]
    }
  ],

  abdominal_pain: [
    {
      id: "pain_location",
      question: "Where is the abdominal pain located?",
      answers: ["Upper abdomen", "Lower abdomen", "All over"]
    }
  ],

  back_pain: [
    {
      id: "back_pain_type",
      question: "What type of back pain do you feel?",
      answers: ["Dull ache", "Sharp pain", "Stiffness"]
    }
  ],

  skin_rash: [
    {
      id: "rash_type",
      question: "What type of rash do you see?",
      answers: ["Red spots", "Itchy bumps", "Blisters"]
    }
  ],

  blurred_vision: [
    {
      id: "vision_duration",
      question: "How long does the blurred vision last?",
      answers: ["Few seconds", "Minutes", "Constant"]
    }
  ],

  insomnia: [
    {
      id: "sleep_problem",
      question: "What kind of sleep problem do you have?",
      answers: ["Difficulty falling asleep", "Waking frequently", "Early waking"]
    }
  ],

  anxiety: [
    {
      id: "anxiety_trigger",
      question: "When do you feel anxiety the most?",
      answers: ["Stressful situations", "Randomly", "Most of the day"]
    }
  ]

};

module.exports = followUpQuestions;