"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Fetching DEX data...",
  "Querying contract verification...",
  "Analyzing security signals...",
  "Scanning holder distribution...",
  "Computing risk score...",
];

export default function LoadingSkeleton() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Score skeleton */}
      <div className="glass-card p-8 flex flex-col items-center">
        <div className="w-[280px] h-[140px] relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-4 border-border-card border-t-accent animate-spin" />
          </div>
        </div>
        <p className="mt-4 text-sm text-text-secondary animate-pulse-subtle">
          {MESSAGES[msgIndex]}
        </p>
        <div className="mt-2 flex gap-1">
          {MESSAGES.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                i <= msgIndex ? "bg-accent" : "bg-border-card"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card p-5">
          <div className="space-y-3">
            <div className="h-4 bg-bg-hover rounded-md w-1/3 shimmer-bg" />
            <div className="h-3 bg-bg-hover rounded-md w-full shimmer-bg" />
            <div className="h-3 bg-bg-hover rounded-md w-2/3 shimmer-bg" />
          </div>
        </div>
      ))}
    </div>
  );
}
