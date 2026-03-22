import { useState, useEffect } from "react";
import { AppContext } from "./context/AppContext";
import Navbar             from "./components/Navbar";
import LandingPage        from "./pages/LandingPage";
import SymptomChecker     from "./pages/SymptomChecker";
import Results            from "./pages/Results";
import Dashboard          from "./pages/Dashboard";
import Auth               from "./pages/Auth";
import PrescriptionAnalyzer from "./pages/PrescriptionAnalyzer";
// Existing styles (unchanged)
import "./styles/main.css";
import "./styles/navbar.css";
import "./styles/auth.css";
import "./styles/dashboard.css";
import "./styles/results.css";
import "./styles/results-extended.css";
import "./styles/pages.css";
import "./styles/bodymap.css";
import "./styles/prescription.css";
// NEW: Prescription Analyzer styles
import "./styles/prescription-analyzer.css";

export default function App() {
  const [page,    setPage]    = useState("landing");
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() =>
    localStorage.getItem("aimedcan_token") ||
    localStorage.getItem("token") ||
    null
  );
  const [results, setResults] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("aimedcan_user");
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch (_) {}
    }
  }, []);

  const login = (userData, authToken) => {
    setUser(userData); setToken(authToken);
    localStorage.setItem("aimedcan_token", authToken);
    localStorage.setItem("token", authToken);          // ← ADDED
    localStorage.setItem("aimedcan_user", JSON.stringify(userData));
    setPage("landing");
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem("aimedcan_token");
    localStorage.removeItem("token");                  // ← ADDED
    localStorage.removeItem("aimedcan_user");
    setPage("landing");
  };

  const navigate = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ctx = { user, token, login, logout, navigate, results, setResults, page };

  const pages = {
    landing:      <LandingPage />,
    checker:      <SymptomChecker />,
    results:      <Results />,
    dashboard:    <Dashboard />,
    auth:         <Auth />,
    prescription: <PrescriptionAnalyzer />,
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="bg-blobs" />
      <Navbar />
      <main key={page} className="animate-fadeIn">
        {pages[page] || <LandingPage />}
      </main>
    </AppContext.Provider>
  );
}
