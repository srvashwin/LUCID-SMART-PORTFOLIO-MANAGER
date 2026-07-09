from sqlalchemy import Column, Integer, Float, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False, default="expense")
    amount = Column(Float, nullable=False)
    category = Column(String, default="Other")
    description = Column(String, default="")
    merchant = Column(String, default="")
    frequency = Column(String, nullable=False)
    interval_days = Column(Integer, nullable=True)
    next_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
