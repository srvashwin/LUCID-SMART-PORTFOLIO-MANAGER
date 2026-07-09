from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    filename = Column(String, nullable=False)
    bank_name = Column(String, default="")
    row_count = Column(Integer, default=0)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
