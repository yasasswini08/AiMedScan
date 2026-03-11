import { useApp } from "../context/AppContext";
import { useEffect, useRef } from "react";

const features = [
  { icon: "🧠", title: "AI Disease Prediction", desc: "Random Forest ML model trained on medical data maps symptoms to conditions with high precision.", color: "teal" },
  { icon: "🛡️", title: "Severity Detection", desc: "Color-coded severity levels — mild, moderate, severe — help you know when to seek urgent care.", color: "mint" },
  { icon: "💊", title: "Smart Precautions", desc: "Get personalized precautionary advice and medication guidance tailored to your symptoms.", color: "peach" },
  { icon: "🗺️", title: "Nearby Hospitals", desc: "For serious cases, find nearby hospitals and clinics on a live map instantly.", color: "sage" },
  { icon: "🎤", title: "Voice Input", desc: "Speak your symptoms naturally. Our speech recognition auto-fills the symptom form.", color: "blush" },
  { icon: "📊", title: "Health Dashboard", desc: "Track your symptom history, see trends, and manage your personal health timeline.", color: "forest" },
];

const steps = [
  { num: "1", title: "Enter Symptoms", desc: "Type or speak your symptoms using our intelligent input system." },
  { num: "2", title: "AI Analysis", desc: "Our Random Forest model processes your symptoms in seconds." },
  { num: "3", title: "View Results", desc: "Get disease predictions, severity scores and detailed precautions." },
  { num: "4", title: "Take Action", desc: "Find nearby hospitals or download your health report." },
];

export default function LandingPage() {
  const { navigate, user } = useApp();

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="hero">

  {/* Heartbeat background */}
  <div className="heartbeat-bg">
    <svg viewBox="0 0 1200 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="heartbeatBg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#99CDD8" stopOpacity="0" />
          <stop offset="50%" stopColor="#99CDD8" />
          <stop offset="100%" stopColor="#CFDBC4" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d="M0,100 L120,100 L150,100 L180,40 L210,160 L240,100 L300,100 L330,70 L360,100 L450,100 L500,100 L540,30 L580,170 L620,100 L700,100 L730,80 L760,100 L900,100 L1200,100"
        fill="none"
        stroke="url(#heartbeatBg)"
        strokeWidth="3"
        className="heartbeat-line"
      />
    </svg>
  </div>

        <div className="container">
          <div className="hero-content animate-fadeUp">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              AI-Powered Medical Analysis · 
            </div>
              <h1 className="hero-headline">
                  Understand Your
                 <span className="accent"> Symptoms</span> Instantly
            </h1>           

            <p className="hero-sub">
              Enter your symptoms and our advanced AI analyzes possible conditions,
              severity levels, and personalized precautions — in seconds, not days.
            </p>

            <div className="hero-cta">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate("checker")}
              >
                🩺 Start Symptom Check
              </button>
              {user ? (
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => navigate("dashboard")}
                >
                  📊 Go to Dashboard
                </button>
              ) : (
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => navigate("auth")}
                >
                  Create Free Account
                </button>
              )}
            </div>

            <div className="hero-stats">
              {[
                { val: "98.2%", lbl: "Accuracy" },
                { val: "500+",  lbl: "Diseases" },
                { val: "120+",  lbl: "Symptoms" },
                { val: "50K+",  lbl: "Users" },
              ].map(s => (
                <div key={s.lbl}>
                  <div className="hero-stat-val">{s.val}</div>
                  <div className="hero-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side visual card */}
          
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="animate-fadeUp">
            <div className="section-label">Features</div>
            <h2 className="section-heading">Everything You Need for Smart Health Decisions</h2>
            <p className="section-subheading">
              Powered by machine learning models trained on thousands of clinical medical datasets.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={f.title} className={`feature-card animate-fadeUp delay-${i + 1}`}>
                <div className={`feature-icon ${f.color}`}>{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="container">
          <div className="animate-fadeUp">
            <div className="section-label">How It Works</div>
            <h2 className="section-heading">From Symptoms to Answers in 4 Steps</h2>
          </div>
          <div className="steps-row">
            {steps.map((s, i) => (
              <div key={s.num} className={`step-item animate-fadeUp delay-${i + 1}`}>
                <div className="step-num">{s.num}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Start Your Health Journey Today</h2>
          <p className="cta-sub">Join 50,000+ users making smarter health decisions with AI.</p>
          <div className="cta-btns">
            <button className="btn btn-primary btn-lg" onClick={() => navigate("checker")}>
              ❤️ Check Symptoms — Free
            </button>
            {user ? (
              <button className="btn btn-secondary btn-lg" onClick={() => navigate("dashboard")}>
                📊 Go to Dashboard
              </button>
            ) : (
              <button className="btn btn-secondary btn-lg" onClick={() => navigate("auth")}>
                Create Account
              </button>
            )}
          </div>
        </div>
      </section>

      <footer className="footer">
        © 2025 AIMedScan · Not a substitute for professional medical advice · Always consult a qualified doctor
      </footer>
    </div>
  );
}
