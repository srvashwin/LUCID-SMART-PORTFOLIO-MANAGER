def test_create_holding(client, auth_headers):
    r = client.post("/api/holdings", json={
        "ticker": "AAPL",
        "shares": 10,
        "cost_basis": 150.0,
        "notes": "Test",
    }, headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    assert d["ticker"] == "AAPL"
    assert d["shares"] == 10
    assert d["cost_basis"] == 150.0


def test_list_holdings(client, auth_headers, db):
    from app.models.holding import Holding
    db.add(Holding(user_id=1, ticker="AAPL", shares=10, cost_basis=150.0))
    db.add(Holding(user_id=1, ticker="GOOGL", shares=5, cost_basis=200.0))
    db.commit()

    r = client.get("/api/holdings", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2


def test_update_holding(client, auth_headers, db):
    from app.models.holding import Holding
    h = Holding(user_id=1, ticker="AAPL", shares=10, cost_basis=150.0)
    db.add(h)
    db.commit()
    db.refresh(h)

    r = client.put(f"/api/holdings/{h.id}", json={
        "ticker": "AAPL",
        "shares": 15,
        "cost_basis": 155.0,
        "notes": "Updated",
    }, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["shares"] == 15
    assert r.json()["cost_basis"] == 155.0


def test_delete_holding(client, auth_headers, db):
    from app.models.holding import Holding
    h = Holding(user_id=1, ticker="AAPL", shares=10, cost_basis=150.0)
    db.add(h)
    db.commit()
    db.refresh(h)

    r = client.delete(f"/api/holdings/{h.id}", headers=auth_headers)
    assert r.status_code == 200

    r2 = client.get("/api/holdings", headers=auth_headers)
    assert len(r2.json()) == 0


def test_portfolio_fallback_on_unavailable(client, auth_headers, db):
    from app.models.holding import Holding
    h = Holding(user_id=1, ticker="ZZZZZ", shares=10, cost_basis=100.0)
    db.add(h)
    db.commit()

    r = client.get("/api/holdings/portfolio", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data["holdings"]) == 1
    holding = data["holdings"][0]
    assert holding["ticker"] == "ZZZZZ"
    assert holding["price_unavailable"] is True
    assert holding["current_price"] == 100.0
    assert holding["current_value"] == 1000.0
    assert holding["gain_loss"] == 0.0
