"""Test the scoring engine with known inputs."""
from scoring import compute_risk_score
from models import TokenInfo, MarketInfo, HoldersInfo, AdminInfo, TradeRiskInfo


def test_low_risk_token():
    token = TokenInfo(address="0x" + "a" * 40, name="USDT", symbol="USDT", verified=True, age_days=2000)
    market = MarketInfo(liquidity_usd=50_000_000, volume_24h_usd=1_000_000)
    holders = HoldersInfo(top1_pct=5, top5_pct=15, top10_pct=25, holder_count="500000")
    admin = AdminInfo(has_owner=False, owner_renounced=True, flags=[])
    trade_risk = TradeRiskInfo(honeypot=False, sell_tax_pct=0, buy_tax_pct=0)

    score = compute_risk_score(token, market, holders, admin, trade_risk)
    assert score.risk_score < 34, f"Expected LOW, got {score.risk_score}"
    assert score.label == "LOW"


def test_honeypot_scores_high():
    token = TokenInfo(address="0x" + "b" * 40, name="SCAM", symbol="SCAM", verified=False, age_days=2)
    market = MarketInfo(liquidity_usd=5000)
    holders = HoldersInfo(top1_pct=80, top5_pct=95, top10_pct=99, holder_count="10")
    admin = AdminInfo(has_owner=True, owner_renounced=False, flags=["mint_function_detected"])
    trade_risk = TradeRiskInfo(honeypot=True, sell_tax_pct=100, buy_tax_pct=0, cannot_sell=True)

    score = compute_risk_score(token, market, holders, admin, trade_risk)
    assert score.risk_score >= 67, f"Expected HIGH, got {score.risk_score}"
    assert score.label == "HIGH"
    assert any("HONEYPOT" in r for r in score.reasons)


def test_missing_data_doesnt_crash():
    token = TokenInfo(address="0x" + "c" * 40, name="Unknown", symbol="???")
    admin = AdminInfo(flags=[])

    score = compute_risk_score(token, None, None, admin, None)
    assert 0 <= score.risk_score <= 100
    assert score.label in ("LOW", "MEDIUM", "HIGH")


if __name__ == "__main__":
    test_low_risk_token()
    test_honeypot_scores_high()
    test_missing_data_doesnt_crash()
    print("All tests passed!")
