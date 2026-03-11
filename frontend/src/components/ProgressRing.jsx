import { useState, useEffect } from "react";

export default function ProgressRing({ value, size = 120, severity = "mild" }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, 200);
    return () => clearTimeout(timer);
  }, [value]);

  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  // Severity colors
  const severityColors = {
    mild: "#2ecc71",      // Green
    moderate: "#f39c12",  // Orange
    severe: "#e74c3c"     // Red
  };

  const bgColors = {
    mild: "rgba(46, 204, 113, 0.1)",
    moderate: "rgba(243, 156, 18, 0.1)",
    severe: "rgba(231, 76, 60, 0.1)"
  };

  const accentColor = severityColors[severity] || severityColors.mild;
  const bgColor = bgColors[severity] || bgColors.mild;

  return (
    <div className="progress-ring-wrapper">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="progress-ring-svg"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
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
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="progress-ring-circle"
          style={{
            transition: "stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%"
          }}
        />
      </svg>
      <div className="progress-ring-text">{displayValue}%</div>
    </div>
  );
}
