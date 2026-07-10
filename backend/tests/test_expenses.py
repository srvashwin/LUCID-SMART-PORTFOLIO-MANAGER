def test_create_expense(client, auth_headers):
    r = client.post("/api/expenses", json={
        "amount": 29.99,
        "category": "Food & Dining",
        "description": "Lunch",
        "merchant": "Cafe",
        "date": "2026-07-10",
    }, headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    assert d["amount"] == 29.99
    assert d["category"] == "Food & Dining"
    assert d["merchant"] == "Cafe"
    assert d["user_id"] is not None


def test_list_expenses(client, auth_headers, db):
    from app.models.expense import Expense
    from datetime import date
    db.add(Expense(user_id=1, amount=10.0, category="Food", date=date(2026, 7, 1), description="a"))
    db.add(Expense(user_id=1, amount=20.0, category="Transport", date=date(2026, 7, 5), description="b"))
    db.commit()

    r = client.get("/api/expenses", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2


def test_list_expenses_filter_category(client, auth_headers, db):
    from app.models.expense import Expense
    from datetime import date
    db.add(Expense(user_id=1, amount=10.0, category="Food", date=date(2026, 7, 1), description="a"))
    db.add(Expense(user_id=1, amount=20.0, category="Transport", date=date(2026, 7, 5), description="b"))
    db.commit()

    r = client.get("/api/expenses?category=Food", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["category"] == "Food"


def test_update_expense(client, auth_headers, db):
    from app.models.expense import Expense
    from datetime import date
    exp = Expense(user_id=1, amount=10.0, category="Food", date=date(2026, 7, 1), description="a")
    db.add(exp)
    db.commit()
    db.refresh(exp)

    r = client.patch(f"/api/expenses/{exp.id}", json={
        "amount": 15.0,
        "description": "Updated",
    }, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["amount"] == 15.0
    assert r.json()["description"] == "Updated"


def test_update_expense_not_found(client, auth_headers):
    r = client.patch("/api/expenses/99999", json={"amount": 5.0}, headers=auth_headers)
    assert r.status_code == 404


def test_expense_stats(client, auth_headers, db):
    from app.models.expense import Expense
    from datetime import date
    today = date.today()
    db.add(Expense(user_id=1, amount=50.0, category="Food", date=today, description="a"))
    db.add(Expense(user_id=1, amount=30.0, category="Transport", date=today, description="b"))
    db.commit()

    r = client.get("/api/expenses/stats", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["this_month_total"] == 80.0
    assert len(data["category_breakdown"]) == 2


def test_expense_tax_summary(client, auth_headers, db):
    from app.models.expense import Expense
    from datetime import date
    db.add(Expense(user_id=1, amount=100.0, category="Medical", date=date(2026, 7, 1),
                   description="a", tax_deductible=True, tax_category="Medical"))
    db.add(Expense(user_id=1, amount=50.0, category="Food", date=date(2026, 7, 1),
                   description="b", tax_deductible=False))
    db.commit()

    r = client.get("/api/expenses/tax-summary?year=2026", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total_deductible"] == 100.0
    assert len(data["by_category"]) == 1


def test_create_split(client, auth_headers, db):
    from app.models.expense import Expense
    from datetime import date
    exp = Expense(user_id=1, amount=30.0, category="Food", date=date(2026, 7, 1), description="a")
    db.add(exp)
    db.commit()
    db.refresh(exp)

    r = client.post(f"/api/expenses/{exp.id}/splits", json={
        "amount": 15.0,
        "category": "Groceries",
        "notes": "half",
    }, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["amount"] == 15.0


def test_list_splits(client, auth_headers, db):
    from app.models.expense import Expense
    from app.models.split import ExpenseSplit
    from datetime import date
    exp = Expense(user_id=1, amount=30.0, category="Food", date=date(2026, 7, 1), description="a")
    db.add(exp)
    db.commit()
    db.refresh(exp)
    split = ExpenseSplit(expense_id=exp.id, user_id=1, amount=15.0, category="Groceries")
    db.add(split)
    db.commit()

    r = client.get(f"/api/expenses/{exp.id}/splits", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_delete_split(client, auth_headers, db):
    from app.models.expense import Expense
    from app.models.split import ExpenseSplit
    from datetime import date
    exp = Expense(user_id=1, amount=30.0, category="Food", date=date(2026, 7, 1), description="a")
    db.add(exp)
    db.commit()
    db.refresh(exp)
    split = ExpenseSplit(expense_id=exp.id, user_id=1, amount=15.0, category="Groceries")
    db.add(split)
    db.commit()
    db.refresh(split)

    r = client.delete(f"/api/expenses/splits/{split.id}", headers=auth_headers)
    assert r.status_code == 200
