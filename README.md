# RugCheck

Token security analyzer that scores rug pull risk (0-100) using on-chain signals.

Paste a token contract address, select a chain, and get an instant risk score with explainable signals covering holder concentration, liquidity, ownership, mintability, and honeypot indicators.

## Supported Chains

Ethereum, Base, Arbitrum, Polygon, BSC

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your ETHERSCAN_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000

## API Keys

- **Etherscan** (required): Free key at https://etherscan.io/myapikey
- **GoPlus** (optional): Works without key for basic queries
- **DexScreener**: No key needed

## Test Addresses

| Token | Chain | Address | Expected |
|-------|-------|---------|----------|
| USDT | Ethereum | `0xdac17f958d2ee523a2206206994597c13d831ec7` | LOW |
| USDC | Ethereum | `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` | LOW |
