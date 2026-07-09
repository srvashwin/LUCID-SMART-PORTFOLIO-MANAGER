from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.schemas import UserCreate, UserLogin, UserOut, UserUpdate, Token
from app.utils import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
        currency=data.currency,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed default categories for new user
    default_categories = [
        "Food & Dining", "Transportation", "Shopping", "Bills & Utilities",
        "Entertainment", "Health & Fitness", "Education", "Housing",
        "Travel", "Groceries", "Personal Care", "Other",
    ]
    for cat_name in default_categories:
        existing_cat = db.query(Category).filter(Category.name == cat_name).first()
        if not existing_cat:
            db.add(Category(name=cat_name))
    db.commit()

    return user


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.id})
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(data: UserUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if data.name is not None:
        user.name = data.name
    if data.currency is not None:
        user.currency = data.currency
    db.commit()
    db.refresh(user)
    return user
