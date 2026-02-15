"use client";

import { useState } from "react";

interface ReasonsListProps {
  reasons: string[];
}

export default function ReasonsList({ reasons }: ReasonsListProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? reasons : reasons.slice(0, 5);
  const hasMore = reasons.length > 5;

  const getIcon = (reason: string) => {
    if (reason.includes("HONEYPOT") || reason.includes("cannot")) {
      return (
        <svg className="w-4 h-4 text-risk-high shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    if (reason.includes("tax") || reason.includes("Tax") || reason.includes("mint") || reason.includes("Mint")) {
      return (
        <svg className="w-4 h-4 text-risk-medium shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  if (reasons.length === 0) return null;

  return (
    <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Why this score
      </h3>
      <ul className="space-y-2.5">
        {visible.map((reason, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 text-sm text-text-primary/90 leading-relaxed animate-fade-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {getIcon(reason)}
            <span>{reason}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-accent hover:text-accent/80 font-medium transition-colors"
        >
          {expanded ? "Show less" : `Show ${reasons.length - 5} more`}
        </button>
      )}
    </div>
  );
}
