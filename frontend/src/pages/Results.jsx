import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import "../styles/results.css";
import "../styles/results-extended.css";

// ─── Leaflet CDN loader ────────────────────────────────────────────────────────
function useLeaflet() {
  const [ready, setReady] = useState(!!window.L);
  useEffect(() => {
    if (window.L) { setReady(true); return; }
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);
  return ready;
}

function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchNearbyHospitals(lat, lon, radius = 5000) {
  const query = `[out:json][timeout:20];(node["amenity"="hospital"](around:${radius},${lat},${lon});node["amenity"="clinic"](around:${radius},${lat},${lon});node["healthcare"="hospital"](around:${radius},${lat},${lon});way["amenity"="hospital"](around:${radius},${lat},${lon});way["amenity"="clinic"](around:${radius},${lat},${lon}););out center 20;`;
  const res  = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
  const data = await res.json();
  return (data.elements || [])
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) return null;
      return { id: el.id, name: el.tags?.name || "Hospital / Clinic", type: el.tags?.amenity === "clinic" ? "Clinic" : "Hospital", address: [el.tags?.["addr:street"], el.tags?.["addr:city"]].filter(Boolean).join(", ") || "Address not available", phone: el.tags?.phone || null, lat: elLat, lon: elLon, dist: distKm(lat, lon, elLat, elLon) };
    })
    .filter(Boolean)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 8);
}

function HospitalMap({ userLat, userLon, hospitals, selectedIdx, onSelect }) {
  const mapRef      = useRef(null);
  const leafletRef  = useRef(null);
  const markersRef  = useRef([]);
  const leafletReady = useLeaflet();

  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafletRef.current) return;
    const L   = window.L;
    const map = L.map(mapRef.current).setView([userLat, userLon], 14);
    leafletRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
    L.marker([userLat, userLon], { icon: L.divIcon({ html: `<div style="background:#1CA7A8;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(28,167,168,0.4)"></div>`, className: "", iconAnchor: [8, 8] }) }).addTo(map).bindPopup("<b>📍 Your Location</b>").openPopup();
    hospitals.forEach((h, i) => {
      const marker = L.marker([h.lat, h.lon], { icon: L.divIcon({ html: `<div style="background:#e74c3c;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer">🏥</div>`, className: "", iconAnchor: [14, 14] }) }).addTo(map).bindPopup(`<b>${h.name}</b><br/>${h.type}<br/>${h.dist.toFixed(1)} km away`).on("click", () => onSelect(i));
      markersRef.current.push(marker);
    });
  }, [leafletReady, hospitals]);

  useEffect(() => {
    if (!leafletRef.current || selectedIdx === null) return;
    const h = hospitals[selectedIdx];
    if (!h) return;
    leafletRef.current.setView([h.lat, h.lon], 16, { animate: true });
    markersRef.current[selectedIdx]?.openPopup();
  }, [selectedIdx]);

  return <div ref={mapRef} style={{ width: "100%", height: "320px", borderRadius: "10px", zIndex: 1 }} />;
}

function HospitalsSidebar() {
  const [status, setStatus]           = useState("idle");
  const [userCoords, setUserCoords]   = useState(null);
  const [hospitals, setHospitals]     = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");

  const locate = () => {
    setStatus("locating"); setErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setUserCoords({ lat, lon }); setStatus("loading");
        try { const r = await fetchNearbyHospitals(lat, lon); setHospitals(r); setStatus("ready"); if (r.length > 0) setSelectedIdx(0); }
        catch { setErrorMsg("Could not fetch hospitals."); setStatus("error"); }
      },
      (err) => { setErrorMsg(err.code === 1 ? "Location access denied." : "Could not get location."); setStatus("error"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="hospitals-sidebar">
      <h2 className="section-title">Nearby Hospitals</h2>
      {(status === "idle" || status === "error") && (
        <div className="map-locate-box">
          <div className="map-locate-icon">🗺️</div>
          <p className="map-locate-title">Find hospitals near you</p>
          <p className="map-locate-sub">Uses your device location to find real nearby hospitals and clinics.</p>
          {errorMsg && <p className="map-error-msg">⚠️ {errorMsg}</p>}
          <button className="map-locate-btn" onClick={locate}>📍 Use My Location</button>
        </div>
      )}
      {(status === "locating" || status === "loading") && (
        <div className="map-loading-box"><div className="map-spinner" /><p>{status === "locating" ? "Getting your location…" : "Finding nearby hospitals…"}</p></div>
      )}
      {status === "ready" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <HospitalMap userLat={userCoords.lat} userLon={userCoords.lon} hospitals={hospitals} selectedIdx={selectedIdx} onSelect={setSelectedIdx} />
          </div>
          {hospitals.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "16px 0" }}>No hospitals found within 5 km.</p>
          ) : (
            <div className="hospitals-list">
              {hospitals.map((h, i) => (
                <div key={h.id} className={`hospital-card${selectedIdx === i ? " selected" : ""}`} onClick={() => setSelectedIdx(i)}>
                  <div className="hospital-header"><h4>{h.name}</h4><span className="distance">{h.dist.toFixed(1)} km</span></div>
                  <div className="hospital-details"><p className="hospital-type">{h.type}</p><p className="hospital-address">📍 {h.address}</p>{h.phone && <p className="hospital-address">📞 {h.phone}</p>}</div>
                  <a href={`https://www.openstreetmap.org/?mlat=${h.lat}&mlon=${h.lon}&zoom=17`} target="_blank" rel="noopener noreferrer" className="map-btn" onClick={(e) => e.stopPropagation()}>View on Map →</a>
                </div>
              ))}
            </div>
          )}
          <button className="map-relocate-btn" onClick={() => { setStatus("idle"); setHospitals([]); setSelectedIdx(null); }}>↺ Search Again</button>
        </>
      )}
    </div>
  );
}

// ─── Emergency Banner ─────────────────────────────────────────────────────────
function EmergencyBanner({ emergency }) {
  if (!emergency?.isEmergency) return null;
  return (
    <div className="rx-emergency-banner">
      <div className="rx-emergency-icon">⚠️</div>
      <div className="rx-emergency-content">
        <div className="rx-emergency-title">Emergency Warning</div>
        <p>{emergency.message}</p>
        <p className="rx-emergency-action">🚨 Seek immediate medical attention or call emergency services.</p>
      </div>
    </div>
  );
}

// ─── Disease Card (extended) ───────────────────────────────────────────────────
function DiseaseCard({ disease, delay }) {

  const [animatedValue, setAnimatedValue] = useState(0);
  const [showMeds, setShowMeds] = useState(false);
  const [showRemedies, setShowRemedies] = useState(false);

  const medicines = disease.medicines || [];
  const remedies = disease.remedies || [];
  const precautions = disease.precautions || [];
  const suggestions = disease.suggestions || [];

  const doctor = disease.recommendedDoctor || null;
  const note = disease.specialistNote || null;

  useEffect(() => {
    const t = setTimeout(() => setAnimatedValue(disease.probability), 150 + delay * 1000);
    return () => clearTimeout(t);
  }, [disease.probability]);

  return (
    <div
      className={`disease-card disease-card-${disease.severity} rx-card-animate`}
      style={{ animationDelay: `${delay}s` }}
    >

      <div className="card-header">
        <h3>{disease.name}</h3>
        <span className="severity-badge">{disease.severity}</span>
      </div>

      <div className="card-progress">
        <svg className="progress-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" className="progress-bg" />
          <circle
            cx="60"
            cy="60"
            r="54"
            className="progress-fill"
            style={{
              strokeDasharray: `${(animatedValue / 100) * 2 * Math.PI * 54} ${2 * Math.PI * 54}`,
            }}
          />
        </svg>
        <div className="progress-text">{animatedValue}%</div>
      </div>

      <p className="card-description">{disease.description}</p>

      {/* Doctor */}
      {doctor && (
        <div className="rx-doctor-badge">
          <span>👨‍⚕️</span>
          <div>
            <div>Recommended Specialist</div>
            <div>{doctor}</div>
            {note && <div>{note}</div>}
          </div>
        </div>
      )}

      {/* Medicines */}
      {medicines.length > 0 && (
        <div className="rx-section">
          <button onClick={() => setShowMeds(!showMeds)}>
            💊 Low Risk Medicines
          </button>

          {showMeds && medicines.map((med,i)=>(
            <div key={i}>
              <strong>{med.name}</strong>
              <p>{med.purpose}</p>
            </div>
          ))}
        </div>
      )}

      {/* Remedies */}
      {remedies.length > 0 && (
        <div className="rx-section">
          <button onClick={()=>setShowRemedies(!showRemedies)}>
            🌿 Home Remedies
          </button>

          {showRemedies && remedies.map((r,i)=>(
            <div key={i}>{r}</div>
          ))}
        </div>
      )}

      {/* Precautions */}
      {precautions.length > 0 && (
        <div className="rx-section">
          <h4>🛡 Precautions</h4>
          <ul>
            {precautions.map((p,i)=>(
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="rx-section">
          <h4>💡 Suggestions</h4>
          <ul>
            {suggestions.map((s,i)=>(
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
// ─── ──────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Main Results Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Results() {
  const { results, navigate, setResults } = useApp();

  if (!results) { navigate("checker"); return null; }

  // Top 2 predictions
  const predictions = (results.predictions || results.conditions || [])
  .slice(0, 2)
  .map((p) => ({
    name:               p.name || p.disease || "Unknown",
    probability:        Math.round(p.probability || p.confidence || 0),
    severity:           p.severity || "mild",
    description:        p.description || p.medicalNote || "Medical condition detected",

    medicines:          p.medicines || [],
    remedies:           p.remedies || [],

    precautions:        p.precautions || [],
    suggestions:         p.recommendations || [],

    recommendedDoctor:  p.recommendedDoctor || null,
    specialistNote:     p.specialistNote || null,
  }));

  const totalConfidence   = results.confidence || predictions[0]?.probability || 0;
  const symptoms          = results.symptoms   || [];
  const mostLikely        = predictions[0]     || { name: "Unknown", probability: 0 };
  const emergency         = results.emergency  || null;
  const followUpQuestions = results.followUpQuestions || [];

  const downloadReport = () => {
    const text = `
AI MEDICAL SYMPTOM ANALYSIS REPORT
=====================================
Date: ${new Date(results.timestamp).toLocaleString()}
Symptoms: ${symptoms.join(", ")}

TOP PREDICTIONS:
${predictions.map((p) => `• ${p.name}: ${p.probability}% confidence\n  Doctor: ${p.recommendedDoctor || "N/A"}`).join("\n")}

SUMMARY:
- Most likely: ${mostLikely.name}
- Overall confidence: ${totalConfidence}%
- Key symptoms: ${symptoms.slice(0, 3).join(", ")}

⚠️ DISCLAIMER: This analysis is informational only. Consult a healthcare professional.
    `;
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `health-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="results-container">
      <header className="results-header">
        <button className="back-btn" onClick={() => navigate("checker")}>← Back</button>
        <div className="header-content">
          <h1>Health Analysis Results</h1>
          <p className="timestamp">
            {new Date(results.timestamp).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </header>

      <div className="results-content">
        <div className="results-left">

          {/* ── Emergency Banner ────────────────────────────────────────────── */}
          <EmergencyBanner emergency={emergency} />

          {/* ── Top 2 Predictions ───────────────────────────────────────────── */}
          <section className="predictions-section">
            <h2 className="section-title">Top Predictions</h2>
            <div className="predictions-grid">
              {predictions.map((pred, index) => (
                <DiseaseCard key={index} disease={pred} delay={index * 0.15} />
              ))}
            </div>
          </section>

          {/* ── Follow-Up Questions ─────────────────────────────────────────── */}
         

          {/* ── Medical Summary ─────────────────────────────────────────────── */}
          <section className="summary-section">
            <h2 className="section-title">Medical Summary</h2>
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label">Most likely condition:</span>
                <span className="summary-value">{mostLikely.name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Confidence level:</span>
                <span className="summary-value">{totalConfidence}%</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Key symptoms detected:</span>
                <span className="summary-value">{symptoms.slice(0, 3).join(", ")}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Suggested next step:</span>
                <span className="summary-value">Consult a healthcare professional if symptoms persist</span>
              </div>
            </div>
          </section>

          <div className="action-buttons">
            <button className="btn-primary rx-btn-hover" onClick={downloadReport}>📥 Download Report</button>
            <button className="btn-secondary rx-btn-hover" onClick={() => { setResults(null); navigate("checker"); }}>
              ↻ New Analysis
            </button>
          </div>

          <div className="disclaimer">
            <p>
              <strong>⚠️ Disclaimer:</strong> This analysis is for informational purposes only and
              does not constitute medical advice. Always consult with a qualified healthcare
              professional for diagnosis and treatment.
            </p>
          </div>
        </div>

        <aside className="results-right">
          <HospitalsSidebar />
        </aside>
      </div>
    </div>
  );
}
