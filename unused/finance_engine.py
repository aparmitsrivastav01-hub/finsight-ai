# import re


# # -----------------------------
# # EXTRACT NUMBER FROM TEXT
# # -----------------------------
# def extract_number(text):

#     # Remove commas and dollar signs
#     text = text.replace(",", "")
#     text = text.replace("$", "")
#     text = text.strip()

#     # ---------------------------------
#     # HANDLE ACCOUNTING NEGATIVES
#     # Example: (352.6) -> -352.6
#     # ---------------------------------
#     if "(" in text and ")" in text:

#         match = re.search(
#             r"\((\d+\.?\d*)\)",
#             text
#         )

#         if match:
#             return -float(match.group(1))

#     # ---------------------------------
#     # HANDLE NORMAL POSITIVE/NEGATIVE
#     # ---------------------------------
#     match = re.search(
#         r"-?\d+\.?\d*",
#         text
#     )

#     if match:
#         return float(match.group())

#     return 0


# # -----------------------------
# # FIND METRIC FROM TEXT
# # -----------------------------
# def find_metric(text, keywords):

#     lines = text.split("\n")

#     for line in lines:

#         lower_line = line.lower()

#         for keyword in keywords:

#             if keyword in lower_line:

#                 value = extract_number(line)

#                 if value != 0:
#                     return value

#     return 0


# # -----------------------------
# # EXTRACT FINANCIAL METRICS
# # -----------------------------
# def extract_financial_metrics(text):

#     metrics = {

#         # -------------------------
#         # WORKING CAPITAL
#         # -------------------------
#         "working_capital":

#             find_metric(
#                 text,
#                 [
#                     "working capital",
#                     "net current assets"
#                 ]
#             ),

#         # -------------------------
#         # RETAINED EARNINGS
#         # -------------------------
#         "retained_earnings":

#             find_metric(
#                 text,
#                 [
#                     "retained earnings",
#                     "accumulated deficit"
#                 ]
#             ),

#         # -------------------------
#         # EBIT
#         # -------------------------
#         "ebit":

#             find_metric(
#                 text,
#                 [
#                     "operating income",
#                     "profit before tax",
#                     "ebit",
#                     "operating loss"
#                 ]
#             ),

#         # -------------------------
#         # SALES / REVENUE
#         # -------------------------
#         "sales":

#             find_metric(
#                 text,
#                 [
#                     "revenue from operations",
#                     "total revenues",
#                     "revenue",
#                     "sales"
#                 ]
#             ),

#         # -------------------------
#         # TOTAL ASSETS
#         # -------------------------
#         "total_assets":

#             find_metric(
#                 text,
#                 [
#                     "total assets"
#                 ]
#             ),

#         # -------------------------
#         # TOTAL LIABILITIES
#         # -------------------------
#         "total_liabilities":

#             find_metric(
#                 text,
#                 [
#                     "total liabilities"
#                 ]
#             ),

#         # -------------------------
#         # EQUITY
#         # -------------------------
#         "equity":

#             find_metric(
#                 text,
#                 [
#                     "total equity",
#                     "stockholders deficit",
#                     "shareholders equity"
#                 ]
#             )
#     }

#     return metrics


# # -----------------------------
# # CALCULATE ALTMAN Z SCORE
# # -----------------------------
# def calculate_altman_z(

#     working_capital,
#     retained_earnings,
#     ebit,
#     market_value_equity,
#     total_liabilities,
#     sales,
#     total_assets
# ):

#     # Prevent divide-by-zero
#     if (
#         total_assets == 0
#         or total_liabilities == 0
#     ):
#         return 0

#     # -------------------------
#     # ALTMAN COMPONENTS
#     # -------------------------
#     A = working_capital / total_assets

#     B = retained_earnings / total_assets

#     C = ebit / total_assets

#     D = market_value_equity / total_liabilities

#     E = sales / total_assets

#     # -------------------------
#     # FINAL Z SCORE
#     # -------------------------
#     z_score = (

#         1.2 * A

#         + 1.4 * B

#         + 3.3 * C

#         + 0.6 * D

#         + 1.0 * E
#     )

#     return round(z_score, 2)


# # -----------------------------
# # CLASSIFY BANKRUPTCY RISK
# # -----------------------------
# def classify_bankruptcy_risk(z_score):

#     if z_score > 2.99:
#         return "SAFE"

#     elif z_score >= 1.81:
#         return "GREY ZONE"

#     return "DISTRESS / BANKRUPTCY RISK"


# # -----------------------------
# # MAIN MODEL RUNNER
# # -----------------------------
# def run_altman_model(context):

#     metrics = extract_financial_metrics(
#         context
#     )

#     # ---------------------------------
#     # DEBUG PRINT
#     # ---------------------------------
#     print("\nEXTRACTED METRICS:")
#     print(metrics)

#     # ---------------------------------
#     # GET VALUES
#     # ---------------------------------
#     working_capital = metrics[
#         "working_capital"
#     ]

#     retained_earnings = metrics[
#         "retained_earnings"
#     ]

#     ebit = metrics[
#         "ebit"
#     ]

#     sales = metrics[
#         "sales"
#     ]

#     total_assets = metrics[
#         "total_assets"
#     ]

#     total_liabilities = metrics[
#         "total_liabilities"
#     ]

#     equity = metrics[
#         "equity"
#     ]

#     # ---------------------------------
#     # FALLBACK FOR NEGATIVE EQUITY
#     # ---------------------------------
#     if equity == 0:

#         equity = (
#             total_assets
#             - total_liabilities
#         )

#     # ---------------------------------
#     # CALCULATE SCORE
#     # ---------------------------------
#     z_score = calculate_altman_z(

#         working_capital=
#             working_capital,

#         retained_earnings=
#             retained_earnings,

#         ebit=
#             ebit,

#         market_value_equity=
#             equity,

#         total_liabilities=
#             total_liabilities,

#         sales=
#             sales,

#         total_assets=
#             total_assets
#     )

#     # ---------------------------------
#     # CLASSIFY RISK
#     # ---------------------------------
#     risk = classify_bankruptcy_risk(
#         z_score
#     )

#     return {

#         "score": z_score,

#         "classification": risk,

#         "metrics": metrics
#     }