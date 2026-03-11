const express = require("express");
const router = express.Router();
const { getNearbyHospitals } = require("../controllers/hospitalController");

// Public route - no auth required for hospital lookup
router.get("/", getNearbyHospitals);

module.exports = router;
