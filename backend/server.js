/**
 * server.js — AIMedScan Backend
 * ══════════════════════════════════════════════════════════════════════════════
 * Main Express server. All routes mounted here.
 * ══════════════════════════════════════════════════════════════════════════════
 */
const express   = require("express");
const cors      = require("cors");
const dotenv    = require("dotenv");
const connectDB = require("./config/database");

dotenv.config();
connectDB();

const app = express();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: false, limit: "20mb" }));

// ── Existing routes ───────────────────────────────────────────────────────────
app.use("/api/auth",         require("./routes/authRoutes"));
app.use("/api/predict",      require("./routes/predictionRoutes"));
app.use("/api/history",      require("./routes/historyRoutes"));
app.use("/api/dashboard",    require("./routes/dashboardRoutes"));
app.use("/api/hospitals",    require("./routes/hospitalRoutes"));
app.use("/api/bodymap",      require("./routes/bodyMap"));

// ── NEW: Prescription Analyzer ────────────────────────────────────────────────
app.use("/api/prescription", require("./routes/prescriptionRoutes"));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "AiMedScan API is running", timestamp: new Date().toISOString() })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.originalUrl}` })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error." });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 AIMedScan API running at http://localhost:${PORT}`));
