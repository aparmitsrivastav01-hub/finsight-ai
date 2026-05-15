"""
metric_extractor.py
Production-grade financial metric extractor
optimized for financial PDF RAG pipelines.
"""

from __future__ import annotations

import logging
import re

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# =========================================================
# LOGGING
# =========================================================

logger = logging.getLogger(__name__)

logger.setLevel(logging.DEBUG)

if not logger.handlers:

    handler = logging.StreamHandler()

    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s [%(levelname)s] %(message)s"
        )
    )

    logger.addHandler(handler)


# =========================================================
# CONFIDENCE LEVELS
# =========================================================

class Confidence(str, Enum):

    HIGH = "high"

    MEDIUM = "medium"

    LOW = "low"


# =========================================================
# EXTRACTION RESULT
# =========================================================

@dataclass
class ExtractionResult:

    metric: str

    value: Optional[float]

    raw_match: Optional[str]

    confidence: Confidence

    source_snippet: Optional[str] = None

    def to_dict(self):

        return {
            "metric": self.metric,
            "value": self.value,
            "raw_match": self.raw_match,
            "confidence": self.confidence.value,
            "source_snippet": self.source_snippet
        }


# =========================================================
# METRIC CONFIG
# =========================================================

@dataclass
class MetricConfig:

    name: str

    keywords: list[str]

    anti_keywords: list[str] = field(default_factory=list)

    section: Optional[str] = None


# =========================================================
# METRIC DEFINITIONS
# =========================================================

METRIC_CONFIGS = [

    MetricConfig(

        name="working_capital",

        keywords=[
            "working capital",
            "net working capital",
            "net current assets"
        ],

        anti_keywords=[
            "change in working capital"
        ],

        section="balance_sheet"
    ),

    MetricConfig(

        name="retained_earnings",

        keywords=[
            "retained earnings",
            "accumulated deficit",
            "retained deficit",
            "undistributed earnings"
        ],

        section="balance_sheet"
    ),

    MetricConfig(

        name="ebit",

        keywords=[
            "ebit",
            "operating income",
            "operating profit",
            "income from operations",
            "profit before tax"
        ],

        anti_keywords=[
            "ebitda"
        ],

        section="income_statement"
    ),

    MetricConfig(

        name="revenue",

        keywords=[
            "revenue",
            "total revenue",
            "net sales",
            "sales",
            "turnover"
        ],

        anti_keywords=[
            "other revenue"
        ],

        section="income_statement"
    ),

    MetricConfig(

        name="total_assets",

        keywords=[
            "total assets",
            "assets total"
        ],

        anti_keywords=[
            "net assets"
        ],

        section="balance_sheet"
    ),

    MetricConfig(

        name="total_liabilities",

        keywords=[
            "total liabilities",
            "liabilities total"
        ],

        anti_keywords=[
            "total liabilities and equity"
        ],

        section="balance_sheet"
    ),

    MetricConfig(

        name="shareholder_equity",

        keywords=[
            "shareholders equity",
            "shareholders' equity",
            "stockholders equity",
            "total equity",
            "owners equity"
        ],

        anti_keywords=[
            "minority interest"
        ],

        section="balance_sheet"
    )
]


# =========================================================
# TEXT NORMALIZER
# =========================================================

class TextNormalizer:

    @staticmethod
    def normalize(text: str) -> str:

        # remove weird unicode dashes
        text = re.sub(
            r"[–—‐-‒]",
            "-",
            text
        )

        # remove page numbers
        text = re.sub(
            r"page\s+\d+",
            "",
            text,
            flags=re.IGNORECASE
        )

        # fix broken words
        text = re.sub(
            r"-\n",
            "",
            text
        )

        # collapse multiple newlines
        text = re.sub(
            r"\n{3,}",
            "\n\n",
            text
        )

        return text


# =========================================================
# VALUE PARSER
# =========================================================

class ValueParser:

    @staticmethod
    def parse(raw: str) -> Optional[float]:

        if not raw:
            return None

        raw = raw.strip()

        # Remove currencies
        raw = re.sub(
            r"(USD|INR|EUR|GBP|₹|\$|€|£)",
            "",
            raw,
            flags=re.IGNORECASE
        )

        # Convert accounting negatives
        negative = False

        if "(" in raw and ")" in raw:
            negative = True

        raw = raw.replace("(", "")
        raw = raw.replace(")", "")

        # Remove commas/spaces
        raw = re.sub(r"\s+", " ", raw)
        raw = re.sub(r"\s+", " ", raw)

        try:

            value = float(raw)

            if negative:
                value = -value

            return value

        except:
            return None


# =========================================================
# METRIC EXTRACTOR
# =========================================================

class MetricExtractor:

    def __init__(self):

        self.configs = METRIC_CONFIGS

    # -----------------------------------------------------
    # MAIN EXTRACTION
    # -----------------------------------------------------

    def extract(self, raw_text: str):

        text = TextNormalizer.normalize(raw_text)

        results = []

        for config in self.configs:

            result = self._extract_single_metric(
                text,
                config
            )

            results.append(result)

        return results

    # -----------------------------------------------------
    # RETURN AS DICT
    # -----------------------------------------------------

    def extract_as_dict(self, raw_text: str):

        results = self.extract(raw_text)

        return {
            r.metric: r.value if r.value is not None else 0
            for r in results
        }

    # -----------------------------------------------------
    # SINGLE METRIC EXTRACTION
    # -----------------------------------------------------

    def _extract_single_metric(

        self,

        text: str,

        config: MetricConfig

    ) -> ExtractionResult:

        lines = text.split("\n")

        best_value = None

        best_raw = None

        best_confidence = Confidence.LOW

        best_snippet = None

        for idx, line in enumerate(lines):

            lower_line = line.lower()

            # ---------------------------------------------
            # CHECK KEYWORDS
            # ---------------------------------------------
            matched_keyword = None

            for keyword in config.keywords:

                if keyword.lower() in lower_line:

                    matched_keyword = keyword
                    break

            if not matched_keyword:
                continue

            # ---------------------------------------------
            # ANTI KEYWORD FILTER
            # ---------------------------------------------
            rejected = False

            for anti in config.anti_keywords:

                if anti.lower() in lower_line:

                    rejected = True
                    break

            if rejected:
                continue

            # ---------------------------------------------
            # SCAN NEARBY LINES
            # ---------------------------------------------
            nearby_text = ""

            for offset in range(0, 4):

                if idx + offset < len(lines):

                    nearby_text += (
                        lines[idx + offset] + " "
                    )

            # ---------------------------------------------
            # FIND ALL NUMBERS
            # ---------------------------------------------
            raw_numbers = re.findall(

                r"[\(\-]?\d[\d,\.\s]{0,20}[\)]?",

                nearby_text
            )

            parsed_values = []

            for raw in raw_numbers:

                value = ValueParser.parse(raw)

                if value is None:
                    continue

                # -----------------------------------------
                # FILTER GARBAGE VALUES
                # -----------------------------------------

                # reject years
                if 1900 <= abs(value) <= 2100:
                    continue

                # reject tiny note numbers
                if abs(value) < 100:
                    continue

                parsed_values.append(
                    (raw, value)
                )

            if not parsed_values:
                continue

            # ---------------------------------------------
            # FINANCIAL TABLE HEURISTIC
            # Prefer largest nearby value
            # ---------------------------------------------
            raw_match, value = max(

                parsed_values,

                key=lambda x: abs(x[1])
            )

            # ---------------------------------------------
            # CONFIDENCE
            # ---------------------------------------------
            confidence = Confidence.HIGH

            if len(parsed_values) > 5:
                confidence = Confidence.MEDIUM

            # ---------------------------------------------
            # STORE BEST
            # ---------------------------------------------
            if (

                best_value is None

                or abs(value) > abs(best_value)

            ):

                best_value = value

                best_raw = raw_match

                best_confidence = confidence

                best_snippet = nearby_text[:120]

        return ExtractionResult(

            metric=config.name,

            value=best_value,

            raw_match=best_raw,

            confidence=best_confidence,

            source_snippet=best_snippet
        )


# =========================================================
# FACTORY
# =========================================================

def build_extractor():

    return MetricExtractor()


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    SAMPLE = """

    CONSOLIDATED BALANCE SHEET

    Total Revenue 1,24,500

    Operating Income 46,300

    Total Assets 1,54,500

    Total Liabilities 82,500

    Retained Earnings (8,000)

    Total Equity 72,000
    """

    extractor = build_extractor()

    results = extractor.extract(SAMPLE)

    print("\n========== RESULTS ==========\n")

    for r in results:

        print(r.to_dict())