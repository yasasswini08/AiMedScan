/**
 * predictionRoutes.js  (UPDATED)
 * PLACEMENT: backend/routes/predictionRoutes.js  — replaces existing file
 */
const express = require("express");
const router  = express.Router();
const { predict, getFollowUp } = require("../controllers/predictionController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/predict               — main prediction
router.post("/", protect, predict);

// POST /api/predict/followup      — get follow-up questions for given symptoms
router.post("/followup", protect, getFollowUp);

module.exports = router;
