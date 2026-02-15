"""
Risk Scoring Engine.
Computes a 0-100 risk score from analysis signals.
Pure functions only.

Scoring Categories:
  - Holder Concentration: 0-30 points
  - Liquidity Depth: 0-20 points
  - Token Age: 0-10 points
  - Verification Status: 0-10 points
  - Admin/Owner Control: 0-20 points
  - Honeypot/Tax Risk: 0-30 points

Total possible: 120, clamped to 0-100.
"""
from typing import Optional
from models import (
    TokenInfo, MarketInfo, HoldersInfo, AdminInfo,
    TradeRiskInfo, ScoreInfo,
)


def compute_risk_score(
    token: TokenInfo,
    market: Optional[MarketInfo],
    holders: Optional[HoldersInfo],
    admin: AdminInfo,
    trade_risk: Optional[TradeRiskInfo],
) -> ScoreInfo:
    score = 0
    reasons = []

    score += _score_holders(holders, reasons)
    score += _score_liquidity(market, reasons)
    score += _score_age(token, market, reasons)
    score += _score_verification(token, reasons)
    score += _score_admin(admin, reasons)
    score += _score_trade_risk(trade_risk, reasons)

    final_score = max(0, min(100, score))

    if final_score >= 67:
        label = "HIGH"
    elif final_score >= 34:
        label = "MEDIUM"
    else:
        label = "LOW"

    if not market and not holders and not trade_risk:
        reasons.append("Limited data available — score may not reflect true risk.")

    return ScoreInfo(
        risk_score=final_score,
        label=label,
        reasons=reasons,
    )


def _score_holders(holders: Optional[HoldersInfo], reasons: list) -> int:
    if not holders:
        return 0

    points = 0

    if holders.top1_pct and holders.top1_pct > 20:
        points += 10
        reasons.append(f"Top holder controls {holders.top1_pct}% of supply.")
    elif holders.top1_pct and holders.top1_pct > 10:
        points += 5

    if holders.top5_pct and holders.top5_pct > 70:
        points += 20
        reasons.append(f"Top 5 holders control {holders.top5_pct}% of supply — extreme concentration.")
    elif holders.top5_pct and holders.top5_pct > 50:
        points += 12
        reasons.append(f"Top 5 holders control {holders.top5_pct}% of supply — high concentration.")
    elif holders.top5_pct and holders.top5_pct > 30:
        points += 5

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
    if not market or market.liquidity_usd is None:
        reasons.append("No DEX liquidity data found.")
        return 10

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

    return min(20, points)


def _score_age(token: TokenInfo, market: Optional[MarketInfo], reasons: list) -> int:
    age = token.age_days

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
    if token.verified is None:
        return 3

    if not token.verified:
        reasons.append("Contract source code is not verified.")
        return 10

    return 0


def _score_admin(admin: AdminInfo, reasons: list) -> int:
    points = 0

    if admin.has_owner and not admin.owner_renounced:
        points += 6
        reasons.append("Contract has an active owner (not renounced).")

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
    if not trade_risk:
        return 0

    points = 0

    if trade_risk.honeypot:
        points += 30
        reasons.append("HONEYPOT DETECTED — you likely cannot sell this token.")
        return 30

    if trade_risk.cannot_sell:
        points += 25
        reasons.append("Token cannot be sold (sell restriction detected).")

    if trade_risk.cannot_buy:
        points += 10
        reasons.append("Token cannot be bought (buy restriction detected).")

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

    if trade_risk.buy_tax_pct is not None:
        if trade_risk.buy_tax_pct > 20:
            points += 8
            reasons.append(f"High buy tax: {trade_risk.buy_tax_pct}%.")
        elif trade_risk.buy_tax_pct > 10:
            points += 5
            reasons.append(f"Moderate buy tax: {trade_risk.buy_tax_pct}%.")

    return min(30, points)
