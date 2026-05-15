"""
FinSight — 10 Structured Financial Insights Engine
====================================================
Usage : python finsight_insights.py
Input : Two-year financial data entered via terminal
Output: Exactly 10 structured insight sections, printed clean to terminal
"""

# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

def safe_div(n: float, d: float, fallback: float = 0.0) -> float:
    return n / d if d != 0 else fallback

def pct(value: float) -> str:
    return f"{value:.1f}%"

def growth(cur: float, prev: float) -> float:
    return safe_div(cur - prev, abs(prev)) * 100

def fmt(n: float) -> str:
    return f"{n:,.0f}"

def sign(n: float) -> str:
    return "+" if n >= 0 else ""

def divider(char: str = "─", width: int = 62) -> str:
    return char * width

# ──────────────────────────────────────────────
# INPUT
# ──────────────────────────────────────────────

def get_pair(label: str) -> tuple[float, float]:
    """Prompt for two space-separated floats. Retries on bad input."""
    while True:
        try:
            raw = input(f"  {label} (current prev): ").strip().split()
            if len(raw) != 2:
                print("    ⚠  Enter exactly 2 numbers separated by a space.")
                continue
            return float(raw[0]), float(raw[1])
        except ValueError:
            print("    ⚠  Numbers only please.")

def collect() -> dict:
    print("\n" + divider("═"))
    print("  FinSight — Enter Financial Data (current year first)")
    print(divider("═"))
    return {
        "revenue":      get_pair("Revenue"),
        "net_profit":   get_pair("Net Profit"),
        "total_assets": get_pair("Total Assets"),
        "total_liab":   get_pair("Total Liabilities"),
        "cur_assets":   get_pair("Current Assets"),
        "cur_liab":     get_pair("Current Liabilities"),
    }

# ──────────────────────────────────────────────
# CALCULATIONS
# ──────────────────────────────────────────────

def calc(d: dict) -> dict:
    rc, rp   = d["revenue"]
    nc, np_  = d["net_profit"]
    tac, tap = d["total_assets"]
    tlc, tlp = d["total_liab"]
    cac, cap = d["cur_assets"]
    clc, clp = d["cur_liab"]

    return {
        "net_margin_c":  safe_div(nc, rc) * 100,
        "net_margin_p":  safe_div(np_, rp) * 100,
        "cur_ratio_c":   safe_div(cac, clc),
        "cur_ratio_p":   safe_div(cap, clp),
        "dta_c":         safe_div(tlc, tac),   # debt-to-asset current
        "dta_p":         safe_div(tlp, tap),
        "net_worth_c":   tac - tlc,
        "net_worth_p":   tap - tlp,
        "rev_growth":    growth(rc, rp),
        "profit_growth": growth(nc, np_),
        "asset_delta":   tac - tap,
        "liab_delta":    tlc - tlp,
        "worth_delta":   (tac - tlc) - (tap - tlp),
        "raw": d,
    }

# ──────────────────────────────────────────────
# SECTION GENERATORS  (one function per insight)
# ──────────────────────────────────────────────

def s1_health(r: dict) -> list[str]:
    cr   = r["cur_ratio_c"]
    dta  = r["dta_c"]
    pg   = r["profit_growth"]
    rg   = r["rev_growth"]

    if pg > rg and cr > 1.2 and dta < 0.70:
        verdict = "Good"
        reason  = (
            f"Profit grew {pct(pg)} — faster than revenue growth of {pct(rg)}. "
            f"Current ratio {cr:.2f} clears the 1.2 safety floor. "
            f"Debt-to-asset {pct(dta*100)} stays below the 70% risk threshold. "
            "All three conditions for 'Good' are met simultaneously."
        )
    elif dta > 0.80 or cr < 1.0:
        verdict = "Risky"
        reason  = (
            f"{'Debt-to-asset at ' + pct(dta*100) + ' exceeds 80% — most assets are debt-funded. ' if dta > 0.80 else ''}"
            f"{'Current ratio ' + str(round(cr,2)) + ' is below 1.0 — short-term liabilities exceed liquid assets.' if cr < 1.0 else ''}"
        ).strip()
    else:
        verdict = "Average"
        reason  = (
            f"Profit growth ({pct(pg)}) does not clearly outpace revenue growth ({pct(rg)}), "
            f"or one of the key ratios is borderline. "
            "The company is stable but lacks a strong efficiency signal."
        )

    return [
        f"  Verdict : {verdict}",
        f"  Reason  : {reason}",
    ]


def s2_bankruptcy(r: dict) -> list[str]:
    cr  = r["cur_ratio_c"]
    dta = r["dta_c"]
    nm  = r["net_margin_c"]

    if dta > 0.80 or cr < 1.0 or nm < 0:
        level  = "High"
        reason = (
            f"Debt-to-asset {pct(dta*100)}, current ratio {cr:.2f}, net margin {pct(nm)}. "
            "At least one critical threshold is breached — the company could struggle to service debt under stress."
        )
    elif dta > 0.60 or cr < 1.2:
        level  = "Medium"
        reason = (
            f"Debt-to-asset {pct(dta*100)} is elevated (above 60%) but not critical. "
            f"Current ratio {cr:.2f} is above 1.0 — bills can be paid — but headroom is thin. "
            "A revenue dip would tighten cash quickly."
        )
    else:
        level  = "Low"
        reason = (
            f"Debt-to-asset {pct(dta*100)} is within safe range. "
            f"Current ratio {cr:.2f} provides comfortable short-term cover. "
            "Positive net margin leaves a buffer before losses appear."
        )

    return [
        f"  Risk Level : {level}",
        f"  Reason     : {reason}",
    ]


def s3_flags(r: dict) -> list[str]:
    d    = r["raw"]
    rc, rp   = d["revenue"]
    nc, np_  = d["net_profit"]
    tac, tap = d["total_assets"]
    tlc, tlp = d["total_liab"]
    cr   = r["cur_ratio_c"]
    crp  = r["cur_ratio_p"]
    dta  = r["dta_c"]
    dtap = r["dta_p"]
    nm   = r["net_margin_c"]
    nmp  = r["net_margin_p"]
    rg   = r["rev_growth"]
    pg   = r["profit_growth"]
    nwc  = r["net_worth_c"]
    nwp  = r["net_worth_p"]

    def flag(green: bool, msg: str) -> str:
        return f"  {'🟢' if green else '🔴'}  {msg}"

    rules = [
        (rg > 0,
         f"Revenue grew {pct(rg)} — business is expanding, not contracting.",
         f"Revenue declined {pct(abs(rg))} — top-line is shrinking."),

        (pg > rg,
         f"Profit grew faster ({pct(pg)}) than revenue ({pct(rg)}) — margins are widening.",
         f"Profit growth ({pct(pg)}) lags revenue growth ({pct(rg)}) — margins are compressing."),

        (nm > nmp,
         f"Net margin improved from {pct(nmp)} → {pct(nm)} — company keeps more per ₹100 earned.",
         f"Net margin fell from {pct(nmp)} → {pct(nm)} — profitability is eroding."),

        (cr > 1.2,
         f"Current ratio {cr:.2f} — short-term obligations are well covered.",
         f"Current ratio {cr:.2f} — short-term bill coverage is tight or negative."),

        (cr > crp,
         f"Current ratio improved {crp:.2f} → {cr:.2f} — liquidity getting stronger.",
         f"Current ratio worsened {crp:.2f} → {cr:.2f} — liquidity is deteriorating."),

        (dta < 0.60,
         f"Debt-to-asset {pct(dta*100)} — below 60%, debt is at a manageable level.",
         f"Debt-to-asset {pct(dta*100)} — over 60% of assets are creditor-funded."),

        (nwc > nwp,
         f"Net worth grew from {fmt(nwp)} → {fmt(nwc)} — owner equity is being built.",
         f"Net worth fell from {fmt(nwp)} → {fmt(nwc)} — equity is being eroded."),

        (r["asset_delta"] > r["liab_delta"],
         f"Assets grew (+{fmt(r['asset_delta'])}) faster than liabilities (+{fmt(r['liab_delta'])}) — structure improving.",
         f"Liabilities growing faster than assets — leverage is increasing."),

        (nc > 0,
         f"Net profit is positive at {fmt(nc)} — company is not losing money.",
         f"Net loss of {fmt(abs(nc))} — company is burning cash."),

        (tlc <= tlp,
         f"Total liabilities stable or reduced ({fmt(tlp)} → {fmt(tlc)}) — debt discipline visible.",
         f"Liabilities rose from {fmt(tlp)} → {fmt(tlc)} — company is taking on more debt."),
    ]

    lines = []
    for is_green, good_msg, bad_msg in rules:
        lines.append(flag(is_green, good_msg if is_green else bad_msg))
    return lines


def s4_assets_liabilities(r: dict) -> list[str]:
    d    = r["raw"]
    tac, tap = d["total_assets"]
    tlc, tlp = d["total_liab"]
    ad   = r["asset_delta"]
    ld   = r["liab_delta"]
    wd   = r["worth_delta"]
    trend = "Positive" if wd > 0 else "Negative"

    return [
        f"  Assets     : {fmt(tap)} → {fmt(tac)}  ({sign(ad)}{fmt(ad)})",
        f"  Liabilities: {fmt(tlp)} → {fmt(tlc)}  ({sign(ld)}{fmt(ld)})",
        f"  Net worth  : {fmt(r['net_worth_p'])} → {fmt(r['net_worth_c'])}  ({sign(wd)}{fmt(wd)})",
        f"  Trend      : {trend} — "
        + ("Assets growing faster than liabilities; the ownership gap is widening in favor of equity holders."
           if wd > 0 else
           "Liabilities outpacing assets; creditor claims are eating into equity."),
    ]


def s5_eli5(r: dict) -> list[str]:
    d   = r["raw"]
    rc, _ = d["revenue"]
    nc, _ = d["net_profit"]
    rg  = r["rev_growth"]
    pg  = r["profit_growth"]
    cr  = r["cur_ratio_c"]
    dta = r["dta_c"]

    health = "good" if r["profit_growth"] > r["rev_growth"] and cr > 1.2 and dta < 0.70 else \
             "risky" if dta > 0.80 or cr < 1.0 else "okay"

    return [
        f"  Imagine this company is a small shop.",
        f"  This year it earned {fmt(rc)} — that's {sign(rg)}{pct(rg)} more than last year.",
        f"  Out of that, it kept {fmt(nc)} as profit ({sign(pg)}{pct(pg)} vs last year).",
        f"  For every ₹1 it needs to pay soon, it has ₹{cr:.2f} ready — "
        + ("comfortable." if cr > 1.2 else "a bit tight."),
        f"  About {pct(dta*100)} of everything it owns was bought using borrowed money — "
        + ("manageable." if dta < 0.60 else "quite a lot."),
        f"  Bottom line: the shop is doing {health}. "
        + {"good": "It is growing AND getting smarter about profit.",
           "okay": "Steady, but nothing exciting. Watch the debt.",
           "risky": "Debt is heavy or cash is tight — needs improvement."}.get(health, ""),
    ]


def s6_cfa(r: dict) -> list[str]:
    nm   = r["net_margin_c"]
    cr   = r["cur_ratio_c"]
    dta  = r["dta_c"]
    rg   = r["rev_growth"]
    pg   = r["profit_growth"]

    margin_note = (
        "Net margin expansion signals positive operating leverage — costs are scaling slower than revenue."
        if pg > rg else
        "Margin compression is present; a cost-structure review is warranted."
    )
    liq_note = (
        f"Current ratio of {cr:.2f} sits above the 1.2 benchmark, indicating adequate working capital."
        if cr >= 1.2 else
        f"Current ratio of {cr:.2f} falls below the 1.2 safety level — near-term liquidity warrants attention."
    )
    debt_note = (
        f"Debt-to-asset at {pct(dta*100)} is within acceptable bounds for most sectors."
        if dta < 0.60 else
        f"Debt-to-asset of {pct(dta*100)} is elevated. Interest coverage ratio and maturity profile should be stress-tested."
    )

    return [
        f"  {margin_note}",
        f"  {liq_note}",
        f"  {debt_note}",
        f"  Revenue growth of {pct(rg)} paired with profit growth of {pct(pg)} "
        + ("supports a constructive fundamental view." if pg > rg else "raises questions about scalability of the profit model."),
    ]


def s7_investment(r: dict) -> list[str]:
    cr  = r["cur_ratio_c"]
    dta = r["dta_c"]
    pg  = r["profit_growth"]
    rg  = r["rev_growth"]
    nm  = r["net_margin_c"]

    if pg > rg and cr > 1.2 and dta < 0.70 and nm > 0:
        decision = "Yes"
        why = (
            f"Profit is growing faster than revenue ({pct(pg)} vs {pct(rg)}), "
            f"liquidity is healthy (ratio {cr:.2f}), and net margin is positive at {pct(nm)}. "
            "The trend is improving across all key metrics — a reasonable entry point, pending cash flow verification."
        )
    elif dta > 0.80 or cr < 1.0 or nm < 0:
        decision = "No"
        why = (
            f"Debt-to-asset at {pct(dta*100)} or current ratio {cr:.2f} signal structural fragility. "
            "Risk of distress outweighs the growth story at this stage. "
            "Would revisit after at least one clean year of debt reduction."
        )
    else:
        decision = "Hold / Conditional"
        why = (
            "Company is stable but not compelling. "
            f"Debt load ({pct(dta*100)}) needs to come down before a strong conviction entry. "
            "Monitor next year's margin and leverage trends before committing capital."
        )

    return [
        f"  Would you invest? : {decision}",
        f"  Why               : {why}",
    ]


def s8_profitability(r: dict) -> list[str]:
    nm  = r["net_margin_c"]
    nmp = r["net_margin_p"]
    rg  = r["rev_growth"]
    pg  = r["profit_growth"]
    efficient = pg > rg and nm > nmp

    return [
        f"  Net margin     : {pct(nmp)} → {pct(nm)}  ({sign(nm-nmp)}{pct(abs(nm-nmp))} change)",
        f"  Profit growth  : {pct(pg)}  vs  Revenue growth: {pct(rg)}",
        f"  Efficiency     : {'Yes — profit is scaling faster than revenue. Each unit of growth is yielding more net income.' if efficient else 'No — profit is not keeping pace with revenue growth. Cost inflation or pricing pressure may be the cause.'}",
        f"  Margin quality : {'Expanding margin is a strong signal of operational control.' if nm > nmp else 'Shrinking margin requires investigation into cost structure.'}",
    ]


def s9_liquidity(r: dict) -> list[str]:
    cr  = r["cur_ratio_c"]
    crp = r["cur_ratio_p"]
    d   = r["raw"]
    cac, _ = d["cur_assets"]
    clc, _ = d["cur_liab"]

    verdict = (
        "Comfortable — current assets cover current liabilities with a {:.2f}x buffer.".format(cr)
        if cr > 1.2 else
        "Adequate — just above break-even, but no meaningful buffer for unexpected outflows."
        if cr >= 1.0 else
        "Strained — current liabilities exceed current assets; company may struggle to meet near-term obligations."
    )

    return [
        f"  Current assets     : {fmt(cac)}",
        f"  Current liabilities: {fmt(clc)}",
        f"  Current ratio      : {crp:.2f} (prev) → {cr:.2f} (current)  "
        + ("↑ improving" if cr > crp else "↓ worsening"),
        f"  Verdict            : {verdict}",
    ]


def s10_solvency(r: dict) -> list[str]:
    dta  = r["dta_c"]
    dtap = r["dta_p"]
    d    = r["raw"]
    tac, _ = d["total_assets"]
    tlc, _ = d["total_liab"]

    over_leveraged = dta > 0.70

    return [
        f"  Total debt (liabilities) : {fmt(tlc)}",
        f"  Total assets             : {fmt(tac)}",
        f"  Debt-to-asset            : {pct(dtap*100)} (prev) → {pct(dta*100)} (current)  "
        + ("↓ improving" if dta < dtap else "↑ worsening"),
        f"  Over-leveraged?          : {'Yes — over 70% of assets are debt-funded. Long-term solvency risk is present. A downturn could impair repayment capacity.' if over_leveraged else 'No — debt-to-asset is within manageable range. The company retains meaningful equity buffer against losses.'}",
        f"  Direction                : {'Positive — leverage ratio is declining.' if dta < dtap else 'Negative — leverage is increasing; worth monitoring closely.'}",
    ]


# ──────────────────────────────────────────────
# REPORT PRINTER
# ──────────────────────────────────────────────

SECTIONS = [
    ("01 · Financial Health Prediction",   s1_health),
    ("02 · Bankruptcy Risk",               s2_bankruptcy),
    ("03 · 10 Red Flags vs Green Flags",   s3_flags),
    ("04 · Assets vs Liabilities Change",  s4_assets_liabilities),
    ("05 · Simple Explanation (ELI5)",     s5_eli5),
    ("06 · What Would a CA / CFA Say?",    s6_cfa),
    ("07 · LLM Investment Opinion",        s7_investment),
    ("08 · Profitability Insight",         s8_profitability),
    ("09 · Liquidity Insight",             s9_liquidity),
    ("10 · Solvency Insight",              s10_solvency),
]

def print_report(data: dict) -> None:
    ratios = calc(data)

    print("\n" + divider("═"))
    print("  FinSight — 10 Structured Financial Insights")
    print(divider("═"))

    for title, fn in SECTIONS:
        print(f"\n  {divider('─', 58)}")
        print(f"  {title}")
        print(f"  {divider('─', 58)}")
        for line in fn(ratios):
            print(line)

    print("\n" + divider("═"))
    print("  End of FinSight Report  —  10 / 10 sections complete")
    print(divider("═") + "\n")


# ──────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────

def main() -> None:
    try:
        data = collect()
        print_report(data)
    except KeyboardInterrupt:
        print("\n\n  Session cancelled.\n")

if __name__ == "__main__":
    main()