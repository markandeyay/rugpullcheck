import { AdminInfo } from "@/lib/types";
import DetailCard from "./DetailCard";

interface OwnershipCardProps {
  admin: AdminInfo;
}

const FLAG_LABELS: Record<string, string> = {
  mint_function_detected: "Mint Function",
  blacklist_function_detected: "Blacklist",
  blacklist_terms_detected: "Blacklist (source)",
  proxy_contract_detected: "Proxy/Upgradeable",
  transfer_pausable: "Pausable",
  slippage_modifiable: "Tax Modifiable",
  personal_tax_modifiable: "Per-Addr Tax",
  hidden_owner_detected: "Hidden Owner",
  can_reclaim_ownership: "Reclaimable",
  self_destruct_function: "Self-Destruct",
  external_call_risk: "External Call",
  trading_cooldown_enabled: "Trade Cooldown",
  fee_modification_detected: "Fee Modify",
  tax_modification_detected: "Tax Modify",
  pause_function_detected: "Pause Function",
  trading_toggle_detected: "Trade Toggle",
  owner_restricted_functions: "Owner-Only Fns",
};

function StatusRow({ label, ok, value }: { label: string; ok: boolean | null; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-text-secondary">{label}</span>
      <span
        className={`text-sm font-medium ${
          ok === null ? "text-text-secondary" : ok ? "text-risk-low" : "text-risk-high"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function OwnershipCard({ admin }: OwnershipCardProps) {
  const icon = (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
    </svg>
  );

  const hasDanger = admin.flags.length > 3 || admin.flags.some((f) =>
    ["hidden_owner_detected", "self_destruct_function", "mint_function_detected"].includes(f)
  );

  return (
    <DetailCard title="Ownership & Admin" icon={icon} variant={hasDanger ? "danger" : "default"}>
      <div className="space-y-0.5 divide-y divide-border-card/30">
        <StatusRow
          label="Has Owner"
          ok={admin.has_owner === false ? true : admin.has_owner === true ? false : null}
          value={admin.has_owner == null ? "Unknown" : admin.has_owner ? "Yes" : "No"}
        />
        <StatusRow
          label="Owner Renounced"
          ok={admin.owner_renounced ?? null}
          value={admin.owner_renounced == null ? "Unknown" : admin.owner_renounced ? "Yes" : "No"}
        />
        {admin.owner_address && (
          <div className="flex justify-between items-center py-1.5">
            <span className="text-xs text-text-secondary">Owner Address</span>
            <code className="text-xs text-text-secondary font-mono">
              {admin.owner_address.slice(0, 6)}...{admin.owner_address.slice(-4)}
            </code>
          </div>
        )}
        <StatusRow
          label="Proxy Contract"
          ok={admin.upgradeable_proxy_suspected ? false : admin.upgradeable_proxy_suspected === false ? true : null}
          value={
            admin.upgradeable_proxy_suspected == null
              ? "Unknown"
              : admin.upgradeable_proxy_suspected
              ? "Detected"
              : "No"
          }
        />
      </div>

      {/* Admin flags */}
      {admin.flags.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border-card/30">
          <p className="text-xs text-text-secondary mb-2">Admin Flags</p>
          <div className="flex flex-wrap gap-1.5">
            {admin.flags.map((flag) => (
              <span
                key={flag}
                className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-risk-high/10 text-risk-high border border-risk-high/20"
              >
                {FLAG_LABELS[flag] || flag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </DetailCard>
  );
}
