import { HoldersInfo } from "@/lib/types";
import DetailCard from "./DetailCard";

interface HoldersCardProps {
  holders: HoldersInfo | null;
}

function Bar({ label, pct, warn }: { label: string; pct: number | null; warn: boolean }) {
  const width = pct != null ? Math.min(pct, 100) : 0;
  const barColor = warn ? "bg-risk-high" : pct != null && pct > 30 ? "bg-risk-medium" : "bg-accent";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className={`font-medium ${warn ? "text-risk-high" : "text-text-primary"}`}>
          {pct != null ? `${pct.toFixed(1)}%` : "N/A"}
        </span>
      </div>
      <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function HoldersCard({ holders }: HoldersCardProps) {
  const icon = (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );

  if (!holders) {
    return (
      <DetailCard title="Holder Concentration" icon={icon}>
        <p className="text-sm text-text-secondary">Security data unavailable for holder analysis.</p>
      </DetailCard>
    );
  }

  const holderCount = holders.holder_count
    ? parseInt(holders.holder_count).toLocaleString()
    : "Unknown";

  return (
    <DetailCard title="Holder Concentration" icon={icon}>
      <div className="space-y-3">
        <Bar label="Top 1 Holder" pct={holders.top1_pct} warn={holders.top1_pct != null && holders.top1_pct > 20} />
        <Bar label="Top 5 Holders" pct={holders.top5_pct} warn={holders.top5_pct != null && holders.top5_pct > 50} />
        <Bar label="Top 10 Holders" pct={holders.top10_pct} warn={holders.top10_pct != null && holders.top10_pct > 70} />
      </div>
      <div className="mt-4 pt-3 border-t border-border-card/30 flex justify-between text-xs">
        <span className="text-text-secondary">Total Holders</span>
        <span className="font-medium text-text-primary">{holderCount}</span>
      </div>
    </DetailCard>
  );
}
