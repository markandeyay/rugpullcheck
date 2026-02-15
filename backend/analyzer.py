"""
Main analysis pipeline orchestrator.
Calls all three external API services in parallel, then computes the risk score.
"""
import asyncio
import httpx
from typing import Optional

from config import get_chain_config
from models import (
    AnalyzeResponse, TokenInfo, MarketInfo, HoldersInfo,
    AdminInfo, TradeRiskInfo, ScoreInfo, LinksInfo,
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
    chain_config = get_chain_config(chain)
    address = token_address.lower().strip()

    if not address.startswith("0x") or len(address) != 42:
        raise ValueError("Invalid token address format. Must be 0x followed by 40 hex characters.")

    dex_task = fetch_dexscreener_data(http_client, chain_config["dexscreener_id"], address)
    etherscan_task = fetch_etherscan_data(http_client, chain_config["chain_id"], address)
    goplus_task = fetch_goplus_data(http_client, chain_config["goplus_chain_id"], address)

    dex_data, etherscan_data, goplus_data = await asyncio.gather(
        dex_task, etherscan_task, goplus_task,
        return_exceptions=True,
    )

    if isinstance(dex_data, Exception):
        print(f"DexScreener error: {dex_data}")
        dex_data = None
    if isinstance(etherscan_data, Exception):
        print(f"Etherscan error: {etherscan_data}")
        etherscan_data = None
    if isinstance(goplus_data, Exception):
        print(f"GoPlus error: {goplus_data}")
        goplus_data = None

    token_info = _build_token_info(address, dex_data, etherscan_data, goplus_data)
    market_info = _build_market_info(dex_data, chain_config)
    holders_info = _build_holders_info(goplus_data)
    admin_info = _build_admin_info(etherscan_data, goplus_data)
    trade_risk_info = _build_trade_risk_info(goplus_data)

    score_info = compute_risk_score(
        token=token_info,
        market=market_info,
        holders=holders_info,
        admin=admin_info,
        trade_risk=trade_risk_info,
    )

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
    name = "Unknown"
    symbol = "???"
    decimals = 18
    total_supply = None
    age_days = None
    verified = None

    if dex_data:
        name = dex_data.get("name", name)
        symbol = dex_data.get("symbol", symbol)
        age_days = dex_data.get("pair_age_days")

    if goplus_data:
        if goplus_data.get("token_name"):
            name = goplus_data["token_name"]
        if goplus_data.get("token_symbol"):
            symbol = goplus_data["token_symbol"]
        if goplus_data.get("total_supply"):
            total_supply = goplus_data["total_supply"]

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
    if not goplus_data or not goplus_data.get("holders"):
        return None

    holders = goplus_data["holders"]
    holder_count = goplus_data.get("holder_count")

    top1_pct = 0.0
    top5_pct = 0.0
    top10_pct = 0.0

    for i, h in enumerate(holders[:10]):
        pct = float(h.get("percent", 0)) * 100
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
    has_owner = None
    owner_renounced = None
    owner_address = None
    upgradeable_proxy = None
    flags = []

    if goplus_data:
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

    if etherscan_data and etherscan_data.get("source_code"):
        source = etherscan_data["source_code"].lower()
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
    if val is None or val == "":
        return None
    try:
        return round(float(val) * 100, 2)
    except (ValueError, TypeError):
        return None
