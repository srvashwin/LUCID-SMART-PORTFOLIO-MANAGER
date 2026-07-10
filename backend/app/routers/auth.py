import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.schemas import UserCreate, UserLogin, UserOut, UserUpdate, Token, ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest, GoogleLoginRequest, ResendVerificationRequest
from app.utils import hash_password, verify_password, create_access_token, get_current_user
from app.services.email import send_password_reset, send_verification_email
from app.config import settings

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
        email_verified=False,
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
    db.refresh(user)

    # Send verification email
    token = secrets.token_urlsafe(32)
    user.email_verification_token = token
    user.email_verification_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    send_verification_email(email=user.email, name=user.name, verification_url=verification_url)

    return user


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    token = create_access_token({"sub": user.id})
    return Token(access_token=token)


@router.post("/verify-email", response_model=Token)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_verification_token == data.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    if user.email_verification_token_expires and user.email_verification_token_expires < datetime.utcnow():
        user.email_verification_token = None
        user.email_verification_token_expires = None
        db.commit()
        raise HTTPException(status_code=400, detail="Verification link has expired. Request a new one.")

    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_token_expires = None
    db.commit()

    token = create_access_token({"sub": user.id})
    return Token(access_token=token)


@router.post("/resend-verification")
def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"detail": "If that email is registered, a verification link has been sent."}
    if user.email_verified:
        return {"detail": "Email is already verified. You can sign in."}

    token = secrets.token_urlsafe(32)
    user.email_verification_token = token
    user.email_verification_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    send_verification_email(email=user.email, name=user.name, verification_url=verification_url)

    return {"detail": "If that email is registered, a verification link has been sent."}


@router.post("/google", response_model=Token)
def google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    try:
        info = google_id_token.verify_oauth2_token(
            data.id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {e}")

    google_id = info.get("sub")
    email = info.get("email", "")
    name = info.get("name", "")
    avatar_url = info.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # Check by google_id
    user = db.query(User).filter(User.google_id == google_id).first()
    if user:
        token = create_access_token({"sub": user.id})
        return Token(access_token=token)

    # Check by email
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.google_id = google_id
        user.email_verified = True
        if avatar_url:
            user.avatar_url = avatar_url
        db.commit()
        token = create_access_token({"sub": user.id})
        return Token(access_token=token)

    # Create new user
    user = User(
        email=email,
        name=name,
        google_id=google_id,
        avatar_url=avatar_url,
        email_verified=True,
        currency="USD",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed default categories
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
    if not user:
        return {"detail": "If that email is registered, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
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
