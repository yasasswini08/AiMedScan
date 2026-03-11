import "../styles/hospital-map.css";

export default function HospitalMap({ hospitals, onHospitalClick }) {
  return (
    <div className="hospital-map-container">
      <div className="hospital-map-header">
        <h3 className="hospital-map-title">
          <span className="hospital-icon">🏥</span>
          Nearby Hospitals
        </h3>
      </div>

      {/* Map Placeholder */}
      <div className="hospital-map-placeholder">
        <div className="map-content">
          <span className="map-emoji">🗺️</span>
          <p className="map-text">Google Maps Integration</p>
          <p className="map-subtext">Add API key to enable</p>
        </div>
      </div>

      {/* Hospital List */}
      <div className="hospital-list">
        {hospitals.map((hospital, index) => (
          <div 
            key={index} 
            className="hospital-item"
            onClick={() => onHospitalClick && onHospitalClick(hospital)}
          >
            <div className="hospital-item-icon">
              <span className="hospital-pin">📍</span>
            </div>
            <div className="hospital-item-info">
              <p className="hospital-name">{hospital.name}</p>
              <p className="hospital-distance">{hospital.dist}</p>
            </div>
            <div className="hospital-item-arrow">
              <span className="arrow-icon">→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Call Emergency Button */}
      <button className="emergency-button">
        <span>🚨</span> Emergency Contact
      </button>
    </div>
  );
}
