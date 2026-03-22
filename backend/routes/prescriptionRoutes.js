const express = require("express");
const multer  = require("multer");
const router  = express.Router();
const { analyzePrescription, getMedicineInfo } = require("../controllers/prescriptionController");

// ── Multer: keep files in memory (no disk writes), max 10 MB ─────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|tiff|heic|heif|pdf/i;
    const ok = allowed.test(file.mimetype) ||
               allowed.test((file.originalname || "").split(".").pop());
    cb(ok ? null : new Error(`Unsupported file type: ${file.mimetype}`), ok);
  },
});

// ── Conditional multer middleware (only for multipart requests) ───────────────
function maybeUpload(req, res, next) {
  const ct = req.headers["content-type"] || "";
  if (!ct.includes("multipart/form-data")) return next();
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({ success: false, message: "File too large. Maximum 10 MB." });
    return res.status(400).json({ success: false, message: err.message || "Upload error." });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/prescription/analyze  — public (no login required)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/analyze", maybeUpload, analyzePrescription);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/prescription/medicine/:name  — public (no login required)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/medicine/:name", getMedicineInfo);

module.exports = router;
