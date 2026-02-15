"""
Pydantic models for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List


class AnalyzeRequest(BaseModel):
    chain: str = Field(
        default="ethereum",
        description="Chain identifier: ethereum, base, arbitrum, polygon, bsc",
    )
    token_address: str = Field(
        ...,
        description="Token contract address (0x...)",
        min_length=42,
        max_length=42,
    )


class TokenInfo(BaseModel):
    address: str
    name: str = "Unknown"
    symbol: str = "???"
    decimals: int = 18
    total_supply: Optional[str] = None
    age_days: Optional[int] = None
    verified: Optional[bool] = None


class MarketInfo(BaseModel):
    dex: str = "Unknown"
    pair_address: Optional[str] = None
    base_symbol: str = ""
    quote_symbol: str = ""
    liquidity_usd: Optional[float] = None
    volume_24h_usd: Optional[float] = None
    price_usd: Optional[str] = None
    price_change_24h_pct: Optional[float] = None
    fdv: Optional[float] = None
    market_cap: Optional[float] = None
    pair_created_at: Optional[int] = None


class HoldersInfo(BaseModel):
    top1_pct: Optional[float] = None
    top5_pct: Optional[float] = None
    top10_pct: Optional[float] = None
    holder_count: Optional[str] = None
    data_source: str = "goplus"


class AdminInfo(BaseModel):
    has_owner: Optional[bool] = None
    owner_renounced: Optional[bool] = None
    owner_address: Optional[str] = None
    upgradeable_proxy_suspected: Optional[bool] = None
    flags: List[str] = Field(default_factory=list)


class TradeRiskInfo(BaseModel):
    honeypot: bool = False
    buy_tax_pct: Optional[float] = None
    sell_tax_pct: Optional[float] = None
    cannot_sell: bool = False
    cannot_buy: bool = False
    source: str = "goplus"


class ScoreInfo(BaseModel):
    risk_score: int = Field(ge=0, le=100)
    label: str
    reasons: List[str] = Field(default_factory=list)


class LinksInfo(BaseModel):
    dexscreener: str = ""
    explorer: str = ""


class AnalyzeResponse(BaseModel):
    token: TokenInfo
    market: Optional[MarketInfo] = None
    holders: Optional[HoldersInfo] = None
    admin: AdminInfo
    trade_risk: Optional[TradeRiskInfo] = None
    score: ScoreInfo
    links: LinksInfo
