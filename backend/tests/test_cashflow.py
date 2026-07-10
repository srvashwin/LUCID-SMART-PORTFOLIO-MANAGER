from datetime import date, timedelta


def test_forecast_empty(client, auth_headers):
    r = client.get("/api/cashflow/forecast?days=30", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "daily_projections" in data
    assert data["starting_balance"] == 0.0
    assert data["ending_balance"] == 0.0


def test_forecast_with_income_and_expenses(client, auth_headers, db):
    from app.models.income import Income
    from app.models.expense import Expense
    from app.models.account import Account

    today = date.today()

    db.add(Account(user_id=1, name="Checking", type="checking", balance=1000.0))
    db.add(Income(user_id=1, amount=500.0, source="Salary", date=today))
    db.add(Expense(user_id=1, amount=50.0, category="Food", date=today, description="a"))
    db.add(Expense(user_id=1, amount=30.0, category="Transport", date=today, description="b"))
    db.commit()

    r = client.get("/api/cashflow/forecast?days=30", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["starting_balance"] is not None
    assert len(data["daily_projections"]) <= 31


def test_forecast_with_recurring(client, auth_headers, db):
    from app.models.account import Account
    from app.models.recurring import RecurringTransaction
    from app.models.income import Income
    from datetime import date

    db.add(Account(user_id=1, name="Checking", type="checking", balance=2000.0))
    db.add(Income(user_id=1, amount=5000.0, source="Salary", date=date.today()))
    db.add(RecurringTransaction(
        user_id=1, type="expense", amount=100.0, category="Subscription",
        description="Netflix", merchant="Netflix", frequency="monthly",
        interval_days=30, next_date=date.today() + timedelta(days=5),
        is_active=True,
    ))
    db.commit()

    r = client.get("/api/cashflow/forecast?days=60", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data["daily_projections"]) > 0
