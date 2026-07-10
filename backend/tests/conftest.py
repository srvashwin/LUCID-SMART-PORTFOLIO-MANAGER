import os
os.environ["TESTING"] = "1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from typing import Generator

from app.database import Base, get_db
from app.main import app
from app.utils import create_access_token, hash_password
from app.models.user import User

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client() -> Generator:
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db():
    session = TestSession()
    yield session
    session.close()


@pytest.fixture
def test_user(db) -> User:
    user = User(
        email="test@example.com",
        name="Test User",
        password_hash=hash_password("testpass123"),
        currency="USD",
        email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def token(test_user) -> str:
    return create_access_token({"sub": test_user.id})


@pytest.fixture
def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

