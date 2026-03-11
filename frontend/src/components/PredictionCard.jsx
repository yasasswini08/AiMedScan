import CircularProgress from "./CircularProgress";
import "../styles/prediction-card.css";

export default function PredictionCard({ prediction }) {
  const {
    disease,
    probability,
    severity = "mild",
    precautions = [],
    medicalNote = "",
  } = prediction;

  return (
    <div className={`prediction-card prediction-card-${severity}`}>
      {/* Circular Progress Widget */}
      <div className="prediction-card-circular">
        <CircularProgress
          probability={probability}
          severity={severity}
          disease={disease}
        />
      </div>

      {/* Medical Details Section */}
      <div className="prediction-card-details">
        {/* Medical Note */}
        {medicalNote && (
          <div className="prediction-medical-note">
            <div className="prediction-medical-icon">📖</div>
            <div className="prediction-medical-text">{medicalNote}</div>
          </div>
        )}

        {/* Precautions */}
        {precautions && precautions.length > 0 && (
          <div className="prediction-precautions">
            <div className="prediction-precautions-title">Precautions</div>
            <div className="prediction-precautions-list">
              {precautions.map((precaution, idx) => (
                <div key={idx} className="prediction-precaution-item">
                  <span className="prediction-precaution-dot" />
                  <span>{precaution}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
