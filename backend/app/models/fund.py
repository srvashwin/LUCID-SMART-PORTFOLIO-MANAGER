from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Fund(Base):
    __tablename__ = "funds"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, default="savings")
    current_amount = Column(Float, default=0.0)
    monthly_contribution = Column(Float, default=0.0)
    goal_id = Column(Integer, ForeignKey("user_goals.id"), nullable=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
