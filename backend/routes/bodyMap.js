const express = require("express");
const router = express.Router();

const bodyRegions = require("../data/bodyRegions");

router.get("/:region", (req, res) => {

  const region = req.params.region.toLowerCase();

  const symptoms = bodyRegions[region] || [];

  res.json({
    success: true,
    region,
    symptoms
  });

});

module.exports = router;