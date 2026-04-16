"""
FinSight ETL — Multi-User + Multi-Document (BS + P&L + CFS)
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

import logging
import pandas as pd
import mysql.connector
from mysql.connector import Error

# 🔥 IMPORT YOUR NEW MODULES
from mappings import PNL_MAPPING, CASHFLOW_MAPPING, BALANCE_SHEET_MAPPING
from utils import resolve_field, is_valid_field, to_number

# ──────────────────────────────────────────────
# LOGGING
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("finsight_etl.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)

log = logging.getLogger("finsight_etl")

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "123456",
    "database": "finsight_db",
}

MAX_DYNAMIC_COLUMNS = 120


# ──────────────────────────────────────────────
# INGESTION
# ──────────────────────────────────────────────
def read_excel(filepath: str, sheet=0) -> pd.DataFrame:
    df = pd.read_excel(filepath, sheet_name=sheet, header=0, dtype=str)
    df = df.iloc[:, [0, 2, 3]]
    df.columns = ["particular", "current", "previous"]
    log.info(f"Excel read OK — {len(df)} rows")
    return df


# ──────────────────────────────────────────────
# MAPPING ENGINE
# ──────────────────────────────────────────────
def apply_mapping(field, document_type):
    mapping = {
        "pnl": PNL_MAPPING,
        "cash_flow": CASHFLOW_MAPPING,
        "balance_sheet": BALANCE_SHEET_MAPPING,
    }.get(document_type, {})

    return resolve_field(field, mapping) or field


# ──────────────────────────────────────────────
# CLEANING
# ──────────────────────────────────────────────

def clean_data(df: pd.DataFrame, document_type: str) -> pd.DataFrame:
    df = df.copy()

    # 🧹 remove empty rows
    df.dropna(subset=["particular"], inplace=True)
    df["particular"] = df["particular"].astype(str).str.strip()

    # 🔢 numeric conversion
    df["current"] = df["current"].apply(to_number)
    df["previous"] = df["previous"].apply(to_number)

    # keep meaningful rows
    df = df[df["current"].notna() | df["previous"].notna()]

    # 🔥 mapping
    df["field"] = df["particular"].apply(
        lambda x: apply_mapping(x, document_type)
    )

    # 🚨 CRITICAL FIX (THIS WAS MISSING)
    df["field"] = df["field"].astype(str).str.strip()

    df = df[
        (df["field"].notna()) &
        (df["field"] != "") &
        (df["field"].str.lower() != "nan")
    ]

    # validate AFTER cleaning
    df = df[df["field"].apply(is_valid_field)]

    # remove duplicates
    df.drop_duplicates(subset=["field"], inplace=True)

    # 🛑 column explosion guard
    if len(df) > MAX_DYNAMIC_COLUMNS:
        log.warning(f"Too many fields ({len(df)}) → truncating")
        df = df.head(MAX_DYNAMIC_COLUMNS)

    log.info(f"Cleaning done — {len(df)} fields")

    return df[["field", "current", "previous"]]

# ──────────

# ──────────────────────────────────────────────
# TRANSFORM
# ──────────────────────────────────────────────
def transform_to_rows(df, user_id, company, current_year, previous_year, document_type):
    base = {
        "user_id": user_id,
        "company": company,
        "document_type": document_type,
    }

    current_row = {**base, "year": current_year}
    previous_row = {**base, "year": previous_year}

    for _, row in df.iterrows():
        field = str(row["field"]).strip()

        if not field or field.lower() == "nan":
            continue
        if not is_valid_field(field):
            continue

        current_row[field] = row["current"]
        previous_row[field] = row["previous"]

    return [current_row, previous_row]


# ──────────────────────────────────────────────
# DB HELPERS
# ──────────────────────────────────────────────
def get_dynamic_fields(rows):
    IDENTITY = {"user_id", "company", "year", "document_type"}
    fields = set()

    for row in rows:
        for k in row:
            k = str(k).strip()

            # 🚨 FINAL FILTER
            if not k or k.lower() == "nan":
                continue

            if k in IDENTITY:
                continue

            if not is_valid_field(k):
                continue

            fields.add(k)

    return sorted(fields)


def insert_to_mysql(rows, db_config, table="financial_data"):
    IDENTITY = {"user_id", "company", "year", "document_type"}

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    # ✅ STEP 1: get fields
    fields = get_dynamic_fields(rows)

    # ✅ STEP 2: clean fields
    fields = [f for f in fields if f and str(f).lower() != "nan"]

    # create table
    columns_sql = ", ".join(f"`{f}` DOUBLE NULL" for f in fields)

    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {table} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            company VARCHAR(100),
            year YEAR,
            document_type VARCHAR(50),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            {columns_sql},
            UNIQUE KEY uq_user_company_year_doctype (user_id, company, year, document_type)
        )
    """)

    # add missing columns
    cursor.execute(f"SHOW COLUMNS FROM {table}")
    existing = {col[0] for col in cursor.fetchall()}

    for f in fields:
        if f not in existing:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN `{f}` DOUBLE NULL")

    # ✅ STEP 3: build query
    all_cols = list(IDENTITY) + fields
    col_names = ", ".join(f"`{c}`" for c in all_cols)
    placeholders = ", ".join(["%s"] * len(all_cols))
    updates = ", ".join(f"`{c}`=VALUES(`{c}`)" for c in fields)

    # ✅ STEP 4: insert loop (FIXED INDENTATION)
    for row in rows:
        clean_row = {}

        for k, v in row.items():
            k = str(k).strip()

            # 🚨 FINAL DEFENSE
            if not k or k.lower() == "nan":
                continue

            if not is_valid_field(k):
                continue

            clean_row[k] = v

        values = [clean_row.get(c) for c in all_cols]

        cursor.execute(f"""
            INSERT INTO {table} ({col_names})
            VALUES ({placeholders})
            ON DUPLICATE KEY UPDATE
            {updates},
            updated_at = CURRENT_TIMESTAMP
        """, values)

    conn.commit()
    cursor.close()
    conn.close()

    log.info(f"Inserted {len(rows)} rows")
    
# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────
def extract_company(file_path):
    return file_path.split("_")[0].upper()


def main(user_id, file_path, document_type):
    log.info("=" * 50)

    company = extract_company(file_path)

    log.info(f"Start — user={user_id}, company={company}, doc={document_type}")

    raw_df = read_excel(file_path)

    clean_df = clean_data(raw_df, document_type)

    rows = transform_to_rows(
        clean_df,
        user_id=user_id,
        company=company,
        current_year=2025,
        previous_year=2024,
        document_type=document_type,
    )

    insert_to_mysql(rows, DB_CONFIG)

    log.info("ETL done")


# ──────────────────────────────────────────────
# RUN
# ──────────────────────────────────────────────
if __name__ == "__main__":
    main(1, "bs.xlsx", "balance_sheet")
    main(1, "pnl.xlsx", "pnl")
    main(1, "cfs.xlsx", "cash_flow")