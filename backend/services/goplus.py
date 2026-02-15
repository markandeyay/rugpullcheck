"""
GoPlus Security API client.
Fetches comprehensive token security analysis including honeypot detection,
holder analysis, ownership flags, and tax information.
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
    url = f"{GOPLUS_BASE}/token_security/{chain_id}"
    params = {"contract_addresses": token_address}

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

        token_data = result.get(token_address.lower())
        if not token_data:
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
