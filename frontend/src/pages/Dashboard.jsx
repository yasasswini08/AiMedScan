import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

const SEV_EMOJI = { mild:"✅", moderate:"⚠️", severe:"🚨" };
const SEV_COLOR = { mild:"var(--mild-text)", moderate:"var(--moderate-text)", severe:"var(--severe-text)" };
const SEV_BG    = { mild:"var(--mild-bg)",   moderate:"var(--moderate-bg)",   severe:"var(--severe-bg)" };

export default function Dashboard() {
  const { user, token, navigate } = useApp();
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user) { navigate("auth"); return; }
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistory(data.data?.history || []);
    } catch {
      // Demo data fallback
      setHistory([
        { _id:"1", timestamp:"2025-01-10T09:00:00Z", symptoms:["Fever","Cough","Fatigue"],     predictions:[{name:"Influenza",   probability:84, severity:"moderate"}], overallSeverity:"moderate", confidence:84 },
        { _id:"2", timestamp:"2024-12-28T14:30:00Z", symptoms:["Headache","Nausea"],            predictions:[{name:"Migraine",    probability:91, severity:"moderate"}], overallSeverity:"moderate", confidence:91 },
        { _id:"3", timestamp:"2024-12-05T11:00:00Z", symptoms:["Sore throat","Runny nose","Cough"], predictions:[{name:"Common Cold", probability:95, severity:"mild"}],     overallSeverity:"mild",     confidence:95 },
        { _id:"4", timestamp:"2024-11-18T16:00:00Z", symptoms:["Back pain","Fatigue"],          predictions:[{name:"Muscle Strain",probability:78, severity:"mild"}],     overallSeverity:"mild",     confidence:78 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const totalChecks = history.length;
  // Support both "overallSeverity" (legacy) and "severity" (new SymptomHistory) fields
  const getSev = (h) => h.overallSeverity || h.severity || "mild";
  const mildCount   = history.filter(h => getSev(h) === "mild").length;
  const modCount    = history.filter(h => getSev(h) === "moderate").length;
  // Confidence: from legacy "confidence" field or derived from first predictedDisease probability
  const getConf = (h) => {
    if (h.confidence) return h.confidence;
    const pd = (h.predictedDiseases || [])[0];
    if (pd) return Math.round(pd.probability * 100);
    return (h.predictions?.[0]?.probability) || 0;
  };
  const avgConf = history.length
    ? Math.round(history.reduce((a, h) => a + getConf(h), 0) / history.length)
    : 0;

  const freqMap = {};
  history.forEach(h => (h.symptoms || []).forEach(s => { freqMap[s] = (freqMap[s] || 0) + 1; }));
  const topSymptoms = Object.entries(freqMap).sort((a,b) => b[1]-a[1]).slice(0, 6);

  const stats = [
    { label:"Total Checks",   val: totalChecks, icon:"📊", color:"teal" },
    { label:"Mild Cases",     val: mildCount,   icon:"✅", color:"mint" },
    { label:"Moderate Cases", val: modCount,    icon:"⚠️", color:"peach" },
    { label:"Avg Confidence", val: `${avgConf}%`, icon:"🎯", color:"sage" },
  ];

  return (
    <div className="page-wrap dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header animate-fadeUp">
          <div>
            <h1 className="dashboard-greeting">
              Hello, <span>{user?.name || user?.email?.split("@")[0] || "there"}</span> 👋
            </h1>
            <p className="dashboard-subtext">Here's your personal health overview</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("checker")}>
            🩺 New Symptom Check
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div key={s.label} className={`stat-card ${s.color} animate-fadeUp delay-${i+1}`}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Two-column grid */}
        <div className="dashboard-grid">
          {/* History timeline */}
          <div className="history-section animate-fadeUp delay-3">
            <div className="section-header">
              <div className="section-title">Check History</div>
              <button className="btn btn-ghost btn-sm" onClick={fetchHistory}>↺ Refresh</button>
            </div>

            {loading ? (
              <div className="history-list">
                {[1,2,3].map(i => <div key={i} className="skeleton skeleton-row" />)}
              </div>
            ) : history.length === 0 ? (
              <div className="card empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No checks yet</div>
                <div className="empty-state-sub">Your symptom history will appear here</div>
                <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => navigate("checker")}>
                  Start First Check
                </button>
              </div>
            ) : (
              <div className="history-list">
                {history.map((h, i) => {
                  const topDisease =
                    h.predictions?.[0]?.name ||
                    h.predictedDiseases?.[0]?.disease ||
                    "Unknown";
                  const sev = h.overallSeverity || h.severity || "mild";
                  return (
                    <div key={h._id} className={`history-item animate-fadeUp delay-${Math.min(i+1,6)}`}>
                      <div className="history-icon" style={{ background: SEV_BG[sev] }}>
                        {SEV_EMOJI[sev]}
                      </div>
                      <div className="history-info">
                        {/* Predicted disease + probability */}
                        <div className="history-disease">
                          {topDisease}
                          <span className="history-conf" style={{ marginLeft: 8, fontSize: "0.82rem" }}>
                            ({h.confidence || h.predictions?.[0]?.probability || 0}%)
                          </span>
                        </div>
                        {/* Symptoms entered */}
                        <div className="history-symptoms">
                          <span style={{ fontWeight: 500, color: "var(--text-muted)", fontSize: "0.78rem" }}>
                            Symptoms:{" "}
                          </span>
                          {(h.symptoms || []).slice(0, 4).join(", ")}
                          {(h.symptoms || []).length > 4 && " …"}
                        </div>
                      </div>
                      <div className="history-meta">
                        <span className={`badge badge-${sev}`}>{sev}</span>
                        {/* Date of analysis */}
                        <span className="history-date">
                          {new Date(h.timestamp || h.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar: symptom frequency */}
          <div>
            <div className="card animate-fadeUp delay-4">
              <div className="section-title" style={{ marginBottom: 20 }}>Symptom Frequency</div>
              {topSymptoms.length === 0 ? (
                <div className="empty-state" style={{ padding:"20px 0" }}>
                  <div className="empty-state-sub">No data yet</div>
                </div>
              ) : (
                <>
                  {topSymptoms.map(([sym, cnt]) => (
                    <div key={sym} className="freq-row">
                      <div className="freq-label">{sym}</div>
                      <div className="freq-bar-wrap">
                        <FreqBar value={cnt} max={topSymptoms[0][1]} />
                      </div>
                      <div className="freq-count">{cnt}x</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Account info */}
            <div className="card animate-fadeUp delay-5" style={{ marginTop: 16 }}>
              <div className="section-title" style={{ marginBottom:16 }}>Account</div>
              {[
                { label:"Name",   val: user?.name || "—" },
                { label:"Email",  val: user?.email || "—" },
                { label:"Member", val: "Active" },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:"0.82rem", color:"var(--text-muted)" }}>{r.label}</span>
                  <span style={{ fontSize:"0.85rem", fontWeight:600 }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FreqBar({ value, max }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.round((value / max) * 100)), 400);
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div className="progress-track">
      <div className="progress-bar progress-teal" style={{ width: `${w}%` }} />
    </div>
  );
}
