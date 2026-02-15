import { MarketInfo } from "@/lib/types";
import DetailCard from "./DetailCard";

interface LiquidityCardProps {
  market: MarketInfo | null;
}

function formatUsd(val: number | null | undefined): string {
  if (val == null) return "N/A";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className={`text-sm font-medium ${highlight ? "text-text-primary" : "text-text-primary/80"}`}>
        {value}
      </span>
    </div>
  );
}

export default function LiquidityCard({ market }: LiquidityCardProps) {
  const icon = (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );

  if (!market) {
    return (
      <DetailCard title="Liquidity & Market" icon={icon}>
        <p className="text-sm text-text-secondary">No DEX data found for this token.</p>
      </DetailCard>
    );
  }

  const priceChangeColor =
    market.price_change_24h_pct != null
      ? market.price_change_24h_pct >= 0
        ? "text-risk-low"
        : "text-risk-high"
      : "";

  return (
    <DetailCard title="Liquidity & Market" icon={icon}>
      <div className="space-y-0.5 divide-y divide-border-card/30">
        <Row label="DEX" value={market.dex} />
        <Row label="Pair" value={`${market.base_symbol} / ${market.quote_symbol}`} />
        <Row label="Liquidity" value={formatUsd(market.liquidity_usd)} highlight />
        <Row label="24h Volume" value={formatUsd(market.volume_24h_usd)} />
        {market.price_usd && (
          <div className="flex justify-between items-center py-1.5">
            <span className="text-xs text-text-secondary">Price</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">
                ${parseFloat(market.price_usd) < 0.01
                  ? parseFloat(market.price_usd).toExponential(2)
                  : parseFloat(market.price_usd).toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
              </span>
              {market.price_change_24h_pct != null && (
                <span className={`text-xs font-medium ${priceChangeColor}`}>
                  {market.price_change_24h_pct >= 0 ? "+" : ""}
                  {market.price_change_24h_pct.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        )}
        {market.fdv != null && <Row label="FDV" value={formatUsd(market.fdv)} />}
        {market.market_cap != null && <Row label="Market Cap" value={formatUsd(market.market_cap)} />}
      </div>
    </DetailCard>
  );
}
