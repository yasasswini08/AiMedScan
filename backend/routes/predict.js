const followUpDB = require("../data/followUpQuestions");

router.post("/predict/followup", (req, res) => {

  const { symptoms } = req.body;

  let questions = [];

  symptoms.forEach(symptom => {

    const key = symptom.toLowerCase().replace(" ", "_");

    if (followUpDB[key]) {
      questions.push(...followUpDB[key]);
    }

  });

  // limit number of questions
  questions = questions.slice(0,4);

  res.json({
    success: true,
    data: {
      followUpQuestions: questions
    }
  });

});