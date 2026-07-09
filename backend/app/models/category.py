from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    icon = Column(String, default="")
    is_user_defined = Column(Boolean, default=False)
