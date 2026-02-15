"""
Application settings loaded from environment variables.
Chain configuration mapping.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    etherscan_api_key: str = ""
    goplus_api_key: Optional[str] = None
    goplus_api_secret: Optional[str] = None
    backend_port: int = 8000
    frontend_url: str = "http://localhost:3000"
    cache_ttl_seconds: int = 600

    class Config:
        env_file = ".env"


settings = Settings()

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
    if chain not in CHAIN_CONFIG:
        raise ValueError(f"Unsupported chain: {chain}. Supported: {list(CHAIN_CONFIG.keys())}")
    return CHAIN_CONFIG[chain]
