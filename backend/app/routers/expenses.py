from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date, timedelta

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.category import Category
from app.models.spending_rule import SpendingRule
from app.schemas import ExpenseCreate, ExpenseChat, ExpenseOut
from app.utils import get_current_user
from app.services.ai_service import classify_expense

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.post("/chat", response_model=ExpenseOut)
def chat_expense(data: ExpenseChat, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    result = classify_expense(data.message, data.use_case)

    expense = Expense(
        user_id=user.id,
        amount=result["amount"],
        category=result["category"],
        description=result.get("description", ""),
        merchant=result.get("merchant", ""),
        use_case=data.use_case or result.get("use_case", ""),
        raw_chat_input=data.message,
        date=date.today(),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    # Check spending rules
    rules = db.query(SpendingRule).filter(
        SpendingRule.user_id == user.id,
        SpendingRule.category == expense.category,
        SpendingRule.is_active == True,
    ).all()

    for rule in rules:
        if rule.period == "monthly":
            start_of_month = date.today().replace(day=1)
            spent = db.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user.id,
                Expense.category == expense.category,
                Expense.date >= start_of_month,
            ).scalar() or 0
            if spent > rule.max_amount:
                expense.description += f" [ALERT: Exceeded monthly {rule.category} limit of ${rule.max_amount:.2f}]"
                db.commit()
                db.refresh(expense)

    return expense


@router.post("", response_model=ExpenseOut)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    expense = Expense(user_id=user.id, **data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("", response_model=List[ExpenseOut])
def list_expenses(
    category: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Expense).filter(Expense.user_id == user.id)
    if category:
        query = query.filter(Expense.category == category)
    if month:
        query = query.filter(extract("month", Expense.date) == month)
    if year:
        query = query.filter(extract("year", Expense.date) == year)
    return query.order_by(Expense.date.desc()).all()


@router.get("/stats")
def expense_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    now = date.today()
    this_month_start = now.replace(day=1)
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    # Monthly totals
    this_month_total = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user.id,
        Expense.date >= this_month_start,
    ).scalar() or 0

    last_month_total = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user.id,
        Expense.date >= last_month_start,
        Expense.date <= last_month_end,
    ).scalar() or 0

    # Category breakdown this month
    category_breakdown = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count"),
    ).filter(
        Expense.user_id == user.id,
        Expense.date >= this_month_start,
    ).group_by(Expense.category).all()

    # Monthly trend (last 12 months)
    monthly_trend = db.query(
        extract("year", Expense.date).label("year"),
        extract("month", Expense.date).label("month"),
        func.sum(Expense.amount).label("total"),
    ).filter(
        Expense.user_id == user.id,
        Expense.date >= date(now.year - 1, now.month, 1),
    ).group_by(
        extract("year", Expense.date),
        extract("month", Expense.date),
    ).order_by(
        extract("year", Expense.date),
        extract("month", Expense.date),
    ).all()

    return {
        "this_month_total": round(this_month_total, 2),
        "last_month_total": round(last_month_total, 2),
        "category_breakdown": [
            {"category": c.category, "total": round(c.total, 2), "count": c.count}
            for c in category_breakdown
        ],
        "monthly_trend": [
            {"year": int(t.year), "month": int(t.month), "total": round(t.total, 2)}
            for t in monthly_trend
        ],
    }


@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return [c.name for c in cats]
