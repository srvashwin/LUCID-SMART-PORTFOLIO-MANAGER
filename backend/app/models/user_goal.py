from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class UserGoal(Base):
    __tablename__ = "user_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    target_date = Column(Date, nullable=True)
    monthly_contribution = Column(Float, default=0.0)
    expected_return_rate = Column(Float, default=7.0)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
