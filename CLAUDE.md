# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RugCheck is a token security analyzer — paste a blockchain token contract address and get a rug pull risk score (0-100) with explainable on-chain signals. Monorepo with Python FastAPI backend and Next.js frontend.

## Commands

### Backend
```bash
cd backend
./venv/Scripts/python -m uvicorn main:app --reload --port 8000  # Start dev server
./venv/Scripts/python test_scoring.py                            # Run scoring tests
./venv/Scripts/pip install -r requirements.txt                   # Install deps
```

### Frontend
```bash
cd frontend
npm run dev      # Start dev server on :3000
npm run build    # Production build
npm run lint     # Lint
```

### Quick API test
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"chain":"ethereum","token_address":"0xdac17f958d2ee523a2206206994597c13d831ec7"}'
```

## Architecture

**Backend** (`backend/`) — FastAPI, Python 3.11+
- `main.py` — App entry, CORS, routes (`POST /api/analyze`, `GET /api/health`, `GET /api/report/{chain}/{addr}`)
- `analyzer.py` — Orchestrator: calls 3 APIs in parallel via `asyncio.gather`, merges results, runs scoring
- `scoring.py` — Pure-function risk engine. 6 categories (holders 0-30, liquidity 0-20, age 0-10, verification 0-10, admin 0-20, honeypot/tax 0-30), clamped to 0-100
- `models.py` — Pydantic request/response schemas (`AnalyzeRequest`, `AnalyzeResponse` with nested `TokenInfo`, `MarketInfo`, `HoldersInfo`, `AdminInfo`, `TradeRiskInfo`, `ScoreInfo`, `LinksInfo`)
- `config.py` — Settings from `.env`, chain ID mappings for 5 chains
- `cache.py` — TTLCache (10min, 500 entries)
- `services/dexscreener.py` — No auth, selects highest-liquidity pair
- `services/etherscan.py` — V2 API (single key for all chains), contract verification + source code heuristics
- `services/goplus.py` — Token security signals (honeypot, holders, taxes, admin flags)

**Frontend** (`frontend/`) — Next.js 14 App Router, TypeScript, Tailwind CSS
- `src/app/page.tsx` — Main page, composes all components
- `src/hooks/useAnalysis.ts` — State management for analysis requests
- `src/lib/api.ts` — Backend fetch wrapper
- `src/lib/types.ts` — TypeScript types mirroring backend Pydantic models
- `src/components/` — SearchForm, ScoreGauge (animated SVG arc), TokenHeader, ReasonsList, DetailCard (collapsible), LiquidityCard, HoldersCard, OwnershipCard, TradeRiskCard, LoadingSkeleton, ErrorDisplay

**Data flow**: Frontend POST → Backend validates → parallel fetch (DexScreener + Etherscan + GoPlus) → merge → score → cache → return JSON → Frontend renders

## Key Patterns

- GoPlus returns booleans as `"1"`/`"0"` strings, taxes as decimal strings (e.g., `"0.05"` = 5%)
- Backend gracefully degrades: failed API calls return `None`, scoring still works with partial data
- Frontend types in `types.ts` must exactly mirror backend `models.py` Pydantic schemas
- Chain configs in `config.py` map chain names to chain IDs for each API (DexScreener, Etherscan, GoPlus use different ID formats)
- Scoring labels: LOW (0-33), MEDIUM (34-66), HIGH (67-100)
