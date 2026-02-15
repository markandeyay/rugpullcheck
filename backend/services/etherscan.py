"""
Etherscan V2 API client.
Fetches contract verification status, source code, and token holder data.
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
    if not settings.etherscan_api_key:
        return None

    source_data = await _get_source_code(client, chain_id, token_address)
    return source_data


async def _get_source_code(
    client: httpx.AsyncClient,
    chain_id: int,
    address: str,
) -> Optional[dict]:
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
