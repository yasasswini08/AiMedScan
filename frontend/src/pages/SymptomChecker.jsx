import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import SymptomBodyMap from "../components/SymptomBodyMap";
import "../styles/checker-enhanced.css";
import "../styles/bodymap.css";

const ALL_SYMPTOMS = [
  "Fever","Cough","Headache","Fatigue","Nausea","Vomiting","Diarrhea",
  "Chest pain","Shortness of breath","Sore throat","Runny nose","Body aches",
  "Chills","Sweating","Dizziness","Back pain","Abdominal pain",
  "Loss of appetite","Joint pain","Skin rash","Itching","Swelling",
  "Blurred vision","Ear pain","Muscle cramps","Numbness","Tingling",
  "Palpitations","Anxiety","Insomnia","Weight loss","Frequent urination",
  "Constipation","Bloating","Heartburn","Neck stiffness","Seizures",
  "Memory loss","Confusion","Yellow skin","Red eyes",
];

const QUICK = ["Fever","Headache","Cough","Fatigue","Nausea","Dizziness","Chest pain"];

function extractSymptomsFromSpeech(text) {
  const t = text.toLowerCase();
  return ALL_SYMPTOMS.filter(s => t.includes(s.toLowerCase()));
}

function buildDemo(symptoms, duration, age) {
  const DEMO_DB = {
    "Common Cold":     { sev:"mild",     prob:87, pre:["Rest at home","Stay well hydrated","Take OTC cold medicine","Use steam inhalation","Gargle with warm salt water"], exp:"A viral upper respiratory infection. Usually resolves in 7-10 days.", meds:[{name:"Paracetamol",purpose:"Fever relief",ageWarning:null},{name:"Cetirizine",purpose:"Runny nose",ageWarning:null}], rem:["Steam inhalation","Warm fluids","Rest"], doc:"General Physician" },
    "Influenza":       { sev:"moderate", prob:65, pre:["Bed rest","Antiviral if prescribed","Monitor temperature","Electrolyte fluids"], exp:"A highly contagious respiratory illness.", meds:[{name:"Paracetamol",purpose:"Fever & aches",ageWarning:null},{name:"Ibuprofen",purpose:"Anti-inflammatory",ageWarning:age && parseInt(age) > 60 ? "Use with caution for patients over 60" : null}], rem:["Complete bed rest","Electrolyte fluids","Warm compress"], doc:"General Physician" },
    "Viral Infection": { sev:"mild",     prob:48, pre:["Vitamin C","Sleep 8+ hours","Avoid activity","Stay hydrated"], exp:"General viral infection. Supportive treatment.", meds:[{name:"Paracetamol",purpose:"General discomfort",ageWarning:null},{name:"Vitamin C",purpose:"Immune support",ageWarning:null}], rem:["Water and soups","Rest","Warm baths"], doc:"General Physician" },
    "Gastroenteritis": { sev:"mild",     prob:38, pre:["ORS","BRAT diet","Avoid dairy","Rest digestion"], exp:"Stomach flu. Clears in 2-5 days.", meds:[{name:"ORS",purpose:"Rehydration",ageWarning:null},{name:"Loperamide",purpose:"Diarrhea relief",ageWarning:null}], rem:["BRAT diet","Small sips every 15 min","Ginger tea"], doc:"Gastroenterologist" },
    "Migraine":        { sev:"moderate", prob:55, pre:["Dark room","Cold compress","Migraine meds","Avoid triggers"], exp:"Neurological condition with intense headaches.", meds:[{name:"Paracetamol",purpose:"Pain relief",ageWarning:null},{name:"Ibuprofen",purpose:"Moderate migraine",ageWarning:age && parseInt(age) > 60 ? "Caution over 60" : null}], rem:["Dark quiet room","Cold/warm compress","Peppermint oil on temples"], doc:"Neurologist" },
  };
  const scores = Object.entries(DEMO_DB).map(([name, info]) => {
    const base = info.prob / 100;
    const noise = (Math.random() - 0.5) * 0.15;
    const prob = Math.round(Math.min(97, Math.max(20, (base + noise) * 100)));
    return { name, probability: prob, severity: info.sev, precautions: info.pre, description: info.exp, medicines: info.meds, remedies: info.rem, recommendedDoctor: info.doc };
  });
  const sorted = scores.sort((a, b) => b.probability - a.probability).slice(0, 2);
  const sevRank = { mild: 0, moderate: 1, severe: 2 };
  const overall = sorted.slice(0, 2).reduce((mx, d) => sevRank[d.severity] > sevRank[mx] ? d.severity : mx, "mild");
  const confidence = Math.round(Math.min(97, sorted[0].probability * 0.8 + 18));
  return { predictions: sorted, overallSeverity: overall, confidence, symptoms, duration, age, timestamp: new Date().toISOString(), emergency: { isEmergency: false, message: null }, followUpQuestions: [] };
}

function HighlightMatch({ text, query }) {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="dropdown-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

function useRipple() {
  const [ripples, setRipples] = useState([]);
  const trigger = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
  }, []);
  return { ripples, trigger };
}

function SymptomChip({ label, onRemove }) {
  const [removing, setRemoving] = useState(false);
  const handleRemove = () => { setRemoving(true); setTimeout(() => onRemove(label), 220); };
  return (
    <div className={`sc-chip${removing ? " sc-chip--removing" : ""}`}>
      <span className="sc-chip__dot" />
      <span className="sc-chip__label">{label}</span>
      <button className="sc-chip__remove" onClick={handleRemove} aria-label={`Remove ${label}`}>
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
      </button>
    </div>
  );
}

function QuickPill({ label, onClick }) {
  const { ripples, trigger } = useRipple();
  return (
    <button className="sc-quick-pill" onClick={(e) => { trigger(e); onClick(label); }}>
      <span className="sc-quick-pill__plus">+</span>
      <span>{label}</span>
      {ripples.map(r => <span key={r.id} className="sc-ripple" style={{ left: r.x, top: r.y }} />)}
    </button>
  );
}

// ── Follow-up inline panel ─────────────────────────────────────────────────────
function FollowUpPanel({ questions, onConfirm }) {

  const [answers, setAnswers] = useState({});

  return (
    <div className="sc-followup-panel animate-fadeIn">

      <div className="sc-followup-header">
        🤔 Quick follow-up
      </div>

      <p className="sc-followup-sub">
        Help us improve prediction accuracy
      </p>

      {questions.map((q) => (
        <div key={q.id} className="sc-followup-question">

          <div className="sc-followup-text">
            {q.question}
          </div>

          <div className="sc-followup-options">

            {q.answers.map((ans) => (

              <button
                key={ans}
                className={`sc-followup-btn ${
                  answers[q.id] === ans ? "active" : ""
                }`}
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    [q.id]: ans,
                  }))
                }
              >
                {ans}
              </button>

            ))}

          </div>

        </div>
      ))}

      <button
        className="sc-followup-continue"
        onClick={() => onConfirm(answers)}
      >
        Continue Analysis →
      </button>

    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SymptomChecker() {
  const { navigate, setResults, token } = useApp();
  const [search,       setSearch]       = useState("");
  const [selected,     setSelected]     = useState([]);
  const [showDrop,     setShowDrop]     = useState(false);
  const [activeIdx,    setActiveIdx]    = useState(-1);
  const [age,          setAge]          = useState("");
  const [duration,     setDuration]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [typing,       setTyping]       = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [error,        setError]        = useState("");
  const [btnHover,     setBtnHover]     = useState(false);
  const [showBodyMap,  setShowBodyMap]  = useState(true);
  const [followUpQs,   setFollowUpQs]   = useState(null); // null | []
  const inputRef    = useRef(null);
  const dropRef     = useRef(null);
  const typingTimer = useRef(null);

  const { isRecording, hint, toggle, supported } = useSpeechRecognition({
    onResult: (text) => {
      setSearch(text);
      const matched = extractSymptomsFromSpeech(text);
      if (matched.length > 0) {
        setSelected(prev => {
          const merged = [...prev];
          matched.forEach(s => { if (!merged.includes(s) && merged.length < 12) merged.push(s); });
          return merged;
        });
      }
      if (text.length >= 2) setShowDrop(true);
    },
  });

  const filtered = ALL_SYMPTOMS.filter(
    s => s.toLowerCase().includes(search.toLowerCase()) && !selected.includes(s)
  ).slice(0, 8);

  const shouldShowDrop = showDrop && filtered.length > 0 && search.length >= 2;

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setActiveIdx(-1);
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 400);
    setShowDrop(val.length >= 2);
    setError("");
  };

  const add = (s) => {
    if (!selected.includes(s) && selected.length < 12) {
      setSelected(p => [...p, s]);
      setSearch("");
      setShowDrop(false);
      setActiveIdx(-1);
      setError("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const remove = (s) => setSelected(p => p.filter(x => x !== s));

  const handleKeyDown = (e) => {
    if (!shouldShowDrop) { if (e.key === "ArrowDown") setShowDrop(true); return; }
    if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter")     { e.preventDefault(); if (activeIdx >= 0 && filtered[activeIdx]) add(filtered[activeIdx]); else if (filtered.length === 1) add(filtered[0]); }
    else if (e.key === "Escape")    { setShowDrop(false); setActiveIdx(-1); }
    else if (e.key === "Backspace" && search === "" && selected.length > 0) remove(selected[selected.length - 1]);
  };

  useEffect(() => {
    if (activeIdx >= 0 && dropRef.current) {
      const items = dropRef.current.querySelectorAll(".sc-dropdown__item");
      items[activeIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  // Step 1: check for follow-up questions
  const requestFollowUp = async () => {
    if (selected.length < 2) { setError("Please add at least 2 symptoms for a meaningful analysis."); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("https://aimedscan-z3ra.onrender.com/api/predict/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ symptoms: selected }),
      });
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      const qs   = data.data?.followUpQuestions || [];
      setLoading(false);
      if (qs.length > 0) {
        setFollowUpQs(qs);   // Show follow-up panel
      } else {
        await analyze([]);   // No questions → go straight
      }
    } catch {
      setLoading(false);
      await analyze([]);
    }
  };

  // Step 2: final prediction
  const analyze = async (followUpAnswers = []) => {
    setFollowUpQs(null);
    setLoading(true);

    const answersArray = Object.entries(followUpAnswers).map(([questionId, answer]) => ({ questionId, answer }));

    try {
      const res = await fetch("https://aimedscan-z3ra.onrender.com/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ symptoms: selected, duration, age, followUpAnswers: answersArray }),
      });
      if (!res.ok) throw new Error("API unavailable");
      const data    = await res.json();
      const payload = data.data || data;
      setResults({ ...payload, symptoms: selected, duration, age, timestamp: new Date().toISOString(), confidence: payload.predictions?.[0]?.probability || 0 });
    } catch {
      setResults(buildDemo(selected, duration, age));
    } finally {
      setLoading(false);
      navigate("results");
    }
  };

  const readyToAnalyze = selected.length >= 2;

  return (
    <div className="page-wrap sc-page">
      <div className="sc-bg-orb sc-bg-orb--1" />
      <div className="sc-bg-orb sc-bg-orb--2" />

      <div className="container">
        <div className="sc-container">

          {/* Header */}
          <div className="sc-header animate-fadeUp">
            <div className="sc-header__badge"><span className="sc-header__badge-dot" />AI-Powered Analysis</div>
            <h1 className="sc-title">What are you feeling?</h1>
            <p className="sc-subtitle">Type or speak your symptoms — our AI will analyze and identify possible conditions</p>
          </div>

          {/* MAIN TWO COLUMN LAYOUT */}
<div className="sc-main-layout">

  {/* LEFT SIDE - Symptom Search */}
  <div>

    <div className="sc-card animate-fadeUp delay-1">
      <div className="sc-section-label">
        <span className="sc-section-label__icon">🔍</span>
        Search & Add Symptoms
        {selected.length > 0 && (
          <span className="sc-section-label__count">
            {selected.length}/12
          </span>
        )}
      </div>

      {/* Search input */}
      <div className={`sc-search-wrap${inputFocused ? " sc-search-wrap--focused" : ""}`}>
        <div className="sc-search-icon-wrap">
          {typing ? (
            <span className="sc-typing-dots"><span /><span /><span /></span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          )}
        </div>

        <input
          ref={inputRef}
          className="sc-search-input"
          value={search}
          onChange={handleSearchChange}
          onFocus={() => {
            setInputFocused(true);
            if (search.length >= 2) setShowDrop(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setShowDrop(false);
              setActiveIdx(-1);
            }, 200);
            setInputFocused(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a symptom (e.g. Fever, Headache…)"
        />

        {supported && (
          <button
            className={`sc-mic-btn${isRecording ? " sc-mic-btn--recording" : ""}`}
            onClick={toggle}
          >
            🎤
          </button>
        )}

        {shouldShowDrop && (
          <div className="sc-dropdown" ref={dropRef}>
            <div className="sc-dropdown__inner">
              {filtered.map((s, i) => (
                <div
                  key={s}
                  className={`sc-dropdown__item${i === activeIdx ? " sc-dropdown__item--active" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(s);
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  <span className="sc-dropdown__item-icon">＋</span>
                  <HighlightMatch text={s} query={search} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`sc-voice-hint${isRecording ? " sc-voice-hint--recording" : ""}`}>
        {hint || (supported ? 'Click 🎤 to speak — say "I have fever and headache"' : "")}
      </div>

      {/* Quick add */}
      <div className="sc-quick-section">
        <div className="sc-quick-label">Quick Add</div>
        <div className="sc-quick-pills">
          {QUICK.filter(s => !selected.includes(s)).map(s =>
            <QuickPill key={s} label={s} onClick={add} />
          )}
        </div>
      </div>

      {/* Selected symptoms */}
      {selected.length > 0 && (
        <div className="sc-selected">
          <div className="sc-selected__header">
            <span className="sc-selected__title">
              Selected Symptoms
              <span className="sc-selected__badge">{selected.length}</span>
            </span>
            <button
              className="sc-clear-btn"
              onClick={() => setSelected([])}
            >
              Clear all
            </button>
          </div>

          <div className="sc-chips">
            {selected.map(s =>
              <SymptomChip key={s} label={s} onRemove={remove} />
            )}
          </div>
        </div>
      )}

      {selected.length === 0 && (
        <div className="sc-empty-hint">
          <span>
            Start typing or use Quick Add above to select your symptoms
          </span>
        </div>
      )}
    </div>

  </div>

  {/* RIGHT SIDE - BODY MAP */}
  <div>

    <div className="sc-bodymap-wrap animate-fadeUp delay-2">

      <div className="sc-section-label">
  <span>🫀 Browse by Body Region</span>
</div>

      {showBodyMap && (
        <div className="sc-bodymap-panel animate-fadeIn">
          <SymptomBodyMap
            onSymptomSelect={add}
            selectedSymptoms={selected}
          />
        </div>
      )}

    </div>

  </div>

</div>

          {/* Additional info row */}
          <div className="sc-additional animate-fadeUp delay-2">
            <div className="sc-field-group">
              <label className="sc-field-label"><span className="sc-field-label__icon">🎂</span>Age <span className="sc-field-label__opt">(optional)</span></label>
              <input className="sc-field-input" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 28" />
            </div>
            <div className="sc-field-group">
              <label className="sc-field-label"><span className="sc-field-label__icon">⏱️</span>Duration <span className="sc-field-label__opt">(optional)</span></label>
              <input className="sc-field-input" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 days" />
            </div>
          </div>

          {error && <div className="sc-error animate-fadeIn"><span className="sc-error__icon">⚠️</span>{error}</div>}

          {selected.length > 0 && selected.length < 2 && (
            <div className="sc-progress-hint animate-fadeIn">
              Add {2 - selected.length} more symptom{2 - selected.length !== 1 ? "s" : ""} to enable analysis
              <div className="sc-progress-bar"><div className="sc-progress-fill" style={{ width: `${(selected.length / 2) * 100}%` }} /></div>
            </div>
          )}

          {/* ── Follow-Up Questions Panel ─────────────────────────────────────── */}
          {followUpQs && (
            <FollowUpPanel questions={followUpQs} onConfirm={analyze} />
          )}

          {/* Analyze button */}
          {!followUpQs && (
            <div className="sc-analyze-wrap animate-fadeUp delay-3">
              <button
                className={`sc-analyze-btn${readyToAnalyze ? " sc-analyze-btn--ready" : ""}${loading ? " sc-analyze-btn--loading" : ""}`}
                onClick={requestFollowUp}
                disabled={loading}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
              >
                {loading ? (
                  <><span className="sc-btn-spinner" /><span>Analyzing your symptoms…</span></>
                ) : (
                  <><span className="sc-btn-icon">🔬</span><span>Analyze with AI</span>{readyToAnalyze && <span className="sc-btn-arrow">→</span>}</>
                )}
                {readyToAnalyze && !loading && <span className="sc-btn-glow" />}
              </button>
            </div>
          )}

          <p className="sc-disclaimer">🛡️ AIMedScan is for informational purposes only. Always consult a qualified healthcare professional.</p>
        </div>
      </div>
    </div>
  );
}
