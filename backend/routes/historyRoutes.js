const express = require("express");
const router = express.Router();
const {
  getHistory,
  getHistoryById,
  deleteHistory,
} = require("../controllers/historyController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getHistory);
router.get("/:id", protect, getHistoryById);
router.delete("/:id", protect, deleteHistory);

module.exports = router;
