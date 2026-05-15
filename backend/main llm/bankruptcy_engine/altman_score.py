def calculate_altman_z(
    working_capital,
    retained_earnings,
    ebit,
    market_value_equity,
    total_liabilities,
    sales,
    total_assets
):

    if total_assets == 0 or total_liabilities == 0:
        return 0

    A = working_capital / total_assets
    B = retained_earnings / total_assets
    C = ebit / total_assets
    D = market_value_equity / total_liabilities
    E = sales / total_assets

    z_score = (
        1.2 * A
        + 1.4 * B
        + 3.3 * C
        + 0.6 * D
        + 1.0 * E
    )

    return round(z_score, 2)


def classify_altman(z_score):

    if z_score > 2.99:
        return "SAFE"

    elif z_score >= 1.81:
        return "GREY ZONE"

    return "DISTRESS / BANKRUPTCY RISK"