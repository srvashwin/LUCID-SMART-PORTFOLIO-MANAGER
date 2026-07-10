from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    invite_code = Column(String, unique=True, index=True, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class HouseholdMember(Base):
    __tablename__ = "household_members"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False, default="member")
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
