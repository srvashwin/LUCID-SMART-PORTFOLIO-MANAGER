import json
import re
from typing import Optional

from app.config import settings

# Gemini import - with fallback for when not configured
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = bool(settings.GEMINI_API_KEY)
    if GEMINI_AVAILABLE:
        genai.configure(api_key=settings.GEMINI_API_KEY)
except Exception:
    GEMINI_AVAILABLE = False


CURRENCY_SYMBOLS = {
    "USD": "$", "EUR": "\u20AC", "GBP": "\u00A3", "JPY": "\u00A5", "INR": "\u20B9",
    "CAD": "C$", "AUD": "A$", "CHF": "Fr", "CNY": "CN\u00A5", "KRW": "\u20A9",
    "BRL": "R$", "MXN": "Mex$", "SGD": "S$", "HKD": "HK$", "NZD": "NZ$",
    "SEK": "kr", "NOK": "kr", "DKK": "kr", "PLN": "z\u0142", "TRY": "\u20BA",
}


def _get_symbol(currency_code: str) -> str:
    return CURRENCY_SYMBOLS.get(currency_code.upper(), "$")


def _clean_json(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _call_gemini(prompt: str) -> str:
    if not GEMINI_AVAILABLE:
        raise RuntimeError(
            "Gemini API key not configured. Set GEMINI_API_KEY in .env file. "
            "Get a free key at https://aistudio.google.com/apikey"
        )
    model = genai.GenerativeModel("gemini-2.0-flash-lite")
    response = model.generate_content(prompt)
    return response.text


def classify_expense(message: str, use_case: Optional[str] = "") -> dict:
    prompt = f"""You are a financial expense classifier. Given a user's message, extract the following as JSON:
- "amount": the numeric amount spent (float)
- "category": one of: Food & Dining, Transportation, Shopping, Bills & Utilities, Entertainment, Health & Fitness, Education, Housing, Travel, Groceries, Personal Care, Other
- "description": a short description of the expense (string)
- "merchant": the store or service name if identifiable, else empty string
- "use_case": brief context of why they spent this (if use_case provided, use that)

Message: "{message}"
Use case: "{use_case}"

Return ONLY valid JSON without markdown formatting."""

    try:
        result = _call_gemini(prompt)
        result = _clean_json(result)
        data = json.loads(result)
        return {
            "amount": float(data.get("amount", 0)),
            "category": str(data.get("category", "Other")),
            "description": str(data.get("description", "")),
            "merchant": str(data.get("merchant", "")),
            "use_case": str(data.get("use_case", use_case)),
        }
    except Exception as e:
        # Fallback: simple extraction
        amounts = re.findall(r"[\d,]+(?:\.\d{2})?", message)
        amount = float(amounts[-1].replace(",", "")) if amounts else 0
        return {
            "amount": amount,
            "category": "Other",
            "description": message,
            "merchant": "",
            "use_case": use_case,
        }


def get_suggestions(
    income_total: float,
    monthly_expenses: float,
    category_breakdown: list,
    investment_goals: list,
    user_goals: list,
    spending_rules: list,
) -> list:
    goals_text = "\n".join([
        f"- {g.get('type', 'goal')}: target ${g.get('target_amount', 0):.2f}, "
        f"${g.get('monthly_contribution', 0):.2f}/mo at {g.get('expected_return_rate', 7)}%"
        for g in user_goals
    ]) or "None set"

    inv_text = "\n".join([
        f"- {g.get('name', 'Investment')}: target ${g.get('target_amount', 0):.2f}, "
        f"${g.get('monthly_contribution', 0):.2f}/mo at {g.get('expected_return_rate', 7)}%"
        for g in investment_goals
    ]) or "None set"

    rules_text = "\n".join([
        f"- ${r.get('max_amount', 0):.2f}/mo on {r.get('category', '')}"
        for r in spending_rules
    ]) or "None set"

    cats_text = "\n".join([
        f"- {c.get('category', '')}: ${c.get('total', 0):.2f} ({c.get('count', 0)} transactions)"
        for c in category_breakdown
    ]) or "No data"

    prompt = f"""You are a financial advisor assistant. Given a user's financial data, provide 3-5 personalized suggestions for improving their spending and reaching their goals.

Income: ${income_total:.2f}/month
Total monthly expenses: ${monthly_expenses:.2f}
Savings rate: {((income_total - monthly_expenses) / income_total * 100) if income_total > 0 else 0:.1f}%

Category breakdown this month:
{cats_text}

Spending rules:
{rules_text}

Investment goals:
{inv_text}

Savings goals:
{goals_text}

For each suggestion:
1. Reference their specific goals and spending data
2. Be concrete with numbers
3. Include a disclaimer
4. Be encouraging, not judgmental

Return a JSON array of strings, each being one suggestion. No markdown. Example: ["Suggestion 1", "Suggestion 2"]"""

    try:
        result = _call_gemini(prompt)
        result = _clean_json(result)
        suggestions = json.loads(result)
        if isinstance(suggestions, list):
            return suggestions
        return ["Track your spending to identify patterns. (This is not financial advice.)"]
    except Exception:
        return [
            f"You're spending ${monthly_expenses:.2f} of ${income_total:.2f} income "
            f"({(monthly_expenses / income_total * 100) if income_total > 0 else 0:.0f}%). "
            "Consider reviewing non-essential categories. (This is not financial advice.)"
        ]


def analyze_purchase(
    expense_amount: float,
    expense_description: str,
    use_case: str,
    investment_goals: list,
    user_goals: list,
) -> dict:
    yearly_goals_text = "\n".join([
        f"- {g.get('type', 'goal')}: target ${g.get('target_amount', 0):.2f}, "
        f"${g.get('monthly_contribution', 0):.2f}/mo, {g.get('expected_return_rate', 7)}% return"
        for g in user_goals
    ]) or "None set"

    inv_goals_text = "\n".join([
        f"- {g.get('name', 'Investment')}: target ${g.get('target_amount', 0):.2f}, "
        f"${g.get('monthly_contribution', 0):.2f}/mo, {g.get('expected_return_rate', 7)}% return"
        for g in investment_goals
    ]) or "None set"

    # Get the average return rate for projections
    rates = []
    for g in user_goals + investment_goals:
        if g.get("expected_return_rate"):
            rates.append(g["expected_return_rate"])
    avg_rate = sum(rates) / len(rates) if rates else 7.0

    # Compound growth calculations
    def compound(principal, rate, years):
        return principal * ((1 + rate / 100) ** years)

    projections = {}
    for years in [1, 3, 5, 10]:
        projected = compound(expense_amount, avg_rate, years)
        projections[f"{years}_year"] = round(projected, 2)

    prompt = f"""Given a user considering a ${expense_amount:.2f} purchase:
Description: "{expense_description}"
Use case: "{use_case}"

Their financial goals:
Yearly/ savings goals:
{yearly_goals_text}

Investment goals:
{inv_goals_text}

Average expected return rate: {avg_rate}%
Projected growth if invested instead of spent:
{json.dumps(projections, indent=2)}

Provide a balanced analysis in a JSON object:
- "projected_growth": the projections object
- "impact": how this affects their goals (string)
- "context": acknowledge the use case and whether it changes the equation (string)
- "verdict": "Your call." (always)
- "disclaimer": "This is not financial advice."

Return ONLY valid JSON. No markdown."""

    try:
        result = _call_gemini(prompt)
        result = _clean_json(result)
        data = json.loads(result)
        data["projected_growth"] = data.get("projected_growth", projections)
        data["return_rate_used"] = avg_rate
        return data
    except Exception:
        return {
            "projected_growth": projections,
            "impact": f"This ${expense_amount:.2f} could grow to ${projections['5_year']:.2f} in 5 years at {avg_rate}%.",
            "context": f"Use case: {use_case}. Consider how this fits your priorities.",
            "verdict": "Your call.",
            "disclaimer": "This is not financial advice.",
            "return_rate_used": avg_rate,
        }


def calculate_investment_plan(target_return: float, years: int, preference: str = "") -> dict:
    investment_options = [
        {"name": "Fixed Deposits / Bonds", "expected_return": 5.0, "risk": "Low"},
        {"name": "Balanced Mutual Funds", "expected_return": 9.0, "risk": "Medium"},
        {"name": "Index Funds / ETFs", "expected_return": 11.0, "risk": "Medium-High"},
        {"name": "Growth Stocks", "expected_return": 14.0, "risk": "High"},
        {"name": "Aggressive Portfolio", "expected_return": 18.0, "risk": "Aggressive"},
    ]

    preference_map = {
        "bonds": "Fixed Deposits / Bonds",
        "fixed_deposits": "Fixed Deposits / Bonds",
        "mutual_funds": "Balanced Mutual Funds",
        "balanced": "Balanced Mutual Funds",
        "etfs": "Index Funds / ETFs",
        "index_funds": "Index Funds / ETFs",
        "stocks": "Growth Stocks",
        "growth": "Growth Stocks",
        "aggressive": "Aggressive Portfolio",
    }

    # Filter by preference
    if preference:
        matched = preference_map.get(preference.lower().replace(" ", "_"))
        if matched:
            investment_options = [o for o in investment_options if o["name"] == matched]

    results = []
    for opt in investment_options:
        rate = opt["expected_return"]
        monthly_rate = rate / 100 / 12
        n_months = years * 12

        if monthly_rate > 0:
            monthly_investment = target_return * monthly_rate / ((1 + monthly_rate) ** n_months - 1)
        else:
            monthly_investment = target_return / n_months

        total_invested = monthly_investment * n_months
        final_value = target_return  # The formula is designed to hit exactly target_return

        results.append({
            "name": opt["name"],
            "expected_return": rate,
            "monthly_investment": round(monthly_investment, 2),
            "total_invested": round(total_invested, 2),
            "final_value": round(final_value, 2),
            "risk": opt["risk"],
        })

    results.sort(key=lambda x: x["monthly_investment"])

    return {
        "target_return": target_return,
        "years": years,
        "options": results,
        "disclaimer": "This is not financial advice. Past performance does not guarantee future returns.",
    }


def process_agent_message(message: str, currency_code: str = "USD") -> dict:
    sym = _get_symbol(currency_code)
    prompt = f"""You are a financial assistant. Given a user's message, classify their intent and extract structured data.

Intents and their required fields:
- "add_income": amount (float), frequency ("weekly"/"biweekly"/"monthly"/"yearly"), source (string), increment (boolean — true if user said "increased by", "raised by", "raise", "bonus", "went up", "got a raise", "extra"; false if they said "my income is", "I earn", "I make")
- "add_expense": amount (float), category (string), description (string), merchant (string)
- "add_investment_goal": name (string), target_amount (float), monthly_contribution (float, default 0)
- "add_investment": monthly_contribution (float), current_amount (float, default 0) — for recording contributions or monthly amounts being invested toward an existing goal; NOT for creating new goals
- "add_to_fund": amount (float), name (string, default "Savings Fund") — for adding money to an existing savings/investment fund; NOT for creating new goals
- "add_savings_goal": type ("yearly_savings"/"investment_return"), target_amount (float), monthly_contribution (float, default 0)
- "add_spending_rule": category (string), max_amount (float), period ("monthly"/"weekly")
- "change_currency": currency (string — one of USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MXN, BRL, KRW, SEK, NOK, NZD, SGD, HKD, THB, ZAR, AED)

Return ONLY a JSON object with:
- "intent": one of the intents above
- "data": object with the extracted fields
- "message": a short confirmation string in {currency_code} (use {sym} as currency symbol)

Message: "{message}"

Examples:
- {{"intent": "add_income", "data": {{"amount": 5000, "frequency": "monthly", "source": "salary"}}, "message": "I'll add {sym}5000/month income from salary."}}
- {{"intent": "add_to_fund", "data": {{"amount": 1000, "name": "Savings Fund"}}, "message": "I'll add {sym}1000 to your Savings Fund."}}
- {{"intent": "add_to_fund", "data": {{"amount": 500, "name": "Emergency Fund"}}, "message": "I'll add {sym}500 to your Emergency Fund."}}

Return ONLY valid JSON. No markdown."""

    try:
        result = _call_gemini(prompt)
        result = _clean_json(result)
        parsed = json.loads(result)
        return parsed
    except Exception:
        lower = message.lower()
        normalized = re.sub(r"(\d+)\s*k(?!\w)", r"\g<1>000", message, flags=re.IGNORECASE)
        normalized = re.sub(r"(\d+)\s*m(?!\w)", r"\g<1>000000", normalized, flags=re.IGNORECASE)
        amounts = re.findall(r"[\d,]+(?:\.\d{2})?", normalized)
        amount = float(amounts[-1].replace(",", "")) if amounts else 0

        if any(w in lower for w in ["income", "salary", "earn", "make", "i get", "budget", "paycheck", "wage", "earning", "take home", "i bring"]):
            freq = "monthly"
            if any(w in lower for w in ["weekly", "every week"]):
                freq = "weekly"
            elif any(w in lower for w in ["biweekly", "every two week", "bi-weekly"]):
                freq = "biweekly"
            elif any(w in lower for w in ["yearly", "annual", "per year"]):
                freq = "yearly"
            source = "salary" if "salary" in lower else "income"
            is_increment = any(w in lower for w in ["increase", "raised", "raise", "bonus", "went up", "got a raise", "increment", "extra", "added"])
            return {
                "intent": "add_income",
                "data": {"amount": amount, "frequency": freq, "source": source, "increment": is_increment},
                "message": f"I'll add {sym}{amount:.2f}/{freq} income from {source}.",
            }

        if any(w in lower for w in ["spent", "spend", "bought", "paid", "purchase", "cost", "ordered", "charged", "picked up", "subscription", "subscribe", "membership"]):
            is_sub = "subscription" in lower or "subscribe" in lower or "membership" in lower
            if is_sub:
                m = re.search(r'(\w+)\s+subscription', lower)
                merchant = m.group(1).title() if m else ""
                if any(w in lower for w in ["year", "annual", "per year", "yearly"]):
                    amount = amount / 12
                return {
                    "intent": "add_expense",
                    "data": {"amount": round(amount, 2), "category": "Subscription", "description": f"{merchant} subscription" if merchant else "Subscription", "merchant": merchant},
                    "message": f"I'll log {sym}{amount:.2f}/month for {merchant or 'subscription'}.",
                }
            category = "Other"
            categories = ["food", "dining", "grocery", "transport", "shopping", "bill", "utility",
                          "entertainment", "health", "fitness", "education", "housing", "travel"]
            for c in categories:
                if c in lower:
                    category = c.title()
                    break
            merchant = ""
            at_match = re.search(r'\b(?:at|from)\s+(\w+(?:\s+\w+)?)', lower, re.IGNORECASE)
            if at_match:
                merchant = at_match.group(1).title()
            description = f"{category} at {merchant}" if merchant else category
            return {
                "intent": "add_expense",
                "data": {"amount": amount, "category": category, "description": description, "merchant": merchant},
                "message": f"I'll log {sym}{amount:.2f} in {category}.",
            }

        if any(w in lower for w in ["invest", "retirement", "portfolio", "stock", "etf", "mutual fund", "index fund", "dividend", "wealth"]):
            if any(w in lower for w in ["monthly", "per month", "/month", "each month", "every month"]):
                monthly = amount if amount > 0 else 500
                return {
                    "intent": "add_investment",
                    "data": {"monthly_contribution": round(monthly, 2), "current_amount": 0},
                    "message": f"I'll set your monthly investment to {sym}{monthly:.2f}.",
                }
            return {
                "intent": "add_investment",
                "data": {"monthly_contribution": 0, "current_amount": round(amount, 2) if amount > 0 else 0},
                "message": f"I'll add {sym}{amount:.2f} to your investments.",
            }

        add_to_fund_phrases = ["add to savings", "put in savings", "add to fund", "put in fund", "add to my savings", "savings fund", "saving fund", "contribute to savings", "contribute to fund"]
        has_fund_keyword = "saving" in lower or "savings" in lower or "fund" in lower
        has_add_keyword = any(w in lower for w in ["add", "put", "contribute", "extra", "added", "adding"])
        if any(k in lower for k in add_to_fund_phrases) or (has_fund_keyword and has_add_keyword):
            fund_name = "Savings Fund"
            if "emergency" in lower:
                fund_name = "Emergency Fund"
            elif "vacation" in lower:
                fund_name = "Vacation Fund"
            elif "house" in lower or "down payment" in lower:
                fund_name = "House Fund"
            elif "car" in lower:
                fund_name = "Car Fund"
            elif "college" in lower or "education" in lower:
                fund_name = "Education Fund"
            return {
                "intent": "add_to_fund",
                "data": {"amount": round(amount, 2) if amount > 0 else 0, "name": fund_name},
                "message": f"I'll add {sym}{amount:.2f} to your {fund_name}.",
            }

        if any(w in lower for w in ["save", "saving", "goal", "target", "house", "emergency", "down payment", "college", "vacation", "car", "wedding", "rainy day", "nest egg"]):
            target = amount if amount > 0 else 10000
            monthly = target / 60
            return {
                "intent": "add_savings_goal",
                "data": {"type": "yearly_savings", "target_amount": target, "monthly_contribution": round(monthly, 2)},
                "message": f"I'll set a savings goal of {sym}{target:.2f} with {sym}{monthly:.2f}/month.",
            }

        if any(w in lower for w in ["limit", "rule", "cap", "max", "restrict"]):
            category = "Other"
            categories = ["food", "dining", "grocery", "transport", "shopping", "bill", "utility",
                          "entertainment", "health", "fitness", "education", "housing", "travel"]
            for c in categories:
                if c in lower:
                    category = c.title()
                    break
            max_amt = amount if amount > 0 else 200
            return {
                "intent": "add_spending_rule",
                "data": {"category": category, "max_amount": max_amt, "period": "monthly"},
                "message": f"I'll set a {sym}{max_amt:.2f}/month limit on {category}.",
            }

        if any(w in lower for w in ["currency", "change to", "switch to"]):
            currencies = ["usd", "eur", "gbp", "jpy", "cad", "aud", "chf", "cny", "inr", "mxn",
                          "brl", "krw", "sek", "nok", "nzd", "sgd", "hkd", "thb", "zar", "aed"]
            for c in currencies:
                if c in lower:
                    return {
                        "intent": "change_currency",
                        "data": {"currency": c.upper()},
                        "message": f"I'll change your currency to {c.upper()}.",
                    }

        return {
            "intent": "general",
            "data": {},
            "message": "I'm not sure what you'd like to do. Try saying something like 'my income is $5000/month' or 'spent $45 on groceries'.",
        }
