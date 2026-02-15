"use client";

import { TokenInfo, LinksInfo } from "@/lib/types";
import { useState } from "react";

interface TokenHeaderProps {
  token: TokenInfo;
  links: LinksInfo;
  chain: string;
}

export default function TokenHeader({ token, links, chain }: TokenHeaderProps) {
  const [copied, setCopied] = useState(false);

  const truncatedAddr = `${token.address.slice(0, 6)}...${token.address.slice(-4)}`;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(token.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-5 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Token name + symbol */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-text-primary truncate">
              {token.name}
            </h2>
            <span className="text-sm font-medium text-text-secondary bg-bg-hover px-2 py-0.5 rounded-md">
              {token.symbol}
            </span>
            {token.verified === true && (
              <span className="flex items-center gap-1 text-xs font-medium text-risk-low bg-risk-low/10 px-2 py-0.5 rounded-md">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
            {token.verified === false && (
              <span className="flex items-center gap-1 text-xs font-medium text-risk-high bg-risk-high/10 px-2 py-0.5 rounded-md">
                Unverified
              </span>
            )}
          </div>

          {/* Address */}
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs text-text-secondary font-mono">{truncatedAddr}</code>
            <button
              onClick={copyAddress}
              className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded"
              title="Copy address"
            >
              {copied ? (
                <svg className="w-3.5 h-3.5 text-risk-low" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                </svg>
              )}
            </button>
            <span className="text-xs text-text-secondary/60 capitalize bg-bg-hover px-1.5 py-0.5 rounded">
              {chain}
            </span>
          </div>

          {/* Age */}
          {token.age_days !== null && (
            <p className="text-xs text-text-secondary mt-1.5">
              {token.age_days > 365
                ? `${Math.floor(token.age_days / 365)}y ${token.age_days % 365}d old`
                : `${token.age_days} days old`}
            </p>
          )}
        </div>
      </div>

      {/* External links */}
      <div className="flex gap-2 mt-4">
        {links.explorer && (
          <a
            href={links.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary
                       bg-bg-hover hover:bg-bg-hover/80 rounded-lg transition-colors border border-border-card"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
            Explorer
          </a>
        )}
        {links.dexscreener && (
          <a
            href={links.dexscreener}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary
                       bg-bg-hover hover:bg-bg-hover/80 rounded-lg transition-colors border border-border-card"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            DexScreener
          </a>
        )}
      </div>
    </div>
  );
}
