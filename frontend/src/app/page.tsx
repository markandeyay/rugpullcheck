"use client";

import { useState } from "react";
import { Chain } from "@/lib/types";
import { useAnalysis } from "@/hooks/useAnalysis";
import SearchForm from "@/components/SearchForm";
import ScoreGauge from "@/components/ScoreGauge";
import TokenHeader from "@/components/TokenHeader";
import ReasonsList from "@/components/ReasonsList";
import LiquidityCard from "@/components/LiquidityCard";
import HoldersCard from "@/components/HoldersCard";
import OwnershipCard from "@/components/OwnershipCard";
import TradeRiskCard from "@/components/TradeRiskCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorDisplay from "@/components/ErrorDisplay";

export default function Home() {
  const { data, loading, error, analyze, reset } = useAnalysis();
  const [lastChain, setLastChain] = useState<Chain>("ethereum");

  const handleAnalyze = (chain: Chain, address: string) => {
    setLastChain(chain);
    analyze(chain, address);
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-[720px] mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              RugCheck
            </h1>
          </div>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Paste a token address. Get the truth. Instant rug pull risk scoring
            powered by on-chain analysis.
          </p>
        </header>

        {/* Search */}
        <SearchForm onSubmit={handleAnalyze} loading={loading} />

        {/* Loading */}
        {loading && <LoadingSkeleton />}

        {/* Error */}
        {error && <ErrorDisplay message={error} onRetry={reset} />}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-4 animate-fade-in">
            {/* Score */}
            <ScoreGauge score={data.score.risk_score} label={data.score.label} />

            {/* Token info */}
            <TokenHeader token={data.token} links={data.links} chain={lastChain} />

            {/* Reasons */}
            <ReasonsList reasons={data.score.reasons} />

            {/* Detail cards */}
            <div className="space-y-3">
              <LiquidityCard market={data.market} />
              <HoldersCard holders={data.holders} />
              <OwnershipCard admin={data.admin} />
              <TradeRiskCard tradeRisk={data.trade_risk} />
            </div>

            {/* Footer */}
            <footer className="text-center pt-4 pb-8">
              <p className="text-xs text-text-secondary/50">
                Data from DexScreener, Etherscan & GoPlus Security.
                Not financial advice.
              </p>
            </footer>
          </div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border-card mx-auto flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-text-secondary/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm text-text-secondary/50">
              Enter a token contract address to check its rug pull risk
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
