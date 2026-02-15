export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  total_supply: string | null;
  age_days: number | null;
  verified: boolean | null;
}

export interface MarketInfo {
  dex: string;
  pair_address: string | null;
  base_symbol: string;
  quote_symbol: string;
  liquidity_usd: number | null;
  volume_24h_usd: number | null;
  price_usd: string | null;
  price_change_24h_pct: number | null;
  fdv: number | null;
  market_cap: number | null;
  pair_created_at: number | null;
}

export interface HoldersInfo {
  top1_pct: number | null;
  top5_pct: number | null;
  top10_pct: number | null;
  holder_count: string | null;
  data_source: string;
}

export interface AdminInfo {
  has_owner: boolean | null;
  owner_renounced: boolean | null;
  owner_address: string | null;
  upgradeable_proxy_suspected: boolean | null;
  flags: string[];
}

export interface TradeRiskInfo {
  honeypot: boolean;
  buy_tax_pct: number | null;
  sell_tax_pct: number | null;
  cannot_sell: boolean;
  cannot_buy: boolean;
  source: string;
}

export interface ScoreInfo {
  risk_score: number;
  label: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
}

export interface LinksInfo {
  dexscreener: string;
  explorer: string;
}

export interface AnalyzeResponse {
  token: TokenInfo;
  market: MarketInfo | null;
  holders: HoldersInfo | null;
  admin: AdminInfo;
  trade_risk: TradeRiskInfo | null;
  score: ScoreInfo;
  links: LinksInfo;
}

export interface AnalyzeRequest {
  chain: string;
  token_address: string;
}

export type Chain = "ethereum" | "base" | "arbitrum" | "polygon" | "bsc";

export const CHAINS: { id: Chain; name: string; short: string }[] = [
  { id: "ethereum", name: "Ethereum", short: "ETH" },
  { id: "base", name: "Base", short: "BASE" },
  { id: "arbitrum", name: "Arbitrum", short: "ARB" },
  { id: "polygon", name: "Polygon", short: "MATIC" },
  { id: "bsc", name: "BSC", short: "BNB" },
];
