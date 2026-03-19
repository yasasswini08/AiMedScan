import { useState, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import "../styles/prescription-analyzer.css";

// Tesseract removed — GPT-4 Vision handles all prescription reading on the backend

// ── Category → visual theme ───────────────────────────────────────────────────
const CAT_THEMES = {
  "Analgesic":                  { bg:"#f0fdf4", border:"#86efac", text:"#166534", dot:"#22c55e" },
  "Antipyretic":                { bg:"#f0fdf4", border:"#86efac", text:"#166534", dot:"#22c55e" },
  "Analgesic / Antipyretic":    { bg:"#f0fdf4", border:"#86efac", text:"#166534", dot:"#22c55e" },
  "NSAID":                      { bg:"#fef9c3", border:"#fde047", text:"#854d0e", dot:"#eab308" },
  "NSAID / Antiplatelet":       { bg:"#fef9c3", border:"#fde047", text:"#854d0e", dot:"#eab308" },
  "Antibiotic":                 { bg:"#fff7ed", border:"#fdba74", text:"#9a3412", dot:"#f97316" },
  "Antibiotic (Penicillin":     { bg:"#fff7ed", border:"#fdba74", text:"#9a3412", dot:"#f97316" },
  "Antibiotic (Macrolide":      { bg:"#fff7ed", border:"#fdba74", text:"#9a3412", dot:"#f97316" },
  "Antibiotic (Fluoroquinolone":{ bg:"#fff7ed", border:"#fdba74", text:"#9a3412", dot:"#f97316" },
  "Antibiotic / Antiprotozoal": { bg:"#fff7ed", border:"#fdba74", text:"#9a3412", dot:"#f97316" },
  "Antihistamine":              { bg:"#fdf4ff", border:"#d8b4fe", text:"#6b21a8", dot:"#a855f7" },
  "Antidiabetic":               { bg:"#eff6ff", border:"#93c5fd", text:"#1e40af", dot:"#3b82f6" },
  "Proton Pump Inhibitor":      { bg:"#ecfdf5", border:"#6ee7b7", text:"#065f46", dot:"#10b981" },
  "Corticosteroid":             { bg:"#fff1f2", border:"#fda4af", text:"#9f1239", dot:"#f43f5e" },
  "Antidepressant":             { bg:"#f5f3ff", border:"#c4b5fd", text:"#5b21b6", dot:"#8b5cf6" },
  "Statin":                     { bg:"#fff7ed", border:"#fed7aa", text:"#9a3412", dot:"#fb923c" },
  "Anticoagulant":              { bg:"#fff1f2", border:"#fda4af", text:"#9f1239", dot:"#f43f5e" },
  "Bronchodilator":             { bg:"#f0f9ff", border:"#7dd3fc", text:"#0c4a6e", dot:"#0ea5e9" },
  "Antitussive":                { bg:"#f8fafc", border:"#94a3b8", text:"#334155", dot:"#64748b" },
  "Antidiarrhoeal":             { bg:"#ecfdf5", border:"#86efac", text:"#166534", dot:"#22c55e" },
  "Calcium Channel Blocker":    { bg:"#f0f9ff", border:"#7dd3fc", text:"#0c4a6e", dot:"#0ea5e9" },
  "ACE Inhibitor":              { bg:"#fff7ed", border:"#fdba74", text:"#9a3412", dot:"#f97316" },
  "Anticonvulsant":             { bg:"#fdf4ff", border:"#d8b4fe", text:"#6b21a8", dot:"#a855f7" },
  "Thyroid Hormone":            { bg:"#fef2f2", border:"#fca5a5", text:"#991b1b", dot:"#ef4444" },
};
const DEFAULT_THEME = { bg:"#f8fafc", border:"#e2e8f0", text:"#475569", dot:"#94a3b8" };

function getCatTheme(category = "") {
  for (const [key, theme] of Object.entries(CAT_THEMES)) {
    if (category.toLowerCase().startsWith(key.toLowerCase())) return theme;
  }
  return DEFAULT_THEME;
}

// ════════════════════════════════════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════════════════════════════════════

function ConfidenceRing({ value }) {
  const r    = 28;
  const circ = 2 * Math.PI * r;
  const fill = (value / 100) * circ;
  const col  = value >= 70 ? "#22c55e" : value >= 45 ? "#f59e0b" : "#ef4444";
  const label= value >= 70 ? "High" : value >= 45 ? "Medium" : "Low";
  return (
    <div className="pxa-conf-ring" title={`OCR confidence: ${value.toFixed(0)}%`}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={col} strokeWidth="5"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="pxa-conf-inner">
        <span className="pxa-conf-num" style={{ color: col }}>{Math.round(value)}</span>
        <span className="pxa-conf-pct">%</span>
      </div>
      <div className="pxa-conf-label" style={{ color: col }}>{label} confidence</div>
    </div>
  );
}

function CategoryBadge({ category }) {
  const t = getCatTheme(category);
  return (
    <span className="pxa-cat-badge"
      style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }}>
      <span className="pxa-cat-dot" style={{ background: t.dot }}/>
      {category || "Unknown"}
    </span>
  );
}

function RxBadge({ required }) {
  if (!required) return null;
  return (
    <span className="pxa-rx-badge">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      Rx Only
    </span>
  );
}

function MedicineCard({ med, idx }) {
  const [open, setOpen] = useState(idx === 0);
  const t = getCatTheme(med.category);

  return (
    <div className="pxa-med-card" style={{ borderLeft: `3px solid ${t.dot}`, animationDelay: `${0.04 + idx * 0.06}s` }}>
      <button className="pxa-med-hd" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <div className="pxa-med-hd-l">
          <div className="pxa-med-ico" style={{ background: t.bg }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.dot} strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <div>
            <div className="pxa-med-name">{med.name}</div>
            {med.matchedAs && med.matchedAs.toLowerCase() !== med.name.toLowerCase() && (
              <div className="pxa-med-matched">Detected as: <em>{med.matchedAs}</em></div>
            )}
          </div>
        </div>
        <div className="pxa-med-hd-r">
          <CategoryBadge category={med.category}/>
          <RxBadge required={med.requiresPrescription}/>
          <svg className={`pxa-chevron${open ? " pxa-chevron--open" : ""}`}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="pxa-med-body">
          {/* Purpose */}
          <div className="pxa-section">
            <div className="pxa-section-hd">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
              </svg>
              Purpose
            </div>
            <p>{med.purpose}</p>
          </div>

          {/* Dosage */}
          <div className="pxa-section pxa-section--dosage">
            <div className="pxa-section-hd">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
              </svg>
              General Dosage
            </div>
            <p className="pxa-dosage">{med.dosage}</p>
            <p className="pxa-dosage-note">
              ⚠️ Dosage is general guidance only — always follow your doctor's prescription exactly.
            </p>
          </div>

          {/* Side effects */}
          {med.sideEffects?.length > 0 && (
            <div className="pxa-section">
              <div className="pxa-section-hd">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                Side Effects
              </div>
              <ul className="pxa-tag-list">
                {med.sideEffects.map((s, i) => <li key={i} className="pxa-tag pxa-tag--side">{s}</li>)}
              </ul>
            </div>
          )}

          {/* Precautions */}
          {med.precautions?.length > 0 && (
            <div className="pxa-section">
              <div className="pxa-section-hd">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                Precautions
              </div>
              <ul className="pxa-precaution-list">
                {med.precautions.map((p, i) => (
                  <li key={i}><span className="pxa-bullet"/>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OcrViewer({ segments, rawText }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(rawText); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch {}
  };
  if (!rawText) return null;
  return (
    <div className="pxa-ocr-box">
      <div className="pxa-ocr-top">
        <span className="pxa-ocr-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Extracted Text
        </span>
        <button className="pxa-copy-btn" onClick={copy}>
          {copied
            ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg> Copied!</>
            : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy</>
          }
        </button>
      </div>
      <div className="pxa-ocr-text">
        {segments?.length
          ? segments.map((s, i) =>
              s.highlighted
                ? <mark key={i} className="pxa-hl" title={s.medicine}>{s.text}<span className="pxa-hl-tip">{s.medicine}</span></mark>
                : <span key={i}>{s.text}</span>
            )
          : rawText
        }
      </div>
      {segments?.some(s => s.highlighted) && (
        <div className="pxa-hl-legend"><mark className="pxa-hl pxa-hl--sample">highlighted</mark> = detected medicine</div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="pxa-skeleton">
      <div className="pxa-sk pxa-sk--row">
        <div className="pxa-sk pxa-sk--icon"/>
        <div className="pxa-sk-block">
          <div className="pxa-sk pxa-sk--title"/>
          <div className="pxa-sk pxa-sk--sub"/>
        </div>
      </div>
      <div className="pxa-sk pxa-sk--line"/>
      <div className="pxa-sk pxa-sk--line pxa-sk--short"/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Main Page Component
// ════════════════════════════════════════════════════════════════════════════
export default function PrescriptionAnalyzer() {
  const { token, navigate } = useApp();

  // file state
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [isPdf,   setIsPdf]   = useState(false);
  const [drag,    setDrag]    = useState(false);

  // analysis state
  const [phase,    setPhase]    = useState("idle"); // idle|uploading|analyzing|done|error
  const [ocrText,  setOcrText]  = useState("");
  const [conf,     setConf]     = useState(0);
  const [segments, setSegments] = useState([]);
  const [meds,     setMeds]     = useState([]);
  const [warning,  setWarning]  = useState("");
  const [errMsg,   setErrMsg]   = useState("");

  const fileInputRef = useRef(null);

  // ── Accept file ─────────────────────────────────────────────────────────────
  const acceptFile = useCallback((f) => {
    if (!f) return;
    const ALLOWED_EXT = /\.(jpe?g|png|webp|tiff?|heic|heif|pdf)$/i;
    const ALLOWED_MIME = /image\/(jpeg|jpg|png|webp|tiff|heic|heif)|application\/pdf/i;
    if (!ALLOWED_MIME.test(f.type) && !ALLOWED_EXT.test(f.name)) {
      setErrMsg("Unsupported file. Upload JPG, PNG, WEBP, TIFF, HEIC, or PDF."); return;
    }
    if (f.size > 10 * 1024 * 1024) { setErrMsg("File too large. Maximum 10 MB."); return; }

    const pdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    setFile(f); setIsPdf(pdf);
    setPreview(!pdf ? URL.createObjectURL(f) : null);
    setMeds([]); setSegments([]); setOcrText(""); setWarning(""); setErrMsg(""); setPhase("idle");
  }, []);

  const reset = () => {
    setFile(null); setPreview(null); setIsPdf(false);
    setMeds([]); setSegments([]); setOcrText(""); setWarning(""); setErrMsg("");
    setPhase("idle"); setConf(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Download plain-text report ──────────────────────────────────────────────
  const downloadReport = () => {
    const lines = [
      "PRESCRIPTION ANALYSIS REPORT",
      "═".repeat(48),
      `Date      : ${new Date().toLocaleString()}`,
      `File      : ${file?.name || "N/A"}`,
      `Confidence: ${conf.toFixed(0)}%`,
      `Medicines : ${meds.length} detected`,
      "",
      ...meds.flatMap(m => [
        "─".repeat(40),
        `💊 ${m.name}  (${m.category})`,
        `   Purpose     : ${m.purpose}`,
        `   Dosage      : ${m.dosage}`,
        `   Side effects: ${m.sideEffects?.join("; ") || "See medicine leaflet"}`,
        `   Precautions : ${m.precautions?.join("; ") || "Consult your doctor"}`,
        `   Rx Required : ${m.requiresPrescription ? "Yes — prescription required" : "No"}`,
      ]),
      "",
      "═".repeat(48),
      "⚠️  For informational purposes only.",
      "   Always follow your doctor's prescription exactly.",
      "   Consult your pharmacist if you have any questions.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a    = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `rx-report-${Date.now()}.txt` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  // ── Main analysis ───────────────────────────────────────────────────────────
  const run = async () => {
    if (!file) return;
    setErrMsg(""); setWarning(""); setMeds([]); setSegments([]); setOcrText("");

    // ── Always send image directly to GPT-4 Vision on the backend ─────────────
    // Tesseract produces garbage on handwritten/Telugu prescriptions.
    // GPT-4 Vision handles handwriting, mixed scripts, and blurry images.
    setPhase("uploading");
    try {
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      let res;

      if (isPdf) {
        // PDF: send as file upload
        const form = new FormData(); form.append("file", file);
        res = await fetch("https://aimedscan-z3ra.onrender.com/api/prescription/analyze", { method: "POST", headers, body: form });
      } else {
        // Image: send directly to GPT-4 Vision — skip Tesseract entirely
        const form = new FormData(); form.append("file", file);
        res = await fetch("https://aimedscan-z3ra.onrender.com/api/prescription/analyze", { method: "POST", headers, body: form });
        setPhase("analyzing");
      }

      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Error ${res.status}`); }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Analysis failed");

      const d = data.data;
      setOcrText(d.ocrText || "");
      setConf(d.confidence ?? 0);
      setSegments(d.highlightedSegments || []);
      setMeds(d.medicines || []);
      if (d.warning) setWarning(d.warning);
      setPhase("done");
    } catch (err) {
      setErrMsg(err.message || "Analysis failed. Try a clearer image or check that the server is running.");
      setPhase("error");
    }
  };

  const busy = ["uploading","analyzing"].includes(phase);

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="page-wrap pxa-page">
      {/* Ambient orbs */}
      <div className="pxa-orb pxa-orb--1"/>
      <div className="pxa-orb pxa-orb--2"/>

      <div className="container pxa-container">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="pxa-hero animate-fadeUp">
          <button className="btn btn-ghost pxa-back" onClick={() => navigate("checker")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
            Back
          </button>
          <div className="pxa-hero-text">
            <div className="pxa-badge">
              <span className="pxa-badge-dot"/>
              AI-Powered OCR Analysis
            </div>
            <h1 className="pxa-title">Prescription <em>Analyzer</em></h1>
            <p className="pxa-subtitle">
              Upload a doctor's prescription image or PDF. Our AI reads the text,
              identifies each medicine, and explains its purpose, dosage, and precautions.
            </p>
          </div>
        </div>

        {/* ── Two-column layout ─────────────────────────────────────────────── */}
        <div className="pxa-cols">

          {/* ── LEFT: upload + OCR panel ──────────────────────────────────── */}
          <div className="pxa-left animate-fadeUp" style={{ animationDelay:"0.08s" }}>

            {/* Upload card */}
            <div className="card pxa-upload-card">
              <div className="pxa-upload-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal-dark)" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                Upload Prescription
              </div>

              {/* Drop zone */}
              <div
                className={`pxa-drop${drag ? " pxa-drop--over" : ""}${file ? " pxa-drop--filled" : ""}`}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f); }}
                onClick={() => !file && fileInputRef.current?.click()}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === "Enter" && !file && fileInputRef.current?.click()}
              >
                {file ? (
                  <div className="pxa-preview">
                    {preview
                      ? <img src={preview} alt="Prescription" className="pxa-preview-img"/>
                      : <div className="pxa-pdf-icon">
                          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.3">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                          <p>{file.name}</p>
                          <p className="pxa-file-size">{(file.size/1024/1024).toFixed(2)} MB</p>
                        </div>
                    }
                    <button className="pxa-remove" onClick={e => { e.stopPropagation(); reset(); }} title="Remove">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="pxa-drop-idle">
                    <div className="pxa-drop-icon">
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.4">
                        <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <p className="pxa-drop-title">Drop your prescription here</p>
                    <p className="pxa-drop-sub">or <span className="pxa-drop-link">click to browse</span></p>
                    <p className="pxa-drop-formats">JPG · PNG · WEBP · PDF · TIFF · HEIC — Max 10 MB</p>
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display:"none" }}
                onChange={e => { if (e.target.files?.[0]) acceptFile(e.target.files[0]); }}/>

              {/* Progress: uploading / analyzing */}
              {(phase === "uploading" || phase === "analyzing") && (
                <div className="pxa-status animate-fadeIn">
                  <span className="pxa-spin"/>
                  {phase === "uploading" ? "Uploading to AI service…" : "Identifying medicines…"}
                </div>
              )}

              {/* Error */}
              {errMsg && (
                <div className="pxa-err animate-fadeIn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {errMsg}
                </div>
              )}

              {/* Warning */}
              {warning && (
                <div className="pxa-warn animate-fadeIn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                  {warning}
                </div>
              )}

              {/* Actions */}
              <div className="pxa-actions">
                <button
                  className={`btn pxa-analyze-btn${file && !busy ? " btn-primary" : ""}`}
                  disabled={!file || busy} onClick={run}>
                  {busy
                    ? <><span className="pxa-spin pxa-spin--white"/> Analyzing…</>
                    : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg> Analyze Prescription</>
                  }
                </button>

                {phase === "done" && (
                  <button className="btn btn-secondary pxa-dl-btn" onClick={downloadReport}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Report
                  </button>
                )}

                {(phase === "done" || phase === "error") && (
                  <button className="btn btn-ghost" onClick={reset}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"/>
                      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                    </svg>
                    New
                  </button>
                )}
              </div>

              {/* OCR text viewer */}
              {phase === "done" && ocrText && <OcrViewer segments={segments} rawText={ocrText}/>}
            </div>

            {/* Confidence ring card */}
            {phase === "done" && (
              <div className="card pxa-conf-card animate-scaleIn">
                <ConfidenceRing value={conf}/>
                <div className="pxa-conf-desc">
                  {conf >= 70
                    ? "High-quality extraction — results are reliable."
                    : conf >= 45
                    ? "Medium quality — verify results with your pharmacist."
                    : "Low quality — the image may be blurry or handwritten. Results may be incomplete."
                  }
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: results ──────────────────────────────────────────────── */}
          <div className="pxa-right">

            {/* Empty state */}
            {phase === "idle" && !meds.length && (
              <div className="pxa-empty animate-fadeIn">
                <div className="pxa-empty-icon">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.1">
                    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                  </svg>
                </div>
                <h3>Upload a Prescription</h3>
                <p>Upload a photo or PDF of a doctor's prescription. Our AI reads the medicines and explains each one in plain language.</p>
                <div className="pxa-empty-feats">
                  {[["💊","Medicine name & drug class"],["📋","Purpose & dosage guidance"],["⚠️","Side effects & precautions"],["🔬","Prescription-only status"]].map(([ic, txt]) => (
                    <div key={txt} className="pxa-empty-feat"><span>{ic}</span>{txt}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Skeleton while processing */}
            {busy && (
              <div className="pxa-skel-list animate-fadeIn">
                {[0,1,2].map(i => <SkeletonCard key={i}/>)}
              </div>
            )}

            {/* Error state */}
            {phase === "error" && !meds.length && (
              <div className="pxa-empty pxa-empty--err animate-fadeIn">
                <div className="pxa-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.2">
                    <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                  </svg>
                </div>
                <h3>Analysis Failed</h3>
                <p>{errMsg || "Please try a clearer image or check the server is running."}</p>
              </div>
            )}

            {/* Results */}
            {phase === "done" && (
              <div className="pxa-results animate-fadeIn">
                <div className="pxa-results-hd">
                  <div className="pxa-results-count">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                    </svg>
                    {meds.length} Medicine{meds.length !== 1 ? "s" : ""} Detected
                  </div>
                  <span className="pxa-expand-hint">Click card to expand</span>
                </div>

                {meds.length === 0
                  ? <div className="pxa-no-meds">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.4">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                      <p>No medicines were detected.</p>
                      <p className="pxa-no-meds-hint">Try a clearer image with better lighting, or ensure the medicine names are visible.</p>
                    </div>
                  : <div className="pxa-med-list">
                      {meds.map((m, i) => <MedicineCard key={`${m.name}-${i}`} med={m} idx={i}/>)}
                    </div>
                }

                <div className="pxa-disclaimer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                  This analysis is for <strong>informational purposes only</strong>. Always follow your
                  doctor's prescription exactly and consult your pharmacist before making any changes to your medicines.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Local offline fallback — mirrors a subset of medicine_database.json
// ════════════════════════════════════════════════════════════════════════════
const LDB = {
  paracetamol:  { name:"Paracetamol",  category:"Analgesic / Antipyretic",     purpose:"Relieves mild-moderate pain and reduces fever.", dosage:"500–1000 mg every 4–6 h. Max 4000 mg/day.", sideEffects:["Liver toxicity with overdose","Nausea at high doses"], precautions:["Do not exceed 4000 mg/day","Avoid alcohol"], requiresPrescription:false },
  ibuprofen:    { name:"Ibuprofen",    category:"NSAID",                        purpose:"Anti-inflammatory for pain, fever, and inflammation.", dosage:"200–400 mg every 4–6 h with food. Max 1200 mg/day OTC.", sideEffects:["Stomach irritation","GI bleeding risk"], precautions:["Take with food","Avoid with kidney disease or ulcers"], requiresPrescription:false },
  amoxicillin:  { name:"Amoxicillin",  category:"Antibiotic (Penicillin Class)",purpose:"Antibiotic for bacterial infections.", dosage:"250–500 mg every 8 h as prescribed.", sideEffects:["Diarrhoea","Nausea","Possible rash"], precautions:["Complete full course","Check for penicillin allergy"], requiresPrescription:true },
  cetirizine:   { name:"Cetirizine",   category:"Antihistamine",                purpose:"Relieves allergy symptoms, hay fever, hives, and itching.", dosage:"Adults: 10 mg once daily.", sideEffects:["Mild drowsiness","Dry mouth"], precautions:["Avoid driving if drowsy","Avoid alcohol"], requiresPrescription:false },
  omeprazole:   { name:"Omeprazole",   category:"Proton Pump Inhibitor",        purpose:"Reduces stomach acid for GERD and ulcers.", dosage:"20 mg once daily 30 min before breakfast.", sideEffects:["Headache","Nausea"], precautions:["Take before meals","Do not crush capsules"], requiresPrescription:false },
  metformin:    { name:"Metformin",    category:"Antidiabetic (Biguanide)",     purpose:"Controls blood sugar in Type 2 diabetes.", dosage:"500 mg twice daily with meals; gradually increased.", sideEffects:["Nausea","Diarrhoea (early)"], precautions:["Take with food","Stop before surgery or contrast imaging"], requiresPrescription:true },
  azithromycin: { name:"Azithromycin", category:"Antibiotic (Macrolide)",       purpose:"Macrolide antibiotic for respiratory and skin infections.", dosage:"500 mg Day 1, then 250 mg Days 2–5.", sideEffects:["Nausea","Diarrhoea","QT prolongation"], precautions:["Complete full course","Tell doctor of heart conditions"], requiresPrescription:true },
  aspirin:      { name:"Aspirin",      category:"NSAID / Antiplatelet",         purpose:"Pain, fever, inflammation. Low-dose: cardiovascular prevention.", dosage:"Pain: 300–600 mg every 4–6 h. Cardiac: 75–100 mg/day.", sideEffects:["Stomach irritation","GI bleeding"], precautions:["NOT for under 16s","Avoid with ulcers"], requiresPrescription:false },
};
const LALIASES = { acetaminophen:"paracetamol",calpol:"paracetamol",crocin:"paracetamol",dolo:"paracetamol", brufen:"ibuprofen",advil:"ibuprofen",nurofen:"ibuprofen", amoxil:"amoxicillin",novamox:"amoxicillin", zyrtec:"cetirizine",reactine:"cetirizine", prilosec:"omeprazole",losec:"omeprazole",omez:"omeprazole", glucophage:"metformin",glycomet:"metformin", zithromax:"azithromycin",azithral:"azithromycin", disprin:"aspirin",ecosprin:"aspirin" };
Object.keys(LDB).forEach(k => { LALIASES[k] = k; });

function runLocalFallback(text) {
  const lo = text.toLowerCase(), found = new Set(), out = [];
  for (const [term, key] of Object.entries(LALIASES)) {
    if (new RegExp(`\\b${term}`, "i").test(lo) && !found.has(key) && LDB[key]) {
      found.add(key); out.push({ ...LDB[key], matchedAs: term });
    }
  }
  return out;
}

function makeSegments(text, meds) {
  if (!text || !meds.length) return [];
  const lo = text.toLowerCase(), segs = [], pos = [];
  for (const m of meds) {
    const re = new RegExp(`\\b${(m.matchedAs||m.name).toLowerCase()}\\w*`, "i");
    const hit = re.exec(lo);
    if (hit) pos.push({ start: hit.index, end: hit.index + hit[0].length, name: m.name });
  }
  pos.sort((a,b) => a.start - b.start);
  let cur = 0;
  for (const {start,end,name} of pos) {
    if (start > cur) segs.push({text:text.slice(cur,start),highlighted:false,medicine:null});
    segs.push({text:text.slice(start,end),highlighted:true,medicine:name});
    cur = end;
  }
  if (cur < text.length) segs.push({text:text.slice(cur),highlighted:false,medicine:null});
  return segs;
}
