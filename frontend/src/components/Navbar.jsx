/**
 * Navbar.jsx — AIMedScan
 * ONLY CHANGE from original: added "Prescription" nav pill.
 */
import { LayoutDashboard, LogOut, Stethoscope, RefreshCw, FileText } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Navbar() {
  const { user, logout, navigate, page, setResults } = useApp();

  const handleNewAnalysis = () => {
    setResults(null);
    navigate("checker");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("landing")}>
          <div className="navbar-logo-icon">
            <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 44, height: 44 }}>
              <path d="M4 22 L13 22 L17 11 L22 33 L27 22 L31 22 L35 17 L38 22 L40 22"
                stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <span className="navbar-logo-text"><span>AI</span>MedScan</span>
        </div>

        {/* Center nav pills */}
        <div className="navbar-center-pills">
          <button
            className={`navbar-pill${page === "checker" ? " navbar-pill--active" : ""}`}
            onClick={() => navigate("checker")}
          >
            <Stethoscope size={14}/>
            <span>Symptom Check</span>
          </button>

          {/* NEW: Prescription Analyzer pill */}
          <button
            className={`navbar-pill${page === "prescription" ? " navbar-pill--active" : ""}`}
            onClick={() => navigate("prescription")}
          >
            <FileText size={14}/>
            <span>Prescription</span>
          </button>

          <button className="navbar-pill navbar-pill--new" onClick={handleNewAnalysis}>
            <RefreshCw size={13}/>
            <span>New Analysis</span>
          </button>
        </div>

        {/* Right actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              <button className="btn btn-ghost btn-sm navbar-dashboard-btn" onClick={() => navigate("dashboard")}>
                <LayoutDashboard size={15}/>
                <span className="hide-mobile">Dashboard</span>
              </button>
              <div className="navbar-avatar" onClick={() => navigate("dashboard")}>
                <div className="avatar-circle">
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </div>
                <span className="avatar-name hide-mobile">{user.name || user.email}</span>
              </div>
              <button className="btn btn-ghost btn-icon navbar-logout-btn" onClick={logout} title="Sign out">
                <LogOut size={15}/>
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("auth")}>Sign In</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("checker")}>Get Started</button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
