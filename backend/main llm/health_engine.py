"""
Financial health scores from uploaded PDF metrics.
"""

from __future__ import annotations

import os
from typing import Any

from bankruptcy_engine.altman_score import calculate_altman_z, classify_altman
from metric_extractor import build_extractor

UPLOAD_DIR = "data/uploaded_pdfs"
_extractor = build_extractor()


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _latest_pdf_path() -> str | None:
    if not os.path.isdir(UPLOAD_DIR):
        return None
    pdfs = [
        n
        for n in os.listdir(UPLOAD_DIR)
        if n.lower().endswith(".pdf") and os.path.isfile(os.path.join(UPLOAD_DIR, n))
    ]
    if not pdfs:
        return None
    pdfs.sort(key=lambda n: os.path.getmtime(os.path.join(UPLOAD_DIR, n)), reverse=True)
    return os.path.join(UPLOAD_DIR, pdfs[0])


def _read_pdf_text(path: str) -> str:
    try:
        from pdf_text_extract import extract_pdf_text

        return extract_pdf_text(path)
    except Exception:
        return ""


def _metric_coverage_score(metrics: dict[str, float]) -> int:
    keys = [
        "working_capital",
        "retained_earnings",
        "ebit",
        "revenue",
        "total_assets",
        "total_liabilities",
        "shareholder_equity",
    ]
    found = sum(1 for k in keys if metrics.get(k, 0) != 0)
    return int(_clamp((found / len(keys)) * 100))


def analyze_health(pdf_path: str | None = None) -> dict[str, Any]:
    path = pdf_path or _latest_pdf_path()
    if not path or not os.path.isfile(path):
        return {
            "red_flags": 0,
            "green_flags": 0,
            "balance_sheet_health": 0,
            "audit_health": 0,
            "cashflow_health": 0,
            "debt_risk": 0,
            "summary": ["Upload a financial statement PDF to generate health insights."],
            "company_name": None,
        }

    text = _read_pdf_text(path)
    metrics = _extractor.extract_as_dict(text)
    company_name = os.path.basename(path).replace(".pdf", "").replace("_", " ")

    total_assets = metrics.get("total_assets", 0) or 1.0
    total_liabilities = metrics.get("total_liabilities", 0)
    equity = metrics.get("shareholder_equity", 0)
    revenue = metrics.get("revenue", 0)
    wc = metrics.get("working_capital", 0)
    ebit = metrics.get("ebit", 0)

    current_ratio_proxy = (wc + equity) / max(total_liabilities * 0.35, 1.0)
    leverage = total_liabilities / max(total_assets, 1.0)
    margin = ebit / max(revenue, 1.0) if revenue else 0.0

    balance_sheet_health = int(
        _clamp(50 + (current_ratio_proxy - 1) * 25 + (equity / total_assets) * 30)
    )
    cashflow_health = int(_clamp(55 + margin * 120 + (wc / total_assets) * 40))
    debt_risk = int(_clamp(leverage * 100))
    audit_health = _metric_coverage_score(metrics)

    z = calculate_altman_z(
        working_capital=wc,
        retained_earnings=metrics.get("retained_earnings", 0),
        ebit=ebit,
        market_value_equity=equity,
        total_liabilities=total_liabilities,
        sales=revenue,
        total_assets=total_assets,
    )
    zone = classify_altman(z)

    red_flags = 0
    green_flags = 0
    summary: list[str] = []

    if leverage > 0.65:
        red_flags += 1
        summary.append("Debt increased sharply relative to assets")
    else:
        green_flags += 1
        summary.append("Leverage remains within manageable range")

    if wc < 0:
        red_flags += 1
        summary.append("Negative working capital detected")
    else:
        green_flags += 1
        summary.append("Positive working capital supports liquidity")

    if margin < 0.05 and revenue > 0:
        red_flags += 1
        summary.append("Operating margins are under pressure")
    elif margin >= 0.1:
        green_flags += 1
        summary.append("Strong operating margins")
    else:
        summary.append("Margins are stable but not expanding")

    if "DISTRESS" in zone:
        red_flags += 2
        summary.append("Altman Z-Score indicates distress risk")
    elif zone == "SAFE":
        green_flags += 2
        summary.append("Company financially stable (Altman safe zone)")
    else:
        red_flags += 1
        green_flags += 1
        summary.append("Altman Z-Score in grey zone — monitor closely")

    if cashflow_health >= 70:
        green_flags += 1
        summary.append("Cash flow signals remain stable")
    else:
        red_flags += 1
        summary.append("Cash flow health needs attention")

    if audit_health < 50:
        red_flags += 1
        summary.append("Limited audit-grade data extracted from filing")
    else:
        green_flags += 1
        summary.append("Sufficient statement coverage for analysis")

    red_flags = max(red_flags, 3 if leverage > 0.5 else 1)
    green_flags = max(green_flags, 4 if zone == "SAFE" else 2)

    return {
        "red_flags": red_flags,
        "green_flags": green_flags,
        "balance_sheet_health": balance_sheet_health,
        "audit_health": audit_health,
        "cashflow_health": cashflow_health,
        "debt_risk": debt_risk,
        "summary": summary[:6],
        "company_name": company_name,
        "altman_z": round(z, 2),
        "altman_zone": zone,
    }
