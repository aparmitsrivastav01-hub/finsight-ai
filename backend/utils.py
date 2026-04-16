import re
import logging

log = logging.getLogger("finsight_utils")

# -------- ABBREVIATIONS --------
ABBREVIATIONS = {
    "ebit": "operating_profit",
    "pbt": "profit_before_tax",
    "pat": "net_profit",
    "ppe": "property_plant_equipment",
}

STOP_WORDS = {"the", "and", "of", "for", "to", "in", "on", "net"}

SQL_RESERVED = {"select", "from", "where", "table", "drop", "insert"}


# -------- NORMALIZE --------
def normalize_field(field: str) -> str:
    if not field:
        return ""

    field = field.lower().strip()

    # expand abbreviations first
    for k, v in ABBREVIATIONS.items():
        field = re.sub(rf"\b{k}\b", v, field)

    # remove special chars
    field = re.sub(r"[^a-z0-9\s]", " ", field)

    words = field.split()
    words = [w for w in words if w not in STOP_WORDS]

    field = "_".join(words)

    # remove duplicate underscores
    field = re.sub(r"_+", "_", field).strip("_")

    return field[:50]


# -------- VALIDATION --------
def is_valid_field(field: str) -> bool:
    if not field:
        return False
    
    if field.lower() == "nan":
        return False

    if field in SQL_RESERVED:
        return False

    if re.match(r"^\d", field):
        return False

    if len(field) <= 1:
        return False

    return True


# -------- RESOLVE --------
def resolve_field(field: str, mapping: dict) -> str | None:
    norm = normalize_field(field)

    if not is_valid_field(norm):
        return None

    mapped = mapping.get(norm)

    if mapped:
        return mapped

    log.warning(f"Unknown field: {field} → {norm}")
    return norm


# -------- NUMBER CLEANING --------
def to_number(x):
    if x is None:
        return None

    try:
        x = str(x).replace(",", "").replace(" ", "")
        if x in ("", "-", "nan"):
            return None
        return float(x)
    except:
        return None