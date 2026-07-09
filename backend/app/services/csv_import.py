import csv
import hashlib
import io
import re
from datetime import date, datetime
from typing import Optional, List

from app.services.ai_service import classify_expense


BANK_PRESETS = {
    "hdfc": {
        "header": ["Date", "Narration", "Chq./Ref.No.", "Value Dat", "Withdrawal Amt.", "Deposit Amt.", "Closing Balance"],
        "date_col": "Date", "desc_col": "Narration",
        "withdrawal_col": "Withdrawal Amt.", "deposit_col": "Deposit Amt.",
    },
    "sbi": {
        "header": ["Date", "Description", "Chq/Ref No", "Credit", "Debit", "Balance"],
        "date_col": "Date", "desc_col": "Description",
        "withdrawal_col": "Debit", "deposit_col": "Credit",
    },
    "icici": {
        "header": ["Date", "Description", "Chq/Ref No", "Withdrawal", "Deposit", "Balance"],
        "date_col": "Date", "desc_col": "Description",
        "withdrawal_col": "Withdrawal", "deposit_col": "Deposit",
    },
    "axis": {
        "header": ["Date", "Transaction Details", "Chq No / Ref No", "Withdrawal", "Deposit", "Balance"],
        "date_col": "Date", "desc_col": "Transaction Details",
        "withdrawal_col": "Withdrawal", "deposit_col": "Deposit",
    },
    "kotak": {
        "header": ["Date", "Narration", "Chq/Ref No", "Withdrawal", "Deposit", "Balance"],
        "date_col": "Date", "desc_col": "Narration",
        "withdrawal_col": "Withdrawal", "deposit_col": "Deposit",
    },
}


DATE_FORMATS = [
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%d-%b-%Y",
    "%d-%b-%y",
    "%Y-%m-%d",
    "%d/%m/%y",
    "%m/%d/%Y",
]


def auto_detect_bank(headers: List[str]) -> Optional[str]:
    clean = [h.strip() for h in headers if h.strip()]
    for key, preset in BANK_PRESETS.items():
        preset_headers = preset["header"]
        matches = sum(1 for ph in preset_headers if ph in clean)
        if matches >= len(preset_headers) * 0.6:
            return key
    return None


def normalize_description(raw: str) -> str:
    cleaned = re.sub(
        r"\b(UPI|NEFT|RTGS|IMPS|TRFR|DR|CR|CARD|POS|ECS|CHQ|ATM)[-/]?\d*\b",
        "", raw, flags=re.IGNORECASE
    )
    cleaned = re.sub(r"\d{6,}", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    cleaned = re.sub(r"[-/]{2,}", "", cleaned)
    return cleaned.strip(" -/,")


def parse_date(date_str: str) -> Optional[date]:
    date_str = date_str.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None


def compute_dedupe_hash(row_date: date, amount: float, description: str) -> str:
    raw = f"{row_date.isoformat()}|{amount:.2f}|{normalize_description(description)}"
    return hashlib.md5(raw.encode()).hexdigest()


def parse_csv(file_content: str) -> dict:
    content = file_content.strip()
    if not content:
        return {"bank_name": "", "rows": [], "errors": ["Empty file"]}

    lines = content.splitlines()
    dialect = csv.Sniffer().sniff(lines[0], delimiters=",\t;")
    reader = csv.DictReader(lines, dialect=dialect)
    raw_headers = reader.fieldnames or []
    headers = [h.strip() for h in raw_headers]

    bank_key = auto_detect_bank(headers)
    preset = BANK_PRESETS.get(bank_key) if bank_key else None

    rows = []
    errors = []
    seen = 0

    for row in reader:
        seen += 1
        try:
            if preset:
                date_raw = row.get(preset["date_col"], "")
                desc_raw = row.get(preset["desc_col"], "")
                withdrawal_raw = row.get(preset["withdrawal_col"], "0")
                deposit_raw = row.get(preset["deposit_col"], "0")
            else:
                cols = list(row.values())
                if len(cols) >= 3:
                    date_raw = cols[0]
                    desc_raw = cols[1]
                    withdrawal_raw = ""
                    deposit_raw = ""
                    for c in cols[2:]:
                        c = c.strip()
                        if c.startswith("-") or c.startswith("(") or (c and c[0].isdigit()):
                            if not withdrawal_raw:
                                withdrawal_raw = c
                            else:
                                deposit_raw = c
                else:
                    errors.append(f"Row {seen}: too few columns")
                    continue

            parsed_date = parse_date(date_raw)
            if not parsed_date:
                errors.append(f"Row {seen}: unparseable date '{date_raw}'")
                continue

            withdrawal = 0.0
            deposit = 0.0
            try:
                if withdrawal_raw.strip():
                    withdrawal = abs(float(withdrawal_raw.replace(",", "")))
            except (ValueError, AttributeError):
                pass
            try:
                if deposit_raw.strip():
                    deposit = abs(float(deposit_raw.replace(",", "")))
            except (ValueError, AttributeError):
                pass

            if withdrawal > 0:
                amount = -withdrawal
                direction = "debit"
            else:
                amount = deposit
                direction = "credit"

            if amount == 0:
                continue

            description = normalize_description(desc_raw)
            dedupe_hash = compute_dedupe_hash(parsed_date, abs(amount), description)

            rows.append({
                "date": parsed_date,
                "description": description,
                "amount": abs(amount),
                "direction": direction,
                "dedupe_hash": dedupe_hash,
            })
        except Exception as e:
            errors.append(f"Row {seen}: {str(e)}")

    return {
        "bank_name": bank_key or "generic",
        "rows": rows,
        "errors": errors,
    }


def categorize_row(description: str, use_case: str = "") -> str:
    try:
        result = classify_expense(description, use_case)
        category = result.get("category", "Other")
        return category if category else "Other"
    except Exception:
        pass

    desc_lower = description.lower()
    category_keywords = {
        "Food & Dining": ["food", "restaurant", "dining", "cafe", "coffee", "lunch", "dinner", "breakfast", "swiggy", "zomato", "eat"],
        "Groceries": ["grocery", "supermarket", "fresh", "vegetable", "fruit", "milk", "bread", "mart"],
        "Transportation": ["fuel", "petrol", "diesel", "uber", "ola", "cab", "metro", "bus", "train", "auto", "fare", "petrol pump", "indian oil", "bharat petroleum"],
        "Shopping": ["amazon", "flipkart", "myntra", "shopping", "mall", "cloth", "apparel", "electronics", "purchase"],
        "Bills & Utilities": ["bill", "electricity", "water", "gas", "phone", "mobile", "recharge", "broadband", "internet", "dth", "insurance", "premium"],
        "Entertainment": ["netflix", "prime", "hotstar", "spotify", "movie", "theatre", "cinema", "game", "subscription"],
        "Health & Fitness": ["hospital", "doctor", "medicin", "pharmacy", "pharm", "clinic", "health", "fitness", "gym", "medical"],
        "Education": ["school", "college", "university", "tution", "fee", "book", "course", "exam", "class"],
        "Subscription": ["subscription", "renew", "membership"],
        "Housing": ["rent", "maintenance", "society", "flat", "apartment"],
        "Travel": ["flight", "hotel", "booking", "trip", "holiday", "vacation", "railway", "irctc", "bus ticket"],
        "Personal Care": ["salon", "spa", "beauty", "cosmetic", "perfume", "personal care"],
    }
    for cat, keywords in category_keywords.items():
        if any(kw in desc_lower for kw in keywords):
            return cat
    return "Other"
