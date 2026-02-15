"use client";

import { useState } from "react";
import { Chain, CHAINS } from "@/lib/types";

interface SearchFormProps {
  onSubmit: (chain: Chain, address: string) => void;
  loading: boolean;
}

export default function SearchForm({ onSubmit, loading }: SearchFormProps) {
  const [chain, setChain] = useState<Chain>("ethereum");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const validate = (addr: string): boolean => {
    if (!addr) {
      setError("Enter a token contract address");
      return false;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      setError("Invalid address — must be 0x followed by 40 hex characters");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = address.trim();
    if (validate(trimmed)) {
      onSubmit(chain, trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="glass-card gradient-border p-1 flex flex-col sm:flex-row gap-1">
        {/* Chain selector */}
        <div className="relative">
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value as Chain)}
            disabled={loading}
            className="h-12 pl-4 pr-8 bg-bg-hover rounded-lg text-text-primary text-sm font-medium
                       appearance-none cursor-pointer border-0 outline-none focus:ring-2 focus:ring-accent/50
                       disabled:opacity-50 w-full sm:w-auto min-w-[130px]"
          >
            {CHAINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Address input */}
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (error) setError("");
          }}
          placeholder="Paste token contract address (0x...)"
          disabled={loading}
          spellCheck={false}
          className="h-12 flex-1 px-4 bg-transparent rounded-lg text-text-primary text-sm
                     placeholder:text-text-secondary/50 border-0 outline-none focus:ring-2
                     focus:ring-accent/50 font-mono disabled:opacity-50 min-w-0"
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="h-12 px-6 bg-accent hover:bg-accent/90 active:bg-accent/80 text-white font-semibold
                     text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 min-w-[120px] shrink-0"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Scanning
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Analyze
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-risk-high pl-2 animate-fade-in">{error}</p>
      )}
    </form>
  );
}
