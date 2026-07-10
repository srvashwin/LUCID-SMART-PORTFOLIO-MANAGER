import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date, timedelta

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.split import ExpenseSplit
from app.models.category import Category
from app.models.spending_rule import SpendingRule
from app.schemas import ExpenseCreate, ExpenseUpdate, ExpenseChat, ExpenseOut, ExpenseSplitCreate, ExpenseSplitOut
from app.utils import get_current_user
from app.deps import verify_household_access
from app.services.ai_service import classify_expense
from app.config import settings
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.post("/chat", response_model=ExpenseOut)
def chat_expense(data: ExpenseChat, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    verify_household_access(data.household_id, user, db)
    result = classify_expense(data.message, data.use_case)

    expense = Expense(
        user_id=user.id,
        amount=result["amount"],
        category=result["category"],
        description=result.get("description", ""),
        merchant=result.get("merchant", ""),
        use_case=data.use_case or result.get("use_case", ""),
        raw_chat_input=data.message,
        source="ai_chat",
        date=date.today(),
        household_id=data.household_id,
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
    verify_household_access(data.household_id, user, db)
    expense = Expense(user_id=user.id, **data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.patch("/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: int, data: ExpenseUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("")
def list_expenses(
    category: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    tax_deductible: Optional[bool] = None,
    household_id: Optional[int] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Expense).filter(Expense.user_id == user.id)
    verify_household_access(household_id, user, db)
    if household_id is not None:
        query = query.filter(Expense.household_id == household_id)
    else:
        query = query.filter(Expense.household_id == None)
    if category:
        query = query.filter(Expense.category == category)
    if month:
        query = query.filter(extract("month", Expense.date) == month)
    if year:
        query = query.filter(extract("year", Expense.date) == year)
    if tax_deductible is not None:
        query = query.filter(Expense.tax_deductible == tax_deductible)
    return paginate(query.order_by(Expense.date.desc()), params.offset, params.limit)


@router.get("/stats")
def expense_stats(
    household_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    verify_household_access(household_id, user, db)
    now = date.today()
    this_month_start = now.replace(day=1)
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    base_filter = [Expense.user_id == user.id]
    if household_id is not None:
        base_filter.append(Expense.household_id == household_id)
    else:
        base_filter.append(Expense.household_id == None)

    this_month_total = db.query(func.sum(Expense.amount)).filter(
        *base_filter,
        Expense.date >= this_month_start,
    ).scalar() or 0

    last_month_total = db.query(func.sum(Expense.amount)).filter(
        *base_filter,
        Expense.date >= last_month_start,
        Expense.date <= last_month_end,
    ).scalar() or 0

    category_breakdown = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count"),
    ).filter(
        *base_filter,
        Expense.date >= this_month_start,
    ).group_by(Expense.category).all()

    monthly_trend = db.query(
        extract("year", Expense.date).label("year"),
        extract("month", Expense.date).label("month"),
        func.sum(Expense.amount).label("total"),
    ).filter(
        *base_filter,
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


@router.get("/tax-summary")
def tax_summary(
    year: Optional[int] = None,
    household_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    verify_household_access(household_id, user, db)
    yr = year or date.today().year
    base_filter = [
        Expense.user_id == user.id,
        Expense.tax_deductible == True,
        extract("year", Expense.date) == yr,
    ]
    if household_id is not None:
        base_filter.append(Expense.household_id == household_id)
    else:
        base_filter.append(Expense.household_id == None)

    total_deductible = db.query(func.sum(Expense.amount)).filter(*base_filter).scalar() or 0

    by_category = db.query(
        Expense.tax_category,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count"),
    ).filter(*base_filter).group_by(Expense.tax_category).all()

    return {
        "year": yr,
        "total_deductible": round(total_deductible, 2),
        "by_category": [
            {"category": c.tax_category or "Uncategorized", "total": round(c.total, 2), "count": c.count}
            for c in by_category
        ],
    }


@router.post("/{expense_id}/receipt")
def upload_receipt(expense_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    upload_dir = os.path.join("uploads", str(user.id))
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "receipt")[1]
    filename = f"receipt_{expense_id}{ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    expense.receipt_filename = filename
    db.commit()
    db.refresh(expense)
    return {"receipt_url": expense.receipt_url}


@router.get("/{expense_id}/receipt")
def get_receipt(expense_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    if not expense or not expense.receipt_filename:
        raise HTTPException(status_code=404, detail="Receipt not found")

    filepath = os.path.join("uploads", str(user.id), expense.receipt_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Receipt file not found")

    from fastapi.responses import FileResponse
    return FileResponse(filepath, media_type="image/jpeg", filename=expense.receipt_filename)


@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return [c.name for c in cats]


# Split transaction endpoints

@router.post("/{expense_id}/splits", response_model=ExpenseSplitOut)
def create_split(expense_id: int, data: ExpenseSplitCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    split = ExpenseSplit(expense_id=expense_id, user_id=user.id, **data.model_dump())
    db.add(split)
    db.commit()
    db.refresh(split)
    return split


@router.get("/{expense_id}/splits", response_model=List[ExpenseSplitOut])
def list_splits(expense_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == expense_id).all()


@router.delete("/splits/{split_id}")
def delete_split(split_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    split = db.query(ExpenseSplit).filter(ExpenseSplit.id == split_id, ExpenseSplit.user_id == user.id).first()
    if not split:
        raise HTTPException(status_code=404, detail="Split not found")
    db.delete(split)
    db.commit()
    return {"detail": "Split deleted"}
