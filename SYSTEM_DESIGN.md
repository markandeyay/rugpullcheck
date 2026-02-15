# RugCheck — Complete System Design Document

> **Purpose**: This document is the single source of truth for Claude Code to build the entire RugCheck project end-to-end. Every file, endpoint, component, API integration, scoring algorithm, and deployment step is specified here. Follow this document top-to-bottom.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Project Structure](#4-project-structure)
5. [Backend — FastAPI](#5-backend--fastapi)
6. [External API Integrations](#6-external-api-integrations)
7. [Scoring Engine](#7-scoring-engine)
8. [Data Models & Schemas](#8-data-models--schemas)
9. [Frontend — Next.js](#9-frontend--nextjs)
10. [Environment Variables & Configuration](#10-environment-variables--configuration)
11. [Error Handling & Edge Cases](#11-error-handling--edge-cases)
12. [Caching Strategy](#12-caching-strategy)
13. [Deployment](#13-deployment)
14. [Build & Run Instructions](#14-build--run-instructions)
15. [Testing](#15-testing)

---

## 1. Product Overview

### Name
**RugCheck** (display name in UI), package name `rugcheck`

### One-liner
Paste a token contract address → get a Rug Pull Risk Score (0–100) with explainable on-chain signals covering holder concentration, liquidity, ownership, mintability, and honeypot indicators.

### Supported Chains
| Chain | Chain ID (Etherscan V2) | DexScreener chainId | GoPlus chain_id |
|-------|------------------------|--------------------|-----------------| 
| Ethereum | 1 | `ethereum` | `1` |
| Base | 8453 | `base` | `8453` |
| Arbitrum | 42161 | `arbitrum` | `42161` |
| Polygon | 137 | `polygon` | `137` |
| BSC | 56 | `bsc` | `56` |

### Demo Flow (60 seconds)
1. User selects chain from dropdown (default: Ethereum)
2. User pastes token contract address (0x...)
3. App shows loading skeleton with progress text ("Fetching DEX data...", "Analyzing contract...", "Computing risk score...")
4. Results appear: Big risk score gauge (0–100), HIGH/MEDIUM/LOW label, 3–5 reason bullets
5. Below: expandable detail cards for Liquidity, Holders, Ownership, Trade Risk
6. Links to Etherscan, DexScreener for further investigation

---

## 2. Architecture Overview

```
┌─────────────────────┐         ┌──────────────────────────────┐
│   Next.js Frontend  │  POST   │       FastAPI Backend         │
│   (Vite/Next 14)    │────────▶│                              │
│                     │◀────────│  POST /api/analyze           │
│  - Input form       │  JSON   │  GET  /api/health            │
│  - Score gauge      │         │  GET  /api/report/{chain}/{addr}│
│  - Detail cards     │         │                              │
│  - Loading states   │         │  ┌──────────────────────┐    │
└─────────────────────┘         │  │   Analysis Pipeline   │    │
                                │  │                      │    │
                                │  │ 1. DexScreener API   │    │
                                │  │ 2. Etherscan V2 API  │    │
                                │  │ 3. GoPlus API        │    │
                                │  │ 4. Scoring Engine    │    │
                                │  └──────────────────────┘    │
                                │                              │
                                │  ┌──────────────────────┐    │
                                │  │   TTL Cache (10min)   │    │
                                │  └──────────────────────┘    │
                                └──────────────────────────────┘
```

### Key Design Decisions
- **Monorepo**: Single repo with `/backend` and `/frontend` directories
- **API-first**: Backend returns complete JSON; frontend is a pure renderer
- **Parallel fetching**: All three external APIs are called concurrently via `asyncio.gather`
- **Graceful degradation**: If any API fails, the others still contribute to the score. Missing data is flagged, not fatal.

---

## 3. Tech Stack & Dependencies

### Backend (`/backend`)
```
Python 3.11+
fastapi==0.115.*
uvicorn[standard]==0.34.*
httpx==0.28.*          # async HTTP client for external APIs
pydantic==2.*          # request/response models
cachetools==5.*        # TTL in-memory cache
python-dotenv==1.*     # .env loading
```

**requirements.txt**:
```
fastapi>=0.115.0
uvicorn[standard]>=0.34.0
httpx>=0.28.0
pydantic>=2.0.0
cachetools>=5.0.0
python-dotenv>=1.0.0
```

### Frontend (`/frontend`)
```
Next.js 14 (App Router)
React 18
TypeScript
Tailwind CSS 3
```

**Key npm packages**:
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## 4. Project Structure

```
rugcheck/
├── README.md
├── .gitignore
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── main.py                  # FastAPI app entry + CORS + routes
│   ├── config.py                # Settings, env vars, chain configs
│   ├── models.py                # Pydantic request/response schemas
│   ├── cache.py                 # TTL cache wrapper
│   ├── analyzer.py              # Main orchestrator: calls APIs, runs scoring
│   ├── scoring.py               # Risk scoring engine (pure functions)
│   └── services/
│       ├── __init__.py
│       ├── dexscreener.py       # DexScreener API client
│       ├── etherscan.py         # Etherscan V2 API client
│       └── goplus.py            # GoPlus Security API client
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── .env.local.example
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       # Root layout with fonts, metadata
│       │   ├── page.tsx         # Home page with search form
│       │   └── globals.css      # Tailwind imports + custom styles
│       ├── components/
│       │   ├── SearchForm.tsx   # Chain selector + address input + submit
│       │   ├── ScoreGauge.tsx   # Animated 0-100 risk gauge
│       │   ├── RiskLabel.tsx    # HIGH/MEDIUM/LOW badge
│       │   ├── ReasonsList.tsx  # Bullet list of risk reasons
│       │   ├── DetailCard.tsx   # Expandable card component
│       │   ├── LiquidityCard.tsx
│       │   ├── HoldersCard.tsx
│       │   ├── OwnershipCard.tsx
│       │   ├── TradeRiskCard.tsx
│       │   ├── TokenHeader.tsx  # Token name, symbol, links
│       │   ├── LoadingSkeleton.tsx
│       │   └── ErrorDisplay.tsx
│       ├── lib/
│       │   ├── api.ts           # fetch wrapper for backend calls
│       │   └── types.ts         # TypeScript types matching backend models
│       └── hooks/
│           └── useAnalysis.ts   # React hook for analysis state management
```

---

## 5. Backend — FastAPI

### 5.1 `main.py` — App Setup

```python
"""
FastAPI application entry point.
- Mounts CORS middleware (allow frontend origin)
- Defines API routes
- Runs with uvicorn
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx

from config import settings
from models import AnalyzeRequest, AnalyzeResponse
from analyzer import analyze_token
from cache import get_cached, set_cached

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create a shared httpx async client for connection pooling
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    yield
    await app.state.http_client.aclose()

app = FastAPI(
    title="RugCheck API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Main analysis endpoint.
    1. Validate address format
    2. Check cache
    3. Run analysis pipeline
    4. Cache result
    5. Return response
    """
    cache_key = f"{request.chain}:{request.token_address.lower()}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        result = await analyze_token(
            chain=request.chain,
            token_address=request.token_address,
            http_client=app.state.http_client,
        )
        set_cached(cache_key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/report/{chain}/{token_address}", response_model=AnalyzeResponse)
async def get_report(chain: str, token_address: str):
    """Shareable report link — same logic as POST but via GET for link sharing."""
    cache_key = f"{chain}:{token_address.lower()}"
    cached = get_cached(cache_key)
    if cached:
        return cached
    try:
        result = await analyze_token(
            chain=chain,
            token_address=token_address,
            http_client=app.state.http_client,
        )
        set_cached(cache_key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

### 5.2 `config.py` — Configuration

```python
"""
Application settings loaded from environment variables.
Chain configuration mapping.
"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Keys
    etherscan_api_key: str = ""
    goplus_api_key: Optional[str] = None    # Optional — GoPlus free tier works without key
    goplus_api_secret: Optional[str] = None

    # Server
    backend_port: int = 8000
    frontend_url: str = "http://localhost:3000"

    # Cache
    cache_ttl_seconds: int = 600  # 10 minutes

    class Config:
        env_file = ".env"

settings = Settings()

# Chain configuration
CHAIN_CONFIG = {
    "ethereum": {
        "chain_id": 1,
        "dexscreener_id": "ethereum",
        "goplus_chain_id": "1",
        "explorer_url": "https://etherscan.io",
        "name": "Ethereum",
    },
    "base": {
        "chain_id": 8453,
        "dexscreener_id": "base",
        "goplus_chain_id": "8453",
        "explorer_url": "https://basescan.org",
        "name": "Base",
    },
    "arbitrum": {
        "chain_id": 42161,
        "dexscreener_id": "arbitrum",
        "goplus_chain_id": "42161",
        "explorer_url": "https://arbiscan.io",
        "name": "Arbitrum",
    },
    "polygon": {
        "chain_id": 137,
        "dexscreener_id": "polygon",
        "goplus_chain_id": "137",
        "explorer_url": "https://polygonscan.com",
        "name": "Polygon",
    },
    "bsc": {
        "chain_id": 56,
        "dexscreener_id": "bsc",
        "goplus_chain_id": "56",
        "explorer_url": "https://bscscan.com",
        "name": "BSC",
    },
}

def get_chain_config(chain: str) -> dict:
    """Get chain configuration or raise ValueError."""
    if chain not in CHAIN_CONFIG:
        raise ValueError(f"Unsupported chain: {chain}. Supported: {list(CHAIN_CONFIG.keys())}")
    return CHAIN_CONFIG[chain]
```

### 5.3 `cache.py` — In-Memory TTL Cache

```python
"""
Simple TTL cache using cachetools.
Caches analysis results for config.cache_ttl_seconds (default 10 min).
"""
from cachetools import TTLCache
from config import settings

_cache = TTLCache(maxsize=500, ttl=settings.cache_ttl_seconds)

def get_cached(key: str):
    return _cache.get(key)

def set_cached(key: str, value):
    _cache[key] = value
```

### 5.4 `analyzer.py` — Main Orchestrator

```python
"""
Main analysis pipeline orchestrator.
Calls all three external API services in parallel, then computes the risk score.
Handles partial failures gracefully.
"""
import asyncio
import httpx
from typing import Optional

from config import get_chain_config
from models import (
    AnalyzeResponse, TokenInfo, MarketInfo, HoldersInfo,
    AdminInfo, TradeRiskInfo, ScoreInfo, LinksInfo
)
from services.dexscreener import fetch_dexscreener_data
from services.etherscan import fetch_etherscan_data
from services.goplus import fetch_goplus_data
from scoring import compute_risk_score


async def analyze_token(
    chain: str,
    token_address: str,
    http_client: httpx.AsyncClient,
) -> AnalyzeResponse:
    """
    Run the full analysis pipeline:
    1. Fetch data from DexScreener, Etherscan, GoPlus in parallel
    2. Merge results into a unified data model
    3. Compute risk score
    4. Return structured response
    """
    chain_config = get_chain_config(chain)
    address = token_address.lower().strip()

    # Validate address format (basic check)
    if not address.startswith("0x") or len(address) != 42:
        raise ValueError("Invalid token address format. Must be 0x followed by 40 hex characters.")

    # Parallel API calls — each returns its data or None on failure
    dex_task = fetch_dexscreener_data(http_client, chain_config["dexscreener_id"], address)
    etherscan_task = fetch_etherscan_data(http_client, chain_config["chain_id"], address)
    goplus_task = fetch_goplus_data(http_client, chain_config["goplus_chain_id"], address)

    dex_data, etherscan_data, goplus_data = await asyncio.gather(
        dex_task, etherscan_task, goplus_task,
        return_exceptions=True
    )

    # Handle exceptions from gather — convert to None
    if isinstance(dex_data, Exception):
        print(f"DexScreener error: {dex_data}")
        dex_data = None
    if isinstance(etherscan_data, Exception):
        print(f"Etherscan error: {etherscan_data}")
        etherscan_data = None
    if isinstance(goplus_data, Exception):
        print(f"GoPlus error: {goplus_data}")
        goplus_data = None

    # Build token info (merge from all sources)
    token_info = _build_token_info(address, dex_data, etherscan_data, goplus_data)
    market_info = _build_market_info(dex_data, chain_config)
    holders_info = _build_holders_info(goplus_data)
    admin_info = _build_admin_info(etherscan_data, goplus_data)
    trade_risk_info = _build_trade_risk_info(goplus_data)

    # Compute risk score
    score_info = compute_risk_score(
        token=token_info,
        market=market_info,
        holders=holders_info,
        admin=admin_info,
        trade_risk=trade_risk_info,
    )

    # Build links
    explorer_base = chain_config["explorer_url"]
    dex_chain = chain_config["dexscreener_id"]
    pair_address = market_info.pair_address if market_info else None
    links_info = LinksInfo(
        dexscreener=f"https://dexscreener.com/{dex_chain}/{pair_address}" if pair_address else f"https://dexscreener.com/{dex_chain}/{address}",
        explorer=f"{explorer_base}/token/{address}",
    )

    return AnalyzeResponse(
        token=token_info,
        market=market_info,
        holders=holders_info,
        admin=admin_info,
        trade_risk=trade_risk_info,
        score=score_info,
        links=links_info,
    )


def _build_token_info(address, dex_data, etherscan_data, goplus_data) -> TokenInfo:
    """Merge token metadata from all sources."""
    name = "Unknown"
    symbol = "???"
    decimals = 18
    total_supply = None
    age_days = None
    verified = None

    # DexScreener provides name/symbol from DEX pairs
    if dex_data:
        name = dex_data.get("name", name)
        symbol = dex_data.get("symbol", symbol)
        age_days = dex_data.get("pair_age_days")

    # GoPlus provides token name as well
    if goplus_data:
        if goplus_data.get("token_name"):
            name = goplus_data["token_name"]
        if goplus_data.get("token_symbol"):
            symbol = goplus_data["token_symbol"]
        if goplus_data.get("total_supply"):
            total_supply = goplus_data["total_supply"]

    # Etherscan provides verification status
    if etherscan_data:
        verified = etherscan_data.get("is_verified", None)
        if etherscan_data.get("contract_name"):
            name = etherscan_data["contract_name"]

    return TokenInfo(
        address=address,
        name=name,
        symbol=symbol,
        decimals=decimals,
        total_supply=total_supply,
        age_days=age_days,
        verified=verified,
    )


def _build_market_info(dex_data, chain_config) -> Optional[MarketInfo]:
    """Build market info from DexScreener data."""
    if not dex_data or not dex_data.get("pair"):
        return None

    pair = dex_data["pair"]
    return MarketInfo(
        dex=pair.get("dex_id", "Unknown"),
        pair_address=pair.get("pair_address"),
        base_symbol=pair.get("base_symbol", ""),
        quote_symbol=pair.get("quote_symbol", ""),
        liquidity_usd=pair.get("liquidity_usd"),
        volume_24h_usd=pair.get("volume_24h"),
        price_usd=pair.get("price_usd"),
        price_change_24h_pct=pair.get("price_change_24h"),
        fdv=pair.get("fdv"),
        market_cap=pair.get("market_cap"),
        pair_created_at=pair.get("pair_created_at"),
    )


def _build_holders_info(goplus_data) -> Optional[HoldersInfo]:
    """
    Build holder concentration info.
    Primary source: GoPlus (returns top holders with percentages).
    """
    if not goplus_data or not goplus_data.get("holders"):
        return None

    holders = goplus_data["holders"]
    total_supply_str = goplus_data.get("total_supply", "0")
    holder_count = goplus_data.get("holder_count")

    # Calculate top holder percentages from GoPlus holder list
    # GoPlus returns holders sorted by balance, each with "percent" field
    top1_pct = 0.0
    top5_pct = 0.0
    top10_pct = 0.0

    for i, h in enumerate(holders[:10]):
        pct = float(h.get("percent", 0)) * 100  # GoPlus returns as decimal (0.xx)
        if i < 1:
            top1_pct += pct
        if i < 5:
            top5_pct += pct
        if i < 10:
            top10_pct += pct

    return HoldersInfo(
        top1_pct=round(top1_pct, 2),
        top5_pct=round(top5_pct, 2),
        top10_pct=round(top10_pct, 2),
        holder_count=holder_count,
        data_source="goplus",
    )


def _build_admin_info(etherscan_data, goplus_data) -> AdminInfo:
    """Build admin/ownership control flags from Etherscan + GoPlus."""
    has_owner = None
    owner_renounced = None
    owner_address = None
    upgradeable_proxy = None
    flags = []

    if goplus_data:
        # GoPlus returns "1"/"0" strings for boolean fields
        owner_addr = goplus_data.get("owner_address", "")
        has_owner = bool(owner_addr and owner_addr != "0x0000000000000000000000000000000000000000")
        owner_renounced = not has_owner
        owner_address = owner_addr if has_owner else None

        if goplus_data.get("is_mintable") == "1":
            flags.append("mint_function_detected")
        if goplus_data.get("is_proxy") == "1":
            upgradeable_proxy = True
            flags.append("proxy_contract_detected")
        if goplus_data.get("transfer_pausable") == "1":
            flags.append("transfer_pausable")
        if goplus_data.get("slippage_modifiable") == "1":
            flags.append("slippage_modifiable")
        if goplus_data.get("is_blacklisted") == "1":
            flags.append("blacklist_function_detected")
        if goplus_data.get("personal_slippage_modifiable") == "1":
            flags.append("personal_tax_modifiable")
        if goplus_data.get("trading_cooldown") == "1":
            flags.append("trading_cooldown_enabled")
        if goplus_data.get("hidden_owner") == "1":
            flags.append("hidden_owner_detected")
        if goplus_data.get("can_take_back_ownership") == "1":
            flags.append("can_reclaim_ownership")
        if goplus_data.get("selfdestruct") == "1":
            flags.append("self_destruct_function")
        if goplus_data.get("external_call") == "1":
            flags.append("external_call_risk")

    # If Etherscan data includes source code analysis
    if etherscan_data and etherscan_data.get("source_code"):
        source = etherscan_data["source_code"].lower()
        # Heuristic keyword search in source code
        danger_patterns = {
            "mint": "mint_function_detected",
            "blacklist": "blacklist_terms_detected",
            "setfee": "fee_modification_detected",
            "settax": "tax_modification_detected",
            "pause": "pause_function_detected",
            "tradingenabled": "trading_toggle_detected",
            "onlyowner": "owner_restricted_functions",
        }
        for keyword, flag in danger_patterns.items():
            if keyword in source and flag not in flags:
                flags.append(flag)

    return AdminInfo(
        has_owner=has_owner,
        owner_renounced=owner_renounced,
        owner_address=owner_address,
        upgradeable_proxy_suspected=upgradeable_proxy,
        flags=flags,
    )


def _build_trade_risk_info(goplus_data) -> Optional[TradeRiskInfo]:
    """Build honeypot/tax/sellability flags from GoPlus."""
    if not goplus_data:
        return None

    return TradeRiskInfo(
        honeypot=goplus_data.get("is_honeypot") == "1",
        buy_tax_pct=_safe_float(goplus_data.get("buy_tax")),
        sell_tax_pct=_safe_float(goplus_data.get("sell_tax")),
        cannot_sell=goplus_data.get("cannot_sell_all") == "1",
        cannot_buy=goplus_data.get("cannot_buy") == "1",
        source="goplus",
    )


def _safe_float(val) -> Optional[float]:
    """Safely convert a string to float, returning None on failure."""
    if val is None or val == "":
        return None
    try:
        return round(float(val) * 100, 2)  # GoPlus returns tax as decimal (0.xx)
    except (ValueError, TypeError):
        return None
```

### 5.5 `scoring.py` — Risk Scoring Engine

See [Section 7](#7-scoring-engine) for the complete scoring algorithm. This file contains pure functions only (no I/O).

### 5.6 `services/` — External API Clients

See [Section 6](#6-external-api-integrations) for complete implementation of each service.

---

## 6. External API Integrations

### 6.1 DexScreener API (`services/dexscreener.py`)

**No API key required. Free tier. Rate limit: 300 requests/min for pair endpoints.**

#### Endpoint Used
```
GET https://api.dexscreener.com/tokens/v1/{chainId}/{tokenAddress}
```

This returns an array of pair objects for the given token. We pick the pair with the highest liquidity.

#### Response Shape (what we extract)
```json
[
  {
    "chainId": "ethereum",
    "dexId": "uniswap",
    "url": "https://dexscreener.com/ethereum/0x...",
    "pairAddress": "0x...",
    "baseToken": { "address": "0x...", "name": "TokenName", "symbol": "TKN" },
    "quoteToken": { "address": "0x...", "name": "Wrapped Ether", "symbol": "WETH" },
    "priceNative": "0.0001234",
    "priceUsd": "0.45",
    "txns": { "h24": { "buys": 150, "sells": 80 } },
    "volume": { "h24": 50000 },
    "priceChange": { "h24": -12.5 },
    "liquidity": { "usd": 125000, "base": 100000, "quote": 25 },
    "fdv": 5000000,
    "marketCap": 3000000,
    "pairCreatedAt": 1700000000000
  }
]
```

#### Implementation

```python
"""
DexScreener API client.
Fetches trading pair data, liquidity, volume, and price information.
No API key required.
"""
import httpx
from typing import Optional
from datetime import datetime, timezone

DEXSCREENER_BASE = "https://api.dexscreener.com"


async def fetch_dexscreener_data(
    client: httpx.AsyncClient,
    chain_id: str,
    token_address: str,
) -> Optional[dict]:
    """
    Fetch token pair data from DexScreener.
    Returns normalized dict with best pair data, or None on failure.
    """
    url = f"{DEXSCREENER_BASE}/tokens/v1/{chain_id}/{token_address}"

    response = await client.get(url)
    response.raise_for_status()

    pairs = response.json()

    if not pairs or not isinstance(pairs, list) or len(pairs) == 0:
        return None

    # Select the pair with the highest USD liquidity
    best_pair = max(
        pairs,
        key=lambda p: (p.get("liquidity") or {}).get("usd") or 0
    )

    # Calculate pair age in days
    pair_age_days = None
    created_at = best_pair.get("pairCreatedAt")
    if created_at:
        try:
            created_dt = datetime.fromtimestamp(created_at / 1000, tz=timezone.utc)
            pair_age_days = (datetime.now(timezone.utc) - created_dt).days
        except (ValueError, OSError):
            pass

    base_token = best_pair.get("baseToken", {})
    quote_token = best_pair.get("quoteToken", {})
    liquidity = best_pair.get("liquidity") or {}
    volume = best_pair.get("volume") or {}
    price_change = best_pair.get("priceChange") or {}

    return {
        "name": base_token.get("name"),
        "symbol": base_token.get("symbol"),
        "pair_age_days": pair_age_days,
        "pair": {
            "dex_id": best_pair.get("dexId"),
            "pair_address": best_pair.get("pairAddress"),
            "base_symbol": base_token.get("symbol"),
            "quote_symbol": quote_token.get("symbol"),
            "liquidity_usd": liquidity.get("usd"),
            "volume_24h": volume.get("h24"),
            "price_usd": best_pair.get("priceUsd"),
            "price_change_24h": price_change.get("h24"),
            "fdv": best_pair.get("fdv"),
            "market_cap": best_pair.get("marketCap"),
            "pair_created_at": created_at,
        },
        "all_pairs_count": len(pairs),
    }
```

### 6.2 Etherscan V2 API (`services/etherscan.py`)

**Requires API key (free tier: 5 calls/sec). V2 endpoint supports all chains with single key.**

#### Endpoints Used

1. **Get Source Code** — contract verification status + source code for heuristic analysis
```
GET https://api.etherscan.io/v2/api
  ?chainid={chainId}
  &module=contract
  &action=getsourcecode
  &address={address}
  &apikey={key}
```

2. **Get Token Supply** — total supply
```
GET https://api.etherscan.io/v2/api
  ?chainid={chainId}
  &module=stats
  &action=tokensupply
  &contractaddress={address}
  &apikey={key}
```

3. **Get Token Holder List** (free tier) — paginated holder list
```
GET https://api.etherscan.io/v2/api
  ?chainid={chainId}
  &module=token
  &action=tokenholderlist
  &contractaddress={address}
  &page=1
  &offset=10
  &apikey={key}
```

> **Note**: `action=topholders` is a PRO-only endpoint. The free tier `tokenholderlist` returns holders sorted by balance descending, which serves the same purpose for our top-N analysis.

#### Implementation

```python
"""
Etherscan V2 API client.
Fetches contract verification status, source code, and token holder data.
Uses Etherscan V2 unified API (single key for all EVM chains).
"""
import httpx
from typing import Optional
from config import settings

ETHERSCAN_V2_BASE = "https://api.etherscan.io/v2/api"


async def fetch_etherscan_data(
    client: httpx.AsyncClient,
    chain_id: int,
    token_address: str,
) -> Optional[dict]:
    """
    Fetch contract and token data from Etherscan V2.
    Returns normalized dict or None on failure.
    """
    if not settings.etherscan_api_key:
        return None

    # Fetch source code (verification status)
    source_data = await _get_source_code(client, chain_id, token_address)

    return source_data


async def _get_source_code(
    client: httpx.AsyncClient,
    chain_id: int,
    address: str,
) -> Optional[dict]:
    """Fetch contract source code and verification status."""
    params = {
        "chainid": chain_id,
        "module": "contract",
        "action": "getsourcecode",
        "address": address,
        "apikey": settings.etherscan_api_key,
    }

    try:
        response = await client.get(ETHERSCAN_V2_BASE, params=params)
        response.raise_for_status()
        data = response.json()

        if data.get("status") != "1" or not data.get("result"):
            return None

        result = data["result"][0] if isinstance(data["result"], list) else data["result"]

        source_code = result.get("SourceCode", "")
        abi = result.get("ABI", "")
        is_verified = bool(
            source_code
            and source_code != ""
            and abi != "Contract source code not verified"
        )

        return {
            "is_verified": is_verified,
            "contract_name": result.get("ContractName", ""),
            "compiler_version": result.get("CompilerVersion", ""),
            "source_code": source_code if is_verified else None,
            "abi": abi if is_verified else None,
            "proxy": result.get("Proxy", "0") == "1",
            "implementation": result.get("Implementation", ""),
        }
    except Exception as e:
        print(f"Etherscan source code fetch failed: {e}")
        return None
```

### 6.3 GoPlus Security API (`services/goplus.py`)

**Free tier available (no key needed for basic queries). With key: higher rate limits.**

#### Endpoint Used
```
GET https://api.gopluslabs.io/api/v1/token_security/{chain_id}
  ?contract_addresses={address}
```

#### GoPlus Chain IDs
| Chain | GoPlus chain_id |
|-------|----------------|
| Ethereum | `1` |
| BSC | `56` |
| Polygon | `137` |
| Arbitrum | `42161` |
| Base | `8453` |
| Optimism | `10` |
| Avalanche | `43114` |
| Fantom | `250` |
| Cronos | `25` |

#### Response Fields We Use
The GoPlus token security endpoint returns a rich set of fields per token address. Here are all the fields we extract:

**Token Metadata:**
- `token_name` — string
- `token_symbol` — string  
- `total_supply` — string (raw number)
- `holder_count` — string (number of holders)

**Holder Data:**
- `holders` — array of `{ address, tag, is_contract, balance, percent, is_locked }`
  - `percent` is a decimal string like `"0.312"` meaning 31.2%
- `lp_holders` — array of LP token holders (same shape)
- `lp_total_supply` — string

**Contract Security (all "1"/"0" strings):**
- `is_open_source` — "1" if contract source is verified/open
- `is_proxy` — "1" if proxy contract pattern detected
- `is_mintable` — "1" if mint function exists
- `is_honeypot` — "1" if honeypot pattern detected
- `is_blacklisted` — "1" if blacklist function exists
- `is_whitelisted` — "1" if whitelist function exists
- `is_in_dex` — "1" if trading on a DEX
- `is_anti_whale` — "1" if anti-whale mechanism exists
- `selfdestruct` — "1" if self-destruct function found
- `external_call` — "1" if external call risk
- `hidden_owner` — "1" if hidden owner detected
- `can_take_back_ownership` — "1" if ownership can be reclaimed
- `transfer_pausable` — "1" if transfers can be paused
- `slippage_modifiable` — "1" if tax/slippage can be changed
- `personal_slippage_modifiable` — "1" if per-address tax manipulation
- `trading_cooldown` — "1" if trading cooldown enforced
- `cannot_buy` — "1" if buying is blocked
- `cannot_sell_all` — "1" if selling all tokens is blocked

**Tax Data:**
- `buy_tax` — string decimal (e.g., "0.05" = 5%)
- `sell_tax` — string decimal

**Owner Data:**
- `owner_address` — string (address or empty)
- `creator_address` — string
- `creator_balance` — string
- `creator_percent` — string decimal
- `owner_balance` — string
- `owner_percent` — string decimal

#### Implementation

```python
"""
GoPlus Security API client.
Fetches comprehensive token security analysis including honeypot detection,
holder analysis, ownership flags, and tax information.
Free tier works without API key for basic queries.
"""
import httpx
from typing import Optional
from config import settings

GOPLUS_BASE = "https://api.gopluslabs.io/api/v1"


async def fetch_goplus_data(
    client: httpx.AsyncClient,
    chain_id: str,
    token_address: str,
) -> Optional[dict]:
    """
    Fetch token security data from GoPlus.
    Returns the raw GoPlus result dict for the token, or None on failure.
    """
    url = f"{GOPLUS_BASE}/token_security/{chain_id}"
    params = {"contract_addresses": token_address}

    # Add auth headers if API key is configured
    headers = {}
    if settings.goplus_api_key:
        headers["Authorization"] = settings.goplus_api_key

    try:
        response = await client.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()

        if data.get("code") != 1:
            print(f"GoPlus returned error code: {data.get('code')}, message: {data.get('message')}")
            return None

        result = data.get("result", {})

        # GoPlus keys the result by lowercase address
        token_data = result.get(token_address.lower())
        if not token_data:
            # Try with original case
            token_data = result.get(token_address)

        if not token_data:
            print(f"GoPlus: No data found for {token_address} on chain {chain_id}")
            return None

        return token_data

    except httpx.HTTPStatusError as e:
        print(f"GoPlus HTTP error: {e.response.status_code}")
        return None
    except Exception as e:
        print(f"GoPlus error: {e}")
        return None
```

---

## 7. Scoring Engine

### `scoring.py` — Complete Implementation

The scoring engine uses a **weighted additive model** with 6 signal categories. Each contributes to a 0–100 risk score. The score is explainable: every point added generates a human-readable reason.

```python
"""
Risk Scoring Engine.
Computes a 0-100 risk score from analysis signals.
Pure functions — no I/O, no side effects.

Scoring Categories:
  - Holder Concentration: 0–30 points
  - Liquidity Depth: 0–20 points
  - Token Age: 0–10 points
  - Verification Status: 0–10 points
  - Admin/Owner Control: 0–20 points
  - Honeypot/Tax Risk: 0–30 points

Total possible: 120, clamped to 0–100.
"""
from typing import Optional
from models import (
    TokenInfo, MarketInfo, HoldersInfo, AdminInfo,
    TradeRiskInfo, ScoreInfo
)


def compute_risk_score(
    token: TokenInfo,
    market: Optional[MarketInfo],
    holders: Optional[HoldersInfo],
    admin: AdminInfo,
    trade_risk: Optional[TradeRiskInfo],
) -> ScoreInfo:
    """
    Compute the overall risk score and generate explanation reasons.
    Returns ScoreInfo with score (0-100), label, and reasons list.
    """
    score = 0
    reasons = []

    # ─── 1. HOLDER CONCENTRATION (0–30) ───
    score += _score_holders(holders, reasons)

    # ─── 2. LIQUIDITY DEPTH (0–20) ───
    score += _score_liquidity(market, reasons)

    # ─── 3. TOKEN AGE (0–10) ───
    score += _score_age(token, market, reasons)

    # ─── 4. VERIFICATION STATUS (0–10) ───
    score += _score_verification(token, reasons)

    # ─── 5. ADMIN / OWNER CONTROL (0–20) ───
    score += _score_admin(admin, reasons)

    # ─── 6. HONEYPOT / TAX RISK (0–30) ───
    score += _score_trade_risk(trade_risk, reasons)

    # Clamp to 0–100
    final_score = max(0, min(100, score))

    # Determine label
    if final_score >= 67:
        label = "HIGH"
    elif final_score >= 34:
        label = "MEDIUM"
    else:
        label = "LOW"

    # If we have very few signals, add a caveat
    if not market and not holders and not trade_risk:
        reasons.append("Limited data available — score may not reflect true risk.")

    return ScoreInfo(
        risk_score=final_score,
        label=label,
        reasons=reasons,
    )


def _score_holders(holders: Optional[HoldersInfo], reasons: list) -> int:
    """Score holder concentration risk (max 30 points)."""
    if not holders:
        return 0

    points = 0

    # Top 1 holder
    if holders.top1_pct and holders.top1_pct > 20:
        points += 10
        reasons.append(f"Top holder controls {holders.top1_pct}% of supply.")
    elif holders.top1_pct and holders.top1_pct > 10:
        points += 5

    # Top 5 holders
    if holders.top5_pct and holders.top5_pct > 70:
        points += 20
        reasons.append(f"Top 5 holders control {holders.top5_pct}% of supply — extreme concentration.")
    elif holders.top5_pct and holders.top5_pct > 50:
        points += 12
        reasons.append(f"Top 5 holders control {holders.top5_pct}% of supply — high concentration.")
    elif holders.top5_pct and holders.top5_pct > 30:
        points += 5

    # Low holder count
    if holders.holder_count is not None:
        try:
            count = int(holders.holder_count)
            if count < 50:
                points += 5
                reasons.append(f"Only {count} holders — very low distribution.")
            elif count < 200:
                points += 2
        except (ValueError, TypeError):
            pass

    return min(30, points)


def _score_liquidity(market: Optional[MarketInfo], reasons: list) -> int:
    """Score liquidity risk (max 20 points)."""
    if not market or market.liquidity_usd is None:
        reasons.append("No DEX liquidity data found.")
        return 10  # Unknown liquidity is moderately risky

    liq = market.liquidity_usd
    points = 0

    if liq < 5_000:
        points = 20
        reasons.append(f"Extremely low liquidity (${liq:,.0f}).")
    elif liq < 20_000:
        points = 15
        reasons.append(f"Very low liquidity (${liq:,.0f}).")
    elif liq < 50_000:
        points = 10
        reasons.append(f"Low liquidity (${liq:,.0f}).")
    elif liq < 100_000:
        points = 5
    # else: 0 — good liquidity

    return min(20, points)


def _score_age(token: TokenInfo, market: Optional[MarketInfo], reasons: list) -> int:
    """Score token age risk (max 10 points)."""
    age = token.age_days

    # If we don't have age from token, try pair age from market
    if age is None and market and market.pair_created_at:
        from datetime import datetime, timezone
        try:
            created = datetime.fromtimestamp(market.pair_created_at / 1000, tz=timezone.utc)
            age = (datetime.now(timezone.utc) - created).days
        except (ValueError, OSError):
            pass

    if age is None:
        return 0

    if age < 3:
        reasons.append(f"Token is only {age} day(s) old — very new.")
        return 10
    elif age < 7:
        reasons.append(f"Token is {age} days old.")
        return 8
    elif age < 30:
        return 5
    elif age < 90:
        return 2
    return 0


def _score_verification(token: TokenInfo, reasons: list) -> int:
    """Score contract verification risk (max 10 points)."""
    if token.verified is None:
        return 3  # Unknown verification is slightly risky

    if not token.verified:
        reasons.append("Contract source code is not verified.")
        return 10

    return 0


def _score_admin(admin: AdminInfo, reasons: list) -> int:
    """Score admin/ownership control risk (max 20 points)."""
    points = 0

    # Owner exists and not renounced
    if admin.has_owner and not admin.owner_renounced:
        points += 6
        reasons.append("Contract has an active owner (not renounced).")

    # Dangerous flags
    flag_scores = {
        "mint_function_detected": (6, "Owner can mint new tokens."),
        "blacklist_function_detected": (4, "Contract has blacklist capability."),
        "blacklist_terms_detected": (4, "Contract source mentions blacklist."),
        "proxy_contract_detected": (5, "Upgradeable proxy pattern detected — contract logic can be changed."),
        "transfer_pausable": (4, "Token transfers can be paused."),
        "slippage_modifiable": (5, "Tax/slippage can be modified by owner."),
        "personal_tax_modifiable": (5, "Per-address tax manipulation possible."),
        "hidden_owner_detected": (6, "Hidden owner detected — ownership may be disguised."),
        "can_reclaim_ownership": (5, "Ownership can be reclaimed after renouncing."),
        "self_destruct_function": (5, "Self-destruct function found."),
        "trading_toggle_detected": (4, "Trading can be toggled on/off."),
        "fee_modification_detected": (3, "Fee modification functions detected."),
        "tax_modification_detected": (3, "Tax modification functions detected."),
    }

    for flag in admin.flags:
        if flag in flag_scores:
            pts, reason = flag_scores[flag]
            points += pts
            reasons.append(reason)

    return min(20, points)


def _score_trade_risk(trade_risk: Optional[TradeRiskInfo], reasons: list) -> int:
    """Score honeypot/tax/sellability risk (max 30 points)."""
    if not trade_risk:
        return 0

    points = 0

    # Honeypot — worst possible signal
    if trade_risk.honeypot:
        points += 30
        reasons.append("⚠️ HONEYPOT DETECTED — you likely cannot sell this token.")
        return 30  # Max out immediately

    # Cannot sell
    if trade_risk.cannot_sell:
        points += 25
        reasons.append("⚠️ Token cannot be sold (sell restriction detected).")

    # Cannot buy
    if trade_risk.cannot_buy:
        points += 10
        reasons.append("Token cannot be bought (buy restriction detected).")

    # Sell tax
    if trade_risk.sell_tax_pct is not None:
        if trade_risk.sell_tax_pct > 50:
            points += 20
            reasons.append(f"Extremely high sell tax: {trade_risk.sell_tax_pct}%.")
        elif trade_risk.sell_tax_pct > 20:
            points += 12
            reasons.append(f"High sell tax: {trade_risk.sell_tax_pct}%.")
        elif trade_risk.sell_tax_pct > 10:
            points += 6
            reasons.append(f"Moderate sell tax: {trade_risk.sell_tax_pct}%.")
        elif trade_risk.sell_tax_pct > 5:
            points += 3

    # Buy tax
    if trade_risk.buy_tax_pct is not None:
        if trade_risk.buy_tax_pct > 20:
            points += 8
            reasons.append(f"High buy tax: {trade_risk.buy_tax_pct}%.")
        elif trade_risk.buy_tax_pct > 10:
            points += 5
            reasons.append(f"Moderate buy tax: {trade_risk.buy_tax_pct}%.")

    return min(30, points)
```

### Score Summary Table

| Category | Max Points | Key Thresholds |
|----------|-----------|----------------|
| Holder Concentration | 30 | Top5 > 70% → 20pts, Top1 > 20% → 10pts |
| Liquidity Depth | 20 | < $5k → 20pts, < $20k → 15pts, < $50k → 10pts |
| Token Age | 10 | < 3 days → 10pts, < 7 days → 8pts |
| Verification | 10 | Not verified → 10pts |
| Admin Control | 20 | Mint → 6pts, proxy → 5pts, hidden owner → 6pts |
| Honeypot/Tax | 30 | Honeypot → 30pts, can't sell → 25pts |
| **TOTAL** | **120** | **Clamped to 0–100** |

### Labels
| Score Range | Label | Color (for UI) |
|------------|-------|----------------|
| 0–33 | LOW | Green (#22c55e) |
| 34–66 | MEDIUM | Yellow/Orange (#eab308) |
| 67–100 | HIGH | Red (#ef4444) |

---

## 8. Data Models & Schemas

### `models.py` — Complete Pydantic Models

```python
"""
Pydantic models for request/response validation.
These define the exact shape of all API inputs and outputs.
"""
from pydantic import BaseModel, Field
from typing import Optional, List


# ─── REQUEST ───

class AnalyzeRequest(BaseModel):
    """POST /api/analyze request body."""
    chain: str = Field(
        default="ethereum",
        description="Chain identifier: ethereum, base, arbitrum, polygon, bsc"
    )
    token_address: str = Field(
        ...,
        description="Token contract address (0x...)",
        min_length=42,
        max_length=42,
    )


# ─── RESPONSE SUB-MODELS ───

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
    pair_created_at: Optional[int] = None  # unix ms


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
    label: str  # "LOW", "MEDIUM", "HIGH"
    reasons: List[str] = Field(default_factory=list)


class LinksInfo(BaseModel):
    dexscreener: str = ""
    explorer: str = ""


# ─── MAIN RESPONSE ───

class AnalyzeResponse(BaseModel):
    """Complete analysis response returned by POST /api/analyze."""
    token: TokenInfo
    market: Optional[MarketInfo] = None
    holders: Optional[HoldersInfo] = None
    admin: AdminInfo
    trade_risk: Optional[TradeRiskInfo] = None
    score: ScoreInfo
    links: LinksInfo
```

### TypeScript Types (Frontend)

These go in `frontend/src/lib/types.ts` and must exactly mirror the Pydantic models above:

```typescript
// frontend/src/lib/types.ts

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

export const CHAINS: { id: Chain; name: string; icon: string }[] = [
  { id: "ethereum", name: "Ethereum", icon: "Ξ" },
  { id: "base", name: "Base", icon: "🔵" },
  { id: "arbitrum", name: "Arbitrum", icon: "🔷" },
  { id: "polygon", name: "Polygon", icon: "🟣" },
  { id: "bsc", name: "BSC", icon: "🟡" },
];
```

---

## 9. Frontend — Next.js

### 9.1 Design System

**Color Palette:**
- Background: `#0a0a0f` (near-black) 
- Card background: `#12121a` 
- Card border: `#1e1e2e`
- Primary text: `#f0f0f5`
- Secondary text: `#8888a0`
- Risk LOW: `#22c55e` (green)
- Risk MEDIUM: `#eab308` (yellow)
- Risk HIGH: `#ef4444` (red)
- Accent: `#6366f1` (indigo, for buttons/links)

**Typography:**
- Font: Inter (via `next/font/google`)
- Headings: Bold, tracking tight
- Body: Regular weight

**Layout:**
- Max width: 720px centered
- Single column, card-based layout
- Mobile-first responsive

### 9.2 Key Components

#### `SearchForm.tsx`
- Chain dropdown (styled select with chain icons)
- Address text input with placeholder "Paste token contract address (0x...)"
- "Analyze" button with loading state
- Input validation: must start with 0x, must be 42 chars
- On submit: calls `POST /api/analyze`

#### `ScoreGauge.tsx`
- Semicircular gauge (SVG-based) showing 0–100
- Color transitions from green → yellow → red based on score
- Large number in center
- Animated fill on load (CSS transition or requestAnimationFrame)
- Label badge below: "LOW RISK" / "MEDIUM RISK" / "HIGH RISK"

Implementation approach: Use an SVG arc path. The arc fill percentage = score/100. Use `stroke-dasharray` and `stroke-dashoffset` for animation.

```tsx
// Core gauge SVG structure
<svg viewBox="0 0 200 120" className="w-full max-w-xs mx-auto">
  {/* Background arc */}
  <path d="M 20 100 A 80 80 0 0 1 180 100" 
        fill="none" stroke="#1e1e2e" strokeWidth="12" strokeLinecap="round" />
  {/* Filled arc - animated */}
  <path d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={arcLength}
        strokeDashoffset={arcLength * (1 - score/100)}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
  {/* Score text */}
  <text x="100" y="85" textAnchor="middle" className="text-4xl font-bold" fill="white">
    {score}
  </text>
</svg>
```

#### `ReasonsList.tsx`
- Renders `score.reasons` as styled bullet points
- Each reason gets an icon: ⚠️ for warnings, 🔴 for critical
- Truncate to top 5 reasons, with "Show more" toggle

#### `DetailCard.tsx`
- Collapsible card with header icon, title, and expand/collapse chevron
- Content area with key-value pairs
- Used by LiquidityCard, HoldersCard, OwnershipCard, TradeRiskCard

#### `LiquidityCard.tsx`
Shows: DEX name, pair, liquidity USD, 24h volume, price, price change %, FDV, pair age.

#### `HoldersCard.tsx`
Shows: Top 1%, Top 5%, Top 10% as horizontal bar charts. Holder count. Data source.

#### `OwnershipCard.tsx`
Shows: Has owner (yes/no), Owner renounced (yes/no), owner address (truncated + link), Proxy detected, list of all admin flags as colored badges.

#### `TradeRiskCard.tsx`
Shows: Honeypot status (big red warning if true), Buy tax %, Sell tax %, Can sell (yes/no), Can buy (yes/no).

#### `TokenHeader.tsx`
Shows: Token name + symbol, contract address (truncated with copy button), chain badge, verified badge, external links to explorer and DexScreener.

#### `LoadingSkeleton.tsx`
- Animated pulse skeleton matching the layout of results
- Shows progress text: cycles through "Fetching DEX data...", "Analyzing contract security...", "Computing risk score..."

#### `ErrorDisplay.tsx`
- Error card with red accent
- Shows error message
- "Try Again" button

### 9.3 `page.tsx` — Main Page Layout

```
┌─────────────────────────────────────────┐
│           🛡️ RugCheck                    │
│  Paste a token address. Get the truth.  │
│                                          │
│  [Chain ▼] [0x... address input] [Go]   │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │      Score Gauge (0-100)        │    │
│  │         HIGH RISK               │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ Token: SCAM (SCAM)              │    │
│  │ 0x1234...5678  ✅ Verified      │    │
│  │ [Etherscan] [DexScreener]       │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ Why this score:                  │    │
│  │ • Top 5 holders control 82%     │    │
│  │ • Liquidity extremely low ($3k) │    │
│  │ • Contract not verified         │    │
│  │ • Honeypot detected             │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ▸ Liquidity & Market              [▼]  │
│  ▸ Holder Concentration            [▼]  │
│  ▸ Ownership & Admin Control       [▼]  │
│  ▸ Trade Risk (Honeypot/Tax)       [▼]  │
│                                          │
│  ─────────────────────────────────────  │
│  Powered by DexScreener, Etherscan,     │
│  GoPlus Security                        │
└─────────────────────────────────────────┘
```

### 9.4 `lib/api.ts` — Backend Client

```typescript
// frontend/src/lib/api.ts

import { AnalyzeRequest, AnalyzeResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function analyzeToken(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}
```

### 9.5 `hooks/useAnalysis.ts` — State Management Hook

```typescript
// frontend/src/hooks/useAnalysis.ts

import { useState, useCallback } from 'react';
import { AnalyzeResponse, Chain } from '@/lib/types';
import { analyzeToken } from '@/lib/api';

interface AnalysisState {
  data: AnalyzeResponse | null;
  loading: boolean;
  error: string | null;
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    data: null,
    loading: false,
    error: null,
  });

  const analyze = useCallback(async (chain: Chain, tokenAddress: string) => {
    setState({ data: null, loading: true, error: null });

    try {
      const result = await analyzeToken({ chain, token_address: tokenAddress });
      setState({ data: result, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Analysis failed',
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, analyze, reset };
}
```

### 9.6 `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

### 9.7 `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0f",
          card: "#12121a",
          hover: "#1a1a2a",
        },
        border: {
          card: "#1e1e2e",
        },
        text: {
          primary: "#f0f0f5",
          secondary: "#8888a0",
        },
        risk: {
          low: "#22c55e",
          medium: "#eab308",
          high: "#ef4444",
        },
        accent: "#6366f1",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 10. Environment Variables & Configuration

### Backend `.env.example`

```env
# Required: Get free key at https://etherscan.io/myapikey
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: GoPlus API key (free tier works without)
# Get at https://gopluslabs.io/security-api
GOPLUS_API_KEY=
GOPLUS_API_SECRET=

# Server config
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:3000

# Cache TTL in seconds (default 600 = 10 minutes)
CACHE_TTL_SECONDS=600
```

### Frontend `.env.local.example`

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Getting API Keys

1. **Etherscan (required)**:
   - Go to https://etherscan.io/register
   - Create account → go to https://etherscan.io/myapikey
   - Click "Add" → copy the API key
   - Free tier: 5 calls/second, works with V2 for all chains

2. **GoPlus (optional)**:
   - The API works without a key for basic queries
   - For higher rate limits: contact https://gopluslabs.io/security-api
   - If you have credentials, set both `GOPLUS_API_KEY` and `GOPLUS_API_SECRET`

3. **DexScreener**: No key needed. Public API with 300 req/min rate limit.

---

## 11. Error Handling & Edge Cases

### Address Validation
- Must start with `0x`
- Must be exactly 42 characters (0x + 40 hex chars)
- Validate hex chars: `/^0x[0-9a-fA-F]{40}$/`

### Unsupported Chain
- Return 400 with message listing supported chains

### Token Not Found on DEX
- DexScreener returns empty array → `market` will be `null`
- Score still computes from other signals
- UI shows "No DEX data found" in market card

### Token Not Found on GoPlus
- GoPlus returns empty result → `holders` and `trade_risk` will be `null`
- Score penalizes less (fewer signals = lower confidence)
- UI shows "Security data unavailable" in relevant cards

### API Timeout
- httpx client timeout is 30 seconds
- Each API call is independently wrapped in try/except
- Failed calls return `None`, other APIs still contribute

### Rate Limiting
- Etherscan: 5 calls/sec free → our cache prevents hammering
- DexScreener: 300 calls/min → very generous
- GoPlus: ~100 calls/min free → cache prevents issues
- Backend cache (10 min TTL) means repeat queries are instant

### Network Errors
- Backend returns 500 with error detail
- Frontend shows ErrorDisplay component with retry button

---

## 12. Caching Strategy

- **Storage**: In-memory `TTLCache` (cachetools library)
- **Key**: `"{chain}:{token_address_lowercase}"`
- **TTL**: 600 seconds (10 minutes)
- **Max entries**: 500
- **Cache hit behavior**: Return cached `AnalyzeResponse` directly, skip all API calls
- **Invalidation**: Automatic TTL expiry only. No manual invalidation needed for MVP.

Cache is intentionally simple — no Redis, no persistence. This is a hackathon MVP. The cache prevents:
1. Hammering external APIs during demos
2. Duplicate analysis for the same token within 10 min

---

## 13. Deployment

### Local Development (recommended for hackathon)
Both backend and frontend run locally. This is the simplest and most reliable for demos.

### Production Deployment (optional)

**Backend → Render or Fly.io**
```yaml
# render.yaml
services:
  - type: web
    name: rugcheck-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: ETHERSCAN_API_KEY
        sync: false
```

**Frontend → Vercel**
```bash
cd frontend
npx vercel --prod
# Set NEXT_PUBLIC_API_URL to your Render/Fly backend URL
```

---

## 14. Build & Run Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd rugcheck

# ─── Backend ───
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill in env vars
cp .env.example .env
# Edit .env → add your ETHERSCAN_API_KEY

# Start backend
uvicorn main:app --reload --port 8000

# ─── Frontend (new terminal) ───
cd frontend
npm install

# Copy and fill in env vars
cp .env.local.example .env.local

# Start frontend
npm run dev
# Opens at http://localhost:3000
```

### Quick Test

```bash
# Test the backend directly
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"chain": "ethereum", "token_address": "0xdac17f958d2ee523a2206206994597c13d831ec7"}'

# This analyzes USDT on Ethereum — should return low risk
```

### Known Good Test Addresses

| Token | Chain | Address | Expected Risk |
|-------|-------|---------|--------------|
| USDT | Ethereum | `0xdac17f958d2ee523a2206206994597c13d831ec7` | LOW |
| USDC | Ethereum | `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` | LOW |
| SHIB | Ethereum | `0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce` | LOW-MED |
| PEPE | Ethereum | `0x6982508145454ce325ddbe47a25d4ec3d2311933` | LOW |

---

## 15. Testing

### Backend Unit Tests

Create `backend/test_scoring.py`:

```python
"""Test the scoring engine with known inputs."""
from scoring import compute_risk_score
from models import TokenInfo, MarketInfo, HoldersInfo, AdminInfo, TradeRiskInfo

def test_low_risk_token():
    """A well-known, verified, liquid token should score LOW."""
    token = TokenInfo(address="0x...", name="USDT", symbol="USDT", verified=True, age_days=2000)
    market = MarketInfo(liquidity_usd=50_000_000, volume_24h_usd=1_000_000)
    holders = HoldersInfo(top1_pct=5, top5_pct=15, top10_pct=25, holder_count="500000")
    admin = AdminInfo(has_owner=False, owner_renounced=True, flags=[])
    trade_risk = TradeRiskInfo(honeypot=False, sell_tax_pct=0, buy_tax_pct=0)

    score = compute_risk_score(token, market, holders, admin, trade_risk)
    assert score.risk_score < 34
    assert score.label == "LOW"

def test_honeypot_scores_high():
    """A honeypot token must always score HIGH."""
    token = TokenInfo(address="0x...", name="SCAM", symbol="SCAM", verified=False, age_days=2)
    market = MarketInfo(liquidity_usd=5000)
    holders = HoldersInfo(top1_pct=80, top5_pct=95, top10_pct=99, holder_count="10")
    admin = AdminInfo(has_owner=True, owner_renounced=False, flags=["mint_function_detected"])
    trade_risk = TradeRiskInfo(honeypot=True, sell_tax_pct=100, buy_tax_pct=0, cannot_sell=True)

    score = compute_risk_score(token, market, holders, admin, trade_risk)
    assert score.risk_score >= 67
    assert score.label == "HIGH"
    assert any("HONEYPOT" in r for r in score.reasons)

def test_missing_data_doesnt_crash():
    """Analysis with minimal data should still produce a valid score."""
    token = TokenInfo(address="0x...", name="Unknown", symbol="???")
    admin = AdminInfo(flags=[])

    score = compute_risk_score(token, None, None, admin, None)
    assert 0 <= score.risk_score <= 100
    assert score.label in ("LOW", "MEDIUM", "HIGH")

if __name__ == "__main__":
    test_low_risk_token()
    test_honeypot_scores_high()
    test_missing_data_doesnt_crash()
    print("All tests passed!")
```

Run with:
```bash
cd backend
python test_scoring.py
# Or with pytest:
pip install pytest
pytest test_scoring.py -v
```

### Frontend Smoke Test

After both backend and frontend are running:
1. Navigate to `http://localhost:3000`
2. Select "Ethereum" chain
3. Paste USDT address: `0xdac17f958d2ee523a2206206994597c13d831ec7`
4. Click Analyze
5. Verify: Score gauge appears, LOW risk label, detail cards expand

---

## Appendix A: API Rate Limits Quick Reference

| API | Free Tier Limit | Auth Required | Notes |
|-----|----------------|---------------|-------|
| DexScreener | 300 req/min (pairs) | No | No key needed |
| DexScreener | 60 req/min (profiles/boosts) | No | Not used in MVP |
| Etherscan V2 | 5 req/sec | Yes (API key) | Free key from etherscan.io |
| GoPlus | ~100 req/min | No (basic) | Key optional for higher limits |

## Appendix B: GoPlus Response Field Reference

Complete list of all GoPlus `token_security` response fields used in this project:

```
token_name, token_symbol, total_supply, holder_count,
holders[].address, holders[].percent, holders[].is_contract, holders[].is_locked,
is_open_source, is_proxy, is_mintable, is_honeypot,
is_blacklisted, is_whitelisted, is_in_dex, is_anti_whale,
selfdestruct, external_call, hidden_owner, can_take_back_ownership,
transfer_pausable, slippage_modifiable, personal_slippage_modifiable,
trading_cooldown, cannot_buy, cannot_sell_all,
buy_tax, sell_tax,
owner_address, creator_address, creator_percent, owner_percent
```

All boolean fields return `"1"` (true) or `"0"` (false) as **strings**.
Tax fields return decimal strings like `"0.05"` (meaning 5%).
Percent fields in holders return decimal strings like `"0.312"` (meaning 31.2%).

## Appendix C: DexScreener Chain ID Reference

For the `tokens/v1/{chainId}/{address}` endpoint:

| Chain | chainId value |
|-------|--------------|
| Ethereum | `ethereum` |
| BSC | `bsc` |
| Polygon | `polygon` |
| Arbitrum | `arbitrum` |
| Base | `base` |
| Optimism | `optimism` |
| Avalanche | `avalanche` |
| Fantom | `fantom` |
| Solana | `solana` |

## Appendix D: Etherscan V2 Chain IDs

For the `?chainid=` parameter:

| Chain | chainid |
|-------|---------|
| Ethereum | 1 |
| BSC | 56 |
| Polygon | 137 |
| Arbitrum | 42161 |
| Base | 8453 |
| Optimism | 10 |
| Avalanche | 43114 |
| Fantom | 250 |
