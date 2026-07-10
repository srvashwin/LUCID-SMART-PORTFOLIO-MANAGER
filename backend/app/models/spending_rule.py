from sqlalchemy import Column, Integer, Float, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class SpendingRule(Base):
    __tablename__ = "spending_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False)
    max_amount = Column(Float, nullable=False)
    period = Column(String, nullable=False, default="monthly")
    is_active = Column(Boolean, default=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
