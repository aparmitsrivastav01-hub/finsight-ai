# ==============================
# BALANCE SHEET
# ==============================
BALANCE_SHEET_MAPPING = {
    "total_assets": "total_assets",
    "total_current_assets": "total_current_assets",
    "total_non_current_assets": "total_non_current_assets",

    "total_liabilities": "total_liabilities",
    "total_current_liabilities": "total_current_liabilities",
    "total_non_current_liabilities": "total_non_current_liabilities",

    "equity": "equity",
    "equity_share_capital": "equity_share_capital",

    "cash": "cash",
    "cash_equivalents": "cash",

    "receivables": "receivables",
    "trade_receivables": "receivables",

    "property_plant_equipment": "ppe",
    "ppe": "ppe",
}


# ==============================
# P&L
# ==============================
PNL_MAPPING = {
    # revenue
    "revenue_operations": "revenue",
    "revenue": "revenue",
    "sales": "revenue",

    "total_income": "total_income",
    "other_income": "other_income",

    # expenses
    "employee_benefit_expenses": "employee_cost",
    "employee_cost": "employee_cost",

    "depreciation_amortization": "depreciation",
    "depreciation": "depreciation",

    "finance_cost": "finance_cost",
    "interest_expense": "finance_cost",

    "total_expenses": "total_expenses",

    # profit
    "profit_before_tax": "profit_before_tax",

    "tax_expense": "tax",
    "current_tax": "tax",

    "profit_year": "net_profit",
    "profit_after_tax": "net_profit",
    "net_profit": "net_profit",
}


# ==============================
# CASH FLOW
# ==============================
CASHFLOW_MAPPING = {
    # operating
    "net_cash_generated_operating_activities": "operating_cash_flow",
    "net_cash_from_operating_activities": "operating_cash_flow",
    "cash_flow_operating_activities": "operating_cash_flow",

    # investing
    "net_cash_used_investing_activities": "investing_cash_flow",
    "cash_flow_investing_activities": "investing_cash_flow",

    # financing
    "net_cash_used_financing_activities": "financing_cash_flow",
    "cash_flow_financing_activities": "financing_cash_flow",

    # capex
    "purchase_property_plant_equipment": "capex",
    "purchase_ppe": "capex",
    "capital_expenditure": "capex",

    # working capital
    "change_working_capital": "working_capital_change",

    # cash positions
    "cash_beginning": "cash_beginning",
    "cash_equivalents_beginning": "cash_beginning",

    "cash_ending": "cash_ending",
    "cash_equivalents_end": "cash_ending",

    # avoid collision with pnl
    "profit_before_tax": "pbt_cfs",
}