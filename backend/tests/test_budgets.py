from datetime import date


def test_create_budget(client, auth_headers):
    r = client.post("/api/budgets", json={"month": 7, "year": 2026}, headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    assert d["month"] == 7
    assert d["year"] == 2026
    assert d["total_income"] == 0.0
    assert len(d["categories"]) > 0
    assert d["categories"][0]["assigned_amount"] == 0.0


def test_create_budget_conflict(client, auth_headers):
    client.post("/api/budgets", json={"month": 8, "year": 2026}, headers=auth_headers)
    r = client.post("/api/budgets", json={"month": 8, "year": 2026}, headers=auth_headers)
    assert r.status_code == 409
    assert "already exists" in r.json()["detail"].lower()


def test_list_budgets(client, auth_headers):
    client.post("/api/budgets", json={"month": 7, "year": 2026}, headers=auth_headers)
    r = client.get("/api/budgets", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    assert "items" in d
    assert len(d["items"]) >= 1
    assert d["total"] >= 1


def test_get_budget_by_id(client, auth_headers):
    create = client.post("/api/budgets", json={"month": 9, "year": 2026}, headers=auth_headers)
    bid = create.json()["id"]
    r = client.get(f"/api/budgets/{bid}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["id"] == bid
    assert r.json()["month"] == 9


def test_get_budget_not_found(client, auth_headers):
    r = client.get("/api/budgets/9999", headers=auth_headers)
    assert r.status_code == 404


def test_get_current_budget(client, auth_headers):
    r = client.get("/api/budgets/current", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    today = date.today()
    assert d["month"] == today.month
    assert d["year"] == today.year


def test_update_budget_total_income(client, auth_headers):
    create = client.post("/api/budgets", json={"month": 10, "year": 2026}, headers=auth_headers)
    bid = create.json()["id"]
    r = client.put(f"/api/budgets/{bid}", json={"total_income": 7500}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["total_income"] == 7500.0


def test_update_budget_deactivate(client, auth_headers):
    create = client.post("/api/budgets", json={"month": 11, "year": 2026}, headers=auth_headers)
    bid = create.json()["id"]
    assert create.json()["is_active"] is True
    r = client.put(f"/api/budgets/{bid}", json={"is_active": False}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["is_active"] is False


def test_delete_budget(client, auth_headers, db):
    create = client.post("/api/budgets", json={"month": 12, "year": 2026}, headers=auth_headers)
    bid = create.json()["id"]
    r = client.delete(f"/api/budgets/{bid}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["detail"] == "Budget deleted"
    get_r = client.get(f"/api/budgets/{bid}", headers=auth_headers)
    assert get_r.status_code == 404


def test_assign_categories(client, auth_headers):
    create = client.post("/api/budgets", json={"month": 1, "year": 2027}, headers=auth_headers)
    bid = create.json()["id"]
    r = client.put(
        f"/api/budgets/{bid}/categories",
        json=[{"category": "Food & Dining", "assigned_amount": 500}],
        headers=auth_headers,
    )
    assert r.status_code == 200
    cats = r.json()["categories"]
    food = next(c for c in cats if c["category"] == "Food & Dining")
    assert food["assigned_amount"] == 500.0


def test_assign_categories_new_category(client, auth_headers):
    create = client.post("/api/budgets", json={"month": 2, "year": 2027}, headers=auth_headers)
    bid = create.json()["id"]
    r = client.put(
        f"/api/budgets/{bid}/categories",
        json=[{"category": "Custom Cat", "assigned_amount": 300}],
        headers=auth_headers,
    )
    assert r.status_code == 200
    cats = r.json()["categories"]
    custom = next(c for c in cats if c["category"] == "Custom Cat")
    assert custom["assigned_amount"] == 300.0
    assert custom["remaining"] == 300.0


def test_budget_helpers_directly(client, auth_headers, db, test_user):
    from app.routers.budgets import _compute_category_spent, _build_budget_out
    from app.models.budget import Budget, BudgetCategory
    from app.models.expense import Expense
    budget = Budget(user_id=test_user.id, month=6, year=2026, total_income=3000)
    db.add(budget)
    db.flush()
    bc = BudgetCategory(budget_id=budget.id, category="TestCat")
    db.add(bc)
    expense = Expense(user_id=test_user.id, amount=150, category="TestCat", date=date(2026, 6, 15))
    db.add(expense)
    db.commit()
    spent = _compute_category_spent(db, test_user.id, 6, 2026, "TestCat")
    assert spent == 150.0
    out = _build_budget_out(budget, db, test_user.id)
    assert out.total_income == 3000.0
    assert len(out.categories) == 1
    assert out.categories[0].spent_amount == 150.0
    assert out.categories[0].remaining == -150.0
