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
    url = f"{DEXSCREENER_BASE}/tokens/v1/{chain_id}/{token_address}"

    response = await client.get(url)
    response.raise_for_status()

    pairs = response.json()

    if not pairs or not isinstance(pairs, list) or len(pairs) == 0:
        return None

    best_pair = max(
        pairs,
        key=lambda p: (p.get("liquidity") or {}).get("usd") or 0,
    )

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
