import pytest


def test_classify_expense_fallback_extracts_amount():
    from app.services.ai_service import classify_expense
    result = classify_expense("spent 45.50 on lunch")
    assert result["amount"] == 45.50
    assert result["category"] == "Other"
    assert "lunch" in result["description"]


def test_classify_expense_fallback_no_amount():
    from app.services.ai_service import classify_expense
    result = classify_expense("bought some food")
    assert result["amount"] == 0.0


def test_classify_expense_fallback_with_use_case():
    from app.services.ai_service import classify_expense
    result = classify_expense("50 for dinner", use_case="business")
    assert result["use_case"] == "business"


def test_classify_expense_multiple_numbers():
    from app.services.ai_service import classify_expense
    result = classify_expense("paid 100 and then 25.50 for tip")
    assert result["amount"] == 25.50


def test_get_suggestions_fallback():
    from app.services.ai_service import get_suggestions
    suggestions = get_suggestions(5000, 3000, [], [], [], [])
    assert len(suggestions) >= 1
    assert "not financial advice" in suggestions[0]


def test_get_suggestions_zero_income():
    from app.services.ai_service import get_suggestions
    suggestions = get_suggestions(0, 0, [], [], [], [])
    assert len(suggestions) >= 1


def test_analyze_purchase_fallback():
    from app.services.ai_service import analyze_purchase
    result = analyze_purchase(1000, "new phone", "work", [], [])
    assert result["verdict"] == "Your call."
    assert "not financial advice" in result["disclaimer"]
    assert "projected_growth" in result
    assert "return_rate_used" in result


def test_analyze_purchase_with_goals():
    from app.services.ai_service import analyze_purchase
    user_goals = [{"type": "vacation", "target_amount": 5000, "expected_return_rate": 7}]
    result = analyze_purchase(500, "dinner", "celebration", [], user_goals)
    assert result["return_rate_used"] == 7.0
    assert "5_year" in result["projected_growth"]


def test_analyze_purchase_zero_amount():
    from app.services.ai_service import analyze_purchase
    result = analyze_purchase(0, "free item", "", [], [])
    assert result["projected_growth"]["5_year"] == 0.0


def test_calculate_investment_plan():
    from app.services.ai_service import calculate_investment_plan
    result = calculate_investment_plan(100000, 10)
    assert result["target_return"] == 100000
    assert result["years"] == 10
    assert len(result["options"]) == 5
    assert result["options"][0]["monthly_investment"] > 0
    assert "not financial advice" in result["disclaimer"]


def test_calculate_investment_plan_zero_return():
    from app.services.ai_service import calculate_investment_plan
    result = calculate_investment_plan(0, 10)
    assert len(result["options"]) == 5


def test_calculate_investment_plan_one_year():
    from app.services.ai_service import calculate_investment_plan
    result = calculate_investment_plan(10000, 1)
    assert len(result["options"]) == 5


def test_calculate_investment_plan_preference_bonds():
    from app.services.ai_service import calculate_investment_plan
    result = calculate_investment_plan(50000, 5, preference="bonds")
    assert len(result["options"]) == 1
    assert "Bonds" in result["options"][0]["name"]


def test_calculate_investment_plan_preference_stocks():
    from app.services.ai_service import calculate_investment_plan
    result = calculate_investment_plan(50000, 5, preference="stocks")
    assert len(result["options"]) == 1
    assert "Stocks" in result["options"][0]["name"]


def test_calculate_investment_plan_preference_aggressive():
    from app.services.ai_service import calculate_investment_plan
    result = calculate_investment_plan(50000, 5, preference="aggressive")
    assert len(result["options"]) == 1
    assert "Aggressive" in result["options"][0]["name"]


def test_calculate_investment_plan_preference_no_match():
    from app.services.ai_service import calculate_investment_plan
    result = calculate_investment_plan(50000, 5, preference="unknown_pref")
    assert len(result["options"]) == 5


def test_clean_json_strips_markdown():
    from app.services.ai_service import _clean_json
    result = _clean_json("```json\n{\"key\": \"value\"}\n```")
    assert result == '{"key": "value"}'


def test_clean_json_no_fence():
    from app.services.ai_service import _clean_json
    result = _clean_json('{"key": "value"}')
    assert result == '{"key": "value"}'


def test_clean_json_trailing_fence():
    from app.services.ai_service import _clean_json
    result = _clean_json('{"key": "value"}\n```')
    assert result == '{"key": "value"}'


def test_get_symbol():
    from app.services.ai_service import _get_symbol
    assert _get_symbol("USD") == "$"
    assert _get_symbol("EUR") == "\u20AC"
    assert _get_symbol("INR") == "\u20B9"
    assert _get_symbol("UNKNOWN") == "$"


@pytest.mark.parametrize("msg,expected_intent", [
    ("my income is 5000 monthly", "add_income"),
    ("spent 45 on lunch", "add_expense"),
    ("I want to invest 1000 monthly", "add_investment"),
    ("add 200 to my savings", "add_to_fund"),
    ("save 10000 for a car", "add_savings_goal"),
    ("set a 300 limit on food", "add_spending_rule"),
    ("change currency to eur", "change_currency"),
    ("what is my balance", "general"),
])
def test_process_agent_message_intents(msg, expected_intent):
    from app.services.ai_service import process_agent_message
    result = process_agent_message(msg)
    assert result["intent"] == expected_intent, f"Failed for: {msg}"


def test_process_agent_message_income_source():
    from app.services.ai_service import process_agent_message
    result = process_agent_message("salary is 60000 yearly")
    assert result["intent"] == "add_income"
    assert result["data"]["frequency"] == "yearly"
    assert result["data"]["source"] == "salary"


def test_process_agent_message_income_weekly():
    from app.services.ai_service import process_agent_message
    result = process_agent_message("I earn 2000 weekly")
    assert result["intent"] == "add_income"
    assert result["data"]["frequency"] == "weekly"


def test_process_agent_message_income_increment():
    from app.services.ai_service import process_agent_message
    result = process_agent_message("my salary got a raise of 5000 monthly")
    assert result["intent"] == "add_income"
    assert result["data"]["increment"] is True


def test_process_agent_message_subscription():
    from app.services.ai_service import process_agent_message
    result = process_agent_message("netflix subscription 15.99 monthly")
    assert result["intent"] == "add_expense"
    assert result["data"]["category"] == "Subscription"


def test_process_agent_message_expense_merchant():
    from app.services.ai_service import process_agent_message
    result = process_agent_message("paid 50 at walmart for groceries")
    assert result["intent"] == "add_expense"
    assert "walmart" in result["data"]["merchant"].lower()


def test_process_agent_message_fund_emergency():
    from app.services.ai_service import process_agent_message
    result = process_agent_message("add 500 to emergency fund")
    assert result["intent"] == "add_to_fund"
    assert result["data"]["name"] == "Emergency Fund"


def test_process_agent_message_fund_vacation():
    from app.services.ai_service import process_agent_message
    result = process_agent_message("put 300 in vacation fund")
    assert result["intent"] == "add_to_fund"
    assert result["data"]["name"] == "Vacation Fund"


def test_process_agent_message_k_suffix():
    from app.services.ai_service import process_agent_message
    result = process_agent_message("my income is 5k monthly")
    assert result["data"]["amount"] == 5000


def test_process_agent_message_m_suffix():
    from app.services.ai_service import process_agent_message
    result = process_agent_message("invest 1m in portfolio")
    amount = result["data"].get("amount") or result["data"].get("monthly_contribution") or result["data"].get("current_amount")
    assert amount == 1000000 or amount == 1000000.0
