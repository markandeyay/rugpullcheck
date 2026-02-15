"use client";

import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  score: number;
  label: "LOW" | "MEDIUM" | "HIGH";
}

export default function ScoreGauge({ score, label }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color =
    label === "LOW"
      ? "#22c55e"
      : label === "MEDIUM"
      ? "#eab308"
      : "#ef4444";

  const bgColor =
    label === "LOW"
      ? "rgba(34, 197, 94, 0.08)"
      : label === "MEDIUM"
      ? "rgba(234, 179, 8, 0.08)"
      : "rgba(239, 68, 68, 0.08)";

  // Arc math: semicircle from left to right
  const cx = 100;
  const cy = 100;
  const r = 80;
  const arcLength = Math.PI * r; // ~251.2
  const fillOffset = arcLength * (1 - animatedScore / 100);

  const glowClass =
    label === "LOW"
      ? "glow-low"
      : label === "MEDIUM"
      ? "glow-medium"
      : "glow-high";

  return (
    <div className={`glass-card ${glowClass} p-8 flex flex-col items-center animate-fade-in`}>
      <div className="relative w-full max-w-[280px]">
        <svg viewBox="0 0 200 120" className="w-full">
          {/* Subtle background glow */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e1e2e"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Filled arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={`url(#gradient-${label})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={fillOffset}
            filter="url(#glow)"
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />

          {/* Score number */}
          <text
            x="100"
            y="82"
            textAnchor="middle"
            className="font-bold"
            fill="white"
            fontSize="42"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {animatedScore}
          </text>

          {/* "/100" label */}
          <text
            x="100"
            y="102"
            textAnchor="middle"
            fill="#8888a0"
            fontSize="13"
            fontFamily="Inter, system-ui, sans-serif"
          >
            / 100
          </text>
        </svg>
      </div>

      {/* Risk label badge */}
      <div
        className="mt-2 px-5 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase"
        style={{ backgroundColor: bgColor, color }}
      >
        {label} RISK
      </div>
    </div>
  );
}
