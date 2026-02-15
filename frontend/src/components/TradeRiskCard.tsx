import { TradeRiskInfo } from "@/lib/types";
import DetailCard from "./DetailCard";

interface TradeRiskCardProps {
  tradeRisk: TradeRiskInfo | null;
}

export default function TradeRiskCard({ tradeRisk }: TradeRiskCardProps) {
  const icon = (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );

  if (!tradeRisk) {
    return (
      <DetailCard title="Trade Risk" icon={icon}>
        <p className="text-sm text-text-secondary">Security data unavailable for trade risk analysis.</p>
      </DetailCard>
    );
  }

  const isHoneypot = tradeRisk.honeypot;
  const hasSellRestriction = tradeRisk.cannot_sell;

  return (
    <DetailCard
      title="Trade Risk"
      icon={icon}
      defaultOpen={isHoneypot || hasSellRestriction}
      variant={isHoneypot || hasSellRestriction ? "danger" : "default"}
    >
      <div className="space-y-3">
        {/* Honeypot alert */}
        {isHoneypot && (
          <div className="flex items-start gap-3 p-3 bg-risk-high/10 border border-risk-high/30 rounded-lg">
            <svg className="w-5 h-5 text-risk-high shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-risk-high">Honeypot Detected</p>
              <p className="text-xs text-risk-high/80 mt-0.5">
                You will likely be unable to sell this token after buying.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-0.5 divide-y divide-border-card/30">
          {/* Sell status */}
          <div className="flex justify-between items-center py-1.5">
            <span className="text-xs text-text-secondary">Can Sell</span>
            <span className={`text-sm font-medium ${tradeRisk.cannot_sell ? "text-risk-high" : "text-risk-low"}`}>
              {tradeRisk.cannot_sell ? "No" : "Yes"}
            </span>
          </div>

          {/* Buy status */}
          <div className="flex justify-between items-center py-1.5">
            <span className="text-xs text-text-secondary">Can Buy</span>
            <span className={`text-sm font-medium ${tradeRisk.cannot_buy ? "text-risk-high" : "text-risk-low"}`}>
              {tradeRisk.cannot_buy ? "No" : "Yes"}
            </span>
          </div>

          {/* Buy tax */}
          <div className="flex justify-between items-center py-1.5">
            <span className="text-xs text-text-secondary">Buy Tax</span>
            <span
              className={`text-sm font-medium ${
                tradeRisk.buy_tax_pct != null && tradeRisk.buy_tax_pct > 10
                  ? "text-risk-high"
                  : tradeRisk.buy_tax_pct != null && tradeRisk.buy_tax_pct > 5
                  ? "text-risk-medium"
                  : "text-text-primary"
              }`}
            >
              {tradeRisk.buy_tax_pct != null ? `${tradeRisk.buy_tax_pct}%` : "N/A"}
            </span>
          </div>

          {/* Sell tax */}
          <div className="flex justify-between items-center py-1.5">
            <span className="text-xs text-text-secondary">Sell Tax</span>
            <span
              className={`text-sm font-medium ${
                tradeRisk.sell_tax_pct != null && tradeRisk.sell_tax_pct > 10
                  ? "text-risk-high"
                  : tradeRisk.sell_tax_pct != null && tradeRisk.sell_tax_pct > 5
                  ? "text-risk-medium"
                  : "text-text-primary"
              }`}
            >
              {tradeRisk.sell_tax_pct != null ? `${tradeRisk.sell_tax_pct}%` : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </DetailCard>
  );
}
