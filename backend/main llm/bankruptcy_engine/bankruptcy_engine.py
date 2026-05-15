from metric_extractor import build_extractor

from bankruptcy_engine.altman_score import (
    calculate_altman_z,
    classify_altman
)


extractor = build_extractor()


def run_bankruptcy_engine(context):

    metrics = extractor.extract_as_dict(
        context
    )

    z_score = calculate_altman_z(

        working_capital=metrics.get(
            "working_capital", 0
        ),

        retained_earnings=metrics.get(
            "retained_earnings", 0
        ),

        ebit=metrics.get(
            "ebit", 0
        ),

        market_value_equity=metrics.get(
            "shareholder_equity", 0
        ),

        total_liabilities=metrics.get(
            "total_liabilities", 0
        ),

        sales=metrics.get(
            "revenue", 0
        ),

        total_assets=metrics.get(
            "total_assets", 0
        )
    )

    classification = classify_altman(
        z_score
    )

    return {

        "z_score": z_score,

        "classification": classification,

        "metrics": metrics
    }