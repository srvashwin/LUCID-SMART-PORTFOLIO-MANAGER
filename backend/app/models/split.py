from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
