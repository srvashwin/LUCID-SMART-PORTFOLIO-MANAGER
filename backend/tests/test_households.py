def test_create_household(client, auth_headers):
    r = client.post("/api/households", json={
        "name": "Family",
    }, headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    assert d["household"]["name"] == "Family"
    assert "invite_code" in d["household"]


def test_list_households(client, auth_headers, db):
    from app.models.household import Household, HouseholdMember
    h = Household(name="Family", created_by=1)
    db.add(h)
    db.commit()
    db.refresh(h)
    db.add(HouseholdMember(household_id=h.id, user_id=1, role="owner"))
    db.commit()

    r = client.get("/api/households", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["name"] == "Family"


def test_join_household_by_invite(client, auth_headers, db):
    from app.models.household import Household, HouseholdMember
    from app.models.user import User
    from app.utils import hash_password

    owner = User(email="owner@example.com", name="Owner", password_hash=hash_password("pass"), email_verified=True)
    db.add(owner)
    db.commit()
    db.refresh(owner)

    h = Household(name="Family", created_by=owner.id, invite_code="SECRET123")
    db.add(h)
    db.commit()
    db.refresh(h)
    db.add(HouseholdMember(household_id=h.id, user_id=owner.id, role="owner"))
    db.commit()

    r = client.post("/api/households/join", json={
        "invite_code": "SECRET123",
    }, headers=auth_headers)
    assert r.status_code == 200


def test_leave_household(client, auth_headers, db):
    from app.models.household import Household, HouseholdMember
    h = Household(name="Family", created_by=1, invite_code="CODE")
    db.add(h)
    db.commit()
    db.refresh(h)
    db.add(HouseholdMember(household_id=h.id, user_id=1, role="member"))
    db.commit()

    r = client.post(f"/api/households/{h.id}/leave", headers=auth_headers)
    assert r.status_code == 200


def test_household_data_isolation(client, auth_headers, db):
    from app.models.expense import Expense
    from app.models.household import Household, HouseholdMember
    from datetime import date

    h = Household(name="Family", created_by=1, invite_code="CODE")
    db.add(h)
    db.commit()
    db.refresh(h)
    db.add(HouseholdMember(household_id=h.id, user_id=1, role="member"))
    db.commit()

    db.add(Expense(user_id=1, amount=10.0, category="Food", date=date(2026, 7, 1),
                   description="personal", household_id=None))
    db.add(Expense(user_id=1, amount=20.0, category="Food", date=date(2026, 7, 1),
                   description="household", household_id=h.id))
    db.commit()

    r = client.get("/api/expenses?household_id=" + str(h.id), headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert r.json()["items"][0]["description"] == "household"

    r2 = client.get("/api/expenses", headers=auth_headers)
    assert r2.json()["total"] == 1
    assert r2.json()["items"][0]["description"] == "personal"


def test_household_forbidden_without_membership(client, auth_headers, db):
    from app.models.household import Household, HouseholdMember
    from app.models.user import User
    from app.utils import hash_password

    owner = User(email="owner2@example.com", name="Owner", password_hash=hash_password("pass"), email_verified=True)
    db.add(owner)
    db.commit()
    db.refresh(owner)

    h = Household(name="Other", created_by=owner.id, invite_code="OTHER")
    db.add(h)
    db.commit()
    db.refresh(h)
    db.add(HouseholdMember(household_id=h.id, user_id=owner.id, role="owner"))
    db.commit()

    r = client.get("/api/expenses?household_id=" + str(h.id), headers=auth_headers)
    assert r.status_code == 403
