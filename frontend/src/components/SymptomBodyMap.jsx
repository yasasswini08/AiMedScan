/**
 * SymptomBodyMap.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Visual body region selector.
 * Clicking a region shows related symptoms; clicking a symptom adds it.
 *
 * PLACEMENT: frontend/src/components/SymptomBodyMap.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import "../styles/bodymap.css";

const BODY_REGIONS = {
  Head: {
    emoji: "🧠",
    color: "#7c3aed",
    symptoms: ["Headache", "Dizziness", "Migraine", "Memory loss", "Confusion", "Neck stiffness"],
  },
  Chest: {
    emoji: "🫀",
    color: "#dc2626",
    symptoms: ["Chest pain", "Shortness of breath", "Palpitations", "Wheezing", "Cough"],
  },
  Abdomen: {
    emoji: "🫁",
    color: "#d97706",
    symptoms: ["Abdominal pain", "Nausea", "Vomiting", "Diarrhea", "Bloating", "Heartburn", "Constipation"],
  },
  Skin: {
    emoji: "🩺",
    color: "#059669",
    symptoms: ["Skin rash", "Itching", "Swelling", "Yellow skin", "Red eyes"],
  },
  Arms: {
    emoji: "💪",
    color: "#2563eb",
    symptoms: ["Joint pain", "Muscle cramps", "Numbness", "Tingling", "Swelling"],
  },
  Legs: {
    emoji: "🦵",
    color: "#7c3aed",
    symptoms: ["Joint pain", "Muscle cramps", "Numbness", "Swelling", "Back pain"],
  },
};

// SVG body figure paths
const BODY_SVG_REGIONS = [
  { id: "Head",    label: "Head",    d: "M 95 20 a 25 28 0 1 1 50 0 a 25 28 0 1 1 -50 0", cx: 120, cy: 22, rx: 25, ry: 28 },
  { id: "Chest",   label: "Chest",   rect: { x: 90, y: 65, w: 60, h: 55 } },
  { id: "Abdomen", label: "Abdomen", rect: { x: 90, y: 122, w: 60, h: 50 } },
  { id: "Arms",    label: "Arms",    rects: [{ x: 62, y: 65, w: 25, h: 80 }, { x: 153, y: 65, w: 25, h: 80 }] },
  { id: "Legs",    label: "Legs",    rects: [{ x: 90, y: 174, w: 28, h: 90 }, { x: 122, y: 174, w: 28, h: 90 }] },
  { id: "Skin",    label: "Skin",    special: true },
];

export default function SymptomBodyMap({ onSymptomSelect, selectedSymptoms = [] }) {
  const [activeRegion, setActiveRegion] = useState(null);

  const handleRegionClick = (regionId) => {
    setActiveRegion((prev) => (prev === regionId ? null : regionId));
  };

  const handleSymptomClick = (symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      onSymptomSelect(symptom);
    }
  };

  const region = activeRegion ? BODY_REGIONS[activeRegion] : null;

  return (
    <div className="bm-wrapper">
      <div className="bm-header">
        <span className="bm-icon">🫀</span>
        <div>
          <div className="bm-title">Body Map</div>
          <div className="bm-subtitle">Click a body region to see related symptoms</div>
        </div>
      </div>

      <div className="bm-layout">
        {/* SVG figure */}
        <div className="bm-figure-wrap">
          <svg viewBox="0 0 240 280" className="bm-svg" aria-label="Human body diagram">
            {/* Head */}
            <ellipse
              cx="120" cy="32" rx="26" ry="28"
              className={`bm-region${activeRegion === "Head" ? " bm-region--active" : ""}`}
              style={{ fill: activeRegion === "Head" ? BODY_REGIONS.Head.color + "40" : "transparent", stroke: BODY_REGIONS.Head.color }}
              onClick={() => handleRegionClick("Head")}
              tabIndex={0}
              role="button"
              aria-label="Head region"
            />
            {/* Neck */}
            <rect x="112" y="60" width="16" height="10" rx="4" fill="#e2e8f0" stroke="#cbd5e1" />
            {/* Torso */}
            <rect
              x="88" y="72" width="64" height="55" rx="8"
              className={`bm-region${activeRegion === "Chest" ? " bm-region--active" : ""}`}
              style={{ fill: activeRegion === "Chest" ? BODY_REGIONS.Chest.color + "40" : "transparent", stroke: BODY_REGIONS.Chest.color }}
              onClick={() => handleRegionClick("Chest")}
              tabIndex={0}
              role="button"
              aria-label="Chest region"
            />
            {/* Abdomen */}
            <rect
              x="88" y="128" width="64" height="52" rx="8"
              className={`bm-region${activeRegion === "Abdomen" ? " bm-region--active" : ""}`}
              style={{ fill: activeRegion === "Abdomen" ? BODY_REGIONS.Abdomen.color + "40" : "transparent", stroke: BODY_REGIONS.Abdomen.color }}
              onClick={() => handleRegionClick("Abdomen")}
              tabIndex={0}
              role="button"
              aria-label="Abdomen region"
            />
            {/* Left arm */}
            <rect
              x="58" y="72" width="28" height="78" rx="10"
              className={`bm-region${activeRegion === "Arms" ? " bm-region--active" : ""}`}
              style={{ fill: activeRegion === "Arms" ? BODY_REGIONS.Arms.color + "40" : "transparent", stroke: BODY_REGIONS.Arms.color }}
              onClick={() => handleRegionClick("Arms")}
              tabIndex={0}
              role="button"
              aria-label="Left arm"
            />
            {/* Right arm */}
            <rect
              x="154" y="72" width="28" height="78" rx="10"
              className={`bm-region${activeRegion === "Arms" ? " bm-region--active" : ""}`}
              style={{ fill: activeRegion === "Arms" ? BODY_REGIONS.Arms.color + "40" : "transparent", stroke: BODY_REGIONS.Arms.color }}
              onClick={() => handleRegionClick("Arms")}
            />
            {/* Left leg */}
            <rect
              x="88" y="182" width="30" height="88" rx="10"
              className={`bm-region${activeRegion === "Legs" ? " bm-region--active" : ""}`}
              style={{ fill: activeRegion === "Legs" ? BODY_REGIONS.Legs.color + "40" : "transparent", stroke: BODY_REGIONS.Legs.color }}
              onClick={() => handleRegionClick("Legs")}
              tabIndex={0}
              role="button"
              aria-label="Left leg"
            />
            {/* Right leg */}
            <rect
              x="122" y="182" width="30" height="88" rx="10"
              className={`bm-region${activeRegion === "Legs" ? " bm-region--active" : ""}`}
              style={{ fill: activeRegion === "Legs" ? BODY_REGIONS.Legs.color + "40" : "transparent", stroke: BODY_REGIONS.Legs.color }}
              onClick={() => handleRegionClick("Legs")}
            />

            {/* Region labels */}
            {[
              { id: "Head",    x: 120, y: 33 },
              { id: "Chest",   x: 120, y: 102 },
              { id: "Abdomen", x: 120, y: 156 },
              { id: "Arms",    x: 72,  y: 115 },
              { id: "Legs",    x: 120, y: 230 },
            ].map(({ id, x, y }) => (
              <text
                key={id}
                x={x} y={y}
                textAnchor="middle"
                className="bm-label"
                style={{ fill: BODY_REGIONS[id]?.color, fontSize: "9px", fontWeight: "600", pointerEvents: "none" }}
              >
                {id}
              </text>
            ))}
          </svg>

          {/* Skin button (special — not on body) */}
          <button
            className={`bm-skin-btn${activeRegion === "Skin" ? " bm-skin-btn--active" : ""}`}
            style={{ borderColor: BODY_REGIONS.Skin.color, color: activeRegion === "Skin" ? "#fff" : BODY_REGIONS.Skin.color, background: activeRegion === "Skin" ? BODY_REGIONS.Skin.color : "transparent" }}
            onClick={() => handleRegionClick("Skin")}
          >
            🩺 Skin / Eyes
          </button>
        </div>

        {/* Symptom panel */}
        <div className="bm-panel">
          {!activeRegion ? (
            <div className="bm-empty">
              <div className="bm-empty-icon">👆</div>
              <p>Click a body region to see related symptoms</p>
            </div>
          ) : (
            <div className="bm-region-panel" style={{ "--region-color": region.color }}>
              <div className="bm-region-title" style={{ color: region.color }}>
                <span>{region.emoji}</span>
                {activeRegion}
              </div>
              <div className="bm-symptom-list">
                {region.symptoms.map((symptom) => {
                  const already = selectedSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      className={`bm-symptom-pill${already ? " bm-symptom-pill--added" : ""}`}
                      style={already ? {} : { borderColor: region.color, color: region.color }}
                      onClick={() => handleSymptomClick(symptom)}
                      disabled={already}
                    >
                      {already ? "✓ " : "+ "}
                      {symptom}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
