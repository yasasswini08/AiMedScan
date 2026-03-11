import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function Auth() {
  const { login, navigate } = useApp();
  const [mode, setMode]   = useState("login");
  const [form, setForm]   = useState({ name:"", email:"", password:"" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  const u = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(""); setSuccess("");

    // Client-side validation
    if (!form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (mode === "signup" && !form.name) {
      setError("Please enter your full name.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const API = "https://aimedscan-z3ra.onrender.com";
      const endpoint =
        mode === "login"
          ? `${API}/api/auth/login`
          : `${API}/api/auth/register`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        // Pass through exact error message from backend
        setError(data.message || "Authentication failed. Please try again.");
        return;
      }

     if (mode === "register") {
        setSuccess("Account created successfully! Signing you in…");
        setTimeout(() => login(data.user, data.token), 800);
      } else {
        login(data.user, data.token);
      }
    } catch {
      setError("Cannot connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-panel-left">
        <div className="auth-brand">
          
        </div>

        <div className="auth-illustration">
          <svg viewBox="0 0 360 120">
            <defs>
              <linearGradient id="ahbg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#99CDD8" stopOpacity="0" />
                <stop offset="35%" stopColor="#6aabbb" />
                <stop offset="65%" stopColor="#657166" />
                <stop offset="100%" stopColor="#CFDBC4" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,60 L50,60 L65,60 L78,20 L91,100 L104,60 L130,60 L140,42 L150,60 L180,60 L193,60 L206,15 L219,105 L232,60 L260,60 L270,48 L280,60 L310,60 L360,60"
              fill="none" stroke="url(#ahbg)" strokeWidth="2.5"
              strokeLinecap="round" className="hb-path"
            />
          </svg>
        </div>

        <h2 className="auth-panel-title">Your Personal<br/>Health Assistant</h2>
        <p className="auth-panel-subtitle">
          AI-powered symptom analysis, severity detection, and personalized health guidance.
        </p>

        <div className="auth-features">
          {[
            ["🧠", "AI Disease Prediction"],
            ["🛡️", "Severity Detection"],
            ["🗺️", "Nearby Hospital Finder"],
            ["🎤", "Voice Symptom Input"],
            ["📊", "Personal Health Dashboard"],
          ].map(([icon, label]) => (
            <div key={label} className="auth-feature-pill">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div className="auth-form-container animate-scaleIn">
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab${mode === "login" ? " active" : ""}`}
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab${mode === "signup" ? " active" : ""}`}
              onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
            >
              Sign Up
            </button>
          </div>

          <h2 className="auth-title">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Sign in to access your personal health dashboard"
              : "Join thousands using AI for smarter health decisions"}
          </p>

          <div className="auth-form">
            {mode === "signup" && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrap">
                  <span className="input-icon">👤</span>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={u("name")}
                    onKeyDown={handleKey}
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon">✉️</span>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={u("email")}
                  onKeyDown={handleKey}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrap" style={{ position:"relative" }}>
                <span className="input-icon">🔒</span>
                <input
                  className="form-input"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={u("password")}
                  onKeyDown={handleKey}
                  placeholder="At least 6 characters"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  style={{ paddingRight: 44 }}
                />
                <button
                  className="password-toggle"
                  onClick={() => setShowPw(v => !v)}
                  type="button"
                  tabIndex={-1}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>
          </div>

          {/* Errors & success */}
          {error && (
            <div className="alert alert-error" style={{ marginTop: 14 }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" style={{ marginTop: 14 }}>
              ✅ {success}
            </div>
          )}

          <button
            className="btn btn-primary auth-submit"
            onClick={submit}
            disabled={loading}
            style={{ marginTop: 18 }}
          >
            {loading
              ? <><span className="spinner" style={{ width:18,height:18 }} /></>
              : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>

          <div className="divider">or</div>

          <button
            className="auth-guest-btn"
            onClick={() => navigate("checker")}
          >
            Continue without account
          </button>

          <p className="auth-hint">
            {mode === "login"
              ? "Don't have an account? Click Sign Up above."
              : "Already have an account? Click Sign In above."}
          </p>
        </div>
      </div>
    </div>
  );
}
