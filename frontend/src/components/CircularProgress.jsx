import { useState, useEffect } from "react";
import "../styles/circular-progress.css";

export default function CircularProgress({ probability, severity, disease }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(probability);
    }, 100);
    return () => clearTimeout(timer);
  }, [probability]);

  // SVG circle dimensions
  const size = 140;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke offset for animation
  const offset = circumference - (displayValue / 100) * circumference;
  
  // Color mapping
  const colors = {
    mild: "#2e7d54",
    moderate: "#9a6200",
    severe: "#c0392b",
  };
  
  const bgColors = {
    mild: "#e8f5f1",
    moderate: "#fff8f0",
    severe: "#fff0ee",
  };
  
  const accentColor = colors[severity] || colors.mild;
  const bgColor = bgColors[severity] || bgColors.mild;

  return (
    <div className={`circular-progress-card circular-progress-${severity}`}>
      {/* Top: Disease Name */}
      <div className="circular-progress-header">
        <h3 className="circular-progress-disease">{disease}</h3>
      </div>

      {/* Center: SVG Circular Progress */}
      <div className="circular-progress-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="circular-progress-svg"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="none"
            className="circular-progress-bg"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={accentColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="circular-progress-ring"
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        </svg>

        {/* Center percentage text */}
        <div className="circular-progress-text">
          <div className="circular-progress-value">{displayValue}%</div>
        </div>
      </div>

      {/* Bottom: Severity Label */}
      <div className="circular-progress-footer">
        <span className={`circular-severity-badge circular-severity-${severity}`}>
          {severity === "severe"
            ? "🚨"
            : severity === "moderate"
            ? "⚠️"
            : "✅"}
          {" "}
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </span>
      </div>
    </div>
  );
}
