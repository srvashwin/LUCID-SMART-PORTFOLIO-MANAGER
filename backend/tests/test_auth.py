from datetime import datetime, timedelta
from jose import jwt
from app.config import settings
from app.utils import hash_password


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_signup(client, db):
    r = client.post("/api/auth/signup", json={
        "email": "new@example.com",
        "name": "New User",
        "password": "newpass123",
        "currency": "USD",
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" not in data
    assert data["email"] == "new@example.com"
    assert data["name"] == "New User"
    assert data["email_verified"] is False


def test_signup_duplicate_email(client, test_user):
    r = client.post("/api/auth/signup", json={
        "email": "test@example.com",
        "name": "Dup",
        "password": "pass123",
    })
    assert r.status_code == 400


def test_login(client, test_user):
    r = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123",
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    r = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpass",
    })
    assert r.status_code == 401


def test_login_nonexistent(client):
    r = client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "pass",
    })
    assert r.status_code == 401


def test_login_unverified(client, db):
    from app.models.user import User
    user = User(
        email="unverified@example.com", name="Unverified",
        password_hash=hash_password("pass123"), email_verified=False,
    )
    db.add(user)
    db.commit()

    r = client.post("/api/auth/login", json={
        "email": "unverified@example.com",
        "password": "pass123",
    })
    assert r.status_code == 403
    assert "not verified" in r.json()["detail"].lower()


def test_me_authenticated(client, auth_headers):
    r = client.get("/api/auth/me", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert data["currency"] == "USD"


def test_me_unauthenticated(client):
    r = client.get("/api/auth/me")
    assert r.status_code in (401, 403)


def test_forgot_password(client, test_user):
    r = client.post("/api/auth/forgot-password", json={
        "email": "test@example.com",
    })
    assert r.status_code == 200
    assert "sent" in r.json()["detail"].lower()


def test_forgot_password_nonexistent(client):
    r = client.post("/api/auth/forgot-password", json={
        "email": "nobody@example.com",
    })
    assert r.status_code in (200, 404)


def test_reset_password(client, db, test_user):
    token = jwt.encode(
        {"sub": str(test_user.id), "type": "reset", "exp": datetime.utcnow() + timedelta(hours=1)},
        settings.SECRET_KEY, algorithm=settings.ALGORITHM,
    )
    test_user.reset_token = token
    test_user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    r = client.post("/api/auth/reset-password", json={
        "token": token,
        "password": "newpassword456",
    })
    assert r.status_code == 200

    r2 = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "newpassword456",
    })
    assert r2.status_code == 200


def test_reset_password_expired_token(client, test_user):
    token = jwt.encode(
        {"sub": str(test_user.id), "type": "reset", "exp": datetime.utcnow() - timedelta(hours=2)},
        settings.SECRET_KEY, algorithm=settings.ALGORITHM,
    )
    r = client.post("/api/auth/reset-password", json={
        "token": token,
        "password": "newpassword456",
    })
    assert r.status_code == 400
