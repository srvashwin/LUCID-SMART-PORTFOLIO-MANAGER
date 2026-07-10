from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    balance = Column(Float, default=0.0)
    institution = Column(String, default="")
    household_id = Column(Integer, ForeignKey("households.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
