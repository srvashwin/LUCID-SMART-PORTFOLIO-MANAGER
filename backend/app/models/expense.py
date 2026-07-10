from sqlalchemy import Column, Integer, Float, String, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, default="")
    merchant = Column(String, default="")
    use_case = Column(Text, default="")
    raw_chat_input = Column(Text, default="")
    source = Column(String, default="manual")
    import_batch_id = Column(Integer, ForeignKey("import_batches.id"), nullable=True, index=True)
    dedupe_hash = Column(String, default="", index=True)
    date = Column(Date, nullable=False)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=True)

    tax_deductible = Column(Boolean, default=False)
    tax_category = Column(String, nullable=True)
    receipt_filename = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def receipt_url(self):
        if self.receipt_filename:
            return f"/api/expenses/{self.id}/receipt"
        return None
