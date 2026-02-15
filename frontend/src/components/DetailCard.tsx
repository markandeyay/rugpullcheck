"use client";

import { useState, ReactNode } from "react";

interface DetailCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  variant?: "default" | "danger";
}

export default function DetailCard({
  title,
  icon,
  children,
  defaultOpen = false,
  variant = "default",
}: DetailCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const borderClass =
    variant === "danger"
      ? "border-risk-high/30 hover:border-risk-high/50"
      : "border-border-card hover:border-border-card/80";

  return (
    <div className={`bg-bg-card/80 backdrop-blur-sm border ${borderClass} rounded-xl overflow-hidden transition-colors duration-200`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <span className="text-text-secondary group-hover:text-text-primary transition-colors">
            {icon}
          </span>
          <span className="font-medium text-sm text-text-primary">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-0 border-t border-border-card/50">
            <div className="pt-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
