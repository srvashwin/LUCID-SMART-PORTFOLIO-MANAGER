def test_create_account(client, auth_headers):
    r = client.post("/api/accounts", json={
        "name": "Checking",
        "type": "checking",
        "balance": 5000.0,
    }, headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    assert d["name"] == "Checking"
    assert d["balance"] == 5000.0
    assert d["type"] == "checking"


def test_list_accounts(client, auth_headers, db):
    from app.models.account import Account
    db.add(Account(user_id=1, name="Checking", type="checking", balance=5000.0))
    db.add(Account(user_id=1, name="Credit Card", type="credit_card", balance=-2000.0))
    db.commit()

    r = client.get("/api/accounts", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2


def test_net_worth_calculation(client, auth_headers, db):
    from app.models.account import Account
    db.add(Account(user_id=1, name="Checking", type="checking", balance=10000.0))
    db.add(Account(user_id=1, name="Savings", type="savings", balance=5000.0))
    db.add(Account(user_id=1, name="Credit Card", type="credit_card", balance=-3000.0))
    db.add(Account(user_id=1, name="Mortgage", type="loan", balance=-200000.0))
    db.commit()

    r = client.get("/api/accounts/net-worth", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["net_worth"] == -188000.0
    assert data["total_assets"] == 15000.0
    assert data["total_liabilities"] == 203000.0


def test_net_worth_history(client, auth_headers, db):
    from app.models.net_worth_snapshot import NetWorthSnapshot
    from datetime import date
    db.add(NetWorthSnapshot(user_id=1, total_assets=5000.0, total_liabilities=2000.0, net_worth=3000.0, snapshot_date=date(2026, 1, 1)))
    db.add(NetWorthSnapshot(user_id=1, total_assets=6000.0, total_liabilities=2000.0, net_worth=4000.0, snapshot_date=date(2026, 2, 1)))
    db.commit()

    r = client.get("/api/accounts/net-worth/history", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data["snapshots"]) == 2
    assert data["snapshots"][-1]["net_worth"] == 4000.0


def test_update_account(client, auth_headers, db):
    from app.models.account import Account
    a = Account(user_id=1, name="Checking", type="checking", balance=5000.0)
    db.add(a)
    db.commit()
    db.refresh(a)

    r = client.put(f"/api/accounts/{a.id}", json={
        "name": "Checking Updated",
        "type": "checking",
        "balance": 6000.0,
    }, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["balance"] == 6000.0
