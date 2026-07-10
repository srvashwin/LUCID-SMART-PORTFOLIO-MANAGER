from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base
from typing import Optional


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)
    currency = Column(String, default="USD", nullable=False)
    is_active = Column(Boolean, default=True)

    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True)
    email_verification_token_expires = Column(DateTime(timezone=True), nullable=True)

    google_id = Column(String, nullable=True, unique=True)
    avatar_url = Column(String, nullable=True)

    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
