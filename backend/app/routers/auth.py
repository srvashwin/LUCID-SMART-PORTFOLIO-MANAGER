import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.schemas import UserCreate, UserLogin, UserOut, UserUpdate, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.utils import hash_password, verify_password, create_access_token, get_current_user
from app.services.email import send_password_reset

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


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    # Always return success to prevent email enumeration
    if not user:
        return {"detail": "If that email is registered, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    reset_url = f"http://localhost:5173/reset-password?token={token}"
    send_password_reset(email=user.email, name=user.name, reset_url=reset_url)

    return {"detail": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == data.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user.password_hash = hash_password(data.password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"detail": "Password has been reset successfully."}
