import ProgressRing from "./ProgressRing";
import "../styles/symptom-card.css";

export default function SymptomCard({ condition, index }) {
  // Handle both old (name, probability) and new field names
  const name = condition.name || condition.disease || "Unknown";
  const probability = condition.probability || condition.confidence || 0;
  const severity = condition.severity || "mild";
  const precautions = condition.precautions || [];

  const severityInfo = {
    mild: { label: "Mild", emoji: "✅", color: "#2ecc71" },
    moderate: { label: "Moderate", emoji: "⚠️", color: "#f39c12" },
    severe: { label: "Severe", emoji: "🚨", color: "#e74c3c" }
  };

  const sev = severityInfo[severity] || severityInfo.mild;

  return (
    <div 
      className={`symptom-card symptom-card-${severity}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Card Header */}
      <div className="symptom-card-header">
        <h3 className="symptom-card-title">{name}</h3>
        <span className="symptom-severity-badge" style={{ color: sev.color }}>
          {sev.emoji} {sev.label}
        </span>
      </div>

      {/* Progress Ring */}
      <div className="symptom-card-progress">
        <ProgressRing value={probability} size={100} severity={severity} />
      </div>

      {/* Confidence Label */}
      <div className="symptom-card-confidence">
        <span className="confidence-label">Confidence</span>
      </div>

      {/* Precautions Section */}
      {precautions && precautions.length > 0 && (
        <div className="symptom-card-precautions">
          <h4 className="precautions-title">Precautions:</h4>
          <ul className="precautions-list">
            {precautions.slice(0, 3).map((precaution, idx) => (
              <li key={idx} className="precaution-item">
                {precaution}
              </li>
            ))}
            {precautions.length > 3 && (
              <li className="precaution-more">+{precautions.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
