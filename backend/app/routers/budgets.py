from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.user import User
from app.models.budget import Budget, BudgetCategory
from app.models.income import Income
from app.models.expense import Expense
from app.models.category import Category
from app.schemas import BudgetCreate, BudgetUpdate, BudgetCategoryAssign, BudgetOut, BudgetCategoryOut
from app.utils import get_current_user
from app.deps import verify_household_access

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


def _compute_category_spent(db: Session, user_id: int, month: int, year: int, category: str, household_id: Optional[int] = None) -> float:
    filters = [
        Expense.user_id == user_id,
        Expense.category == category,
        extract("month", Expense.date) == month,
        extract("year", Expense.date) == year,
    ]
    if household_id is not None:
        filters.append(Expense.household_id == household_id)
    result = db.query(func.sum(Expense.amount)).filter(*filters).scalar() or 0.0
    return round(float(result), 2)


def _build_budget_out(budget: Budget, db: Session, user_id: int, household_id: Optional[int] = None) -> BudgetOut:
    cats = db.query(BudgetCategory).filter(BudgetCategory.budget_id == budget.id).all()
    categories_out = []
    total_spent = 0.0
    total_assigned = 0.0
    for bc in cats:
        spent = _compute_category_spent(db, user_id, budget.month, budget.year, bc.category, household_id)
        categories_out.append(BudgetCategoryOut(
            category=bc.category,
            assigned_amount=bc.assigned_amount,
            spent_amount=spent,
            remaining=round(bc.assigned_amount - spent, 2),
        ))
        total_spent += spent
        total_assigned += bc.assigned_amount
    return BudgetOut(
        id=budget.id,
        user_id=budget.user_id,
        month=budget.month,
        year=budget.year,
        total_income=budget.total_income,
        is_active=budget.is_active,
        categories=categories_out,
        total_assigned=round(total_assigned, 2),
        total_spent=round(total_spent, 2),
        total_remaining=round(budget.total_income - total_spent, 2),
        household_id=budget.household_id,
        created_at=budget.created_at,
        updated_at=budget.updated_at,
    )


@router.get("", response_model=List[BudgetOut])
def list_budgets(
    household_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Budget).filter(Budget.user_id == user.id)
    verify_household_access(household_id, user, db)
    if household_id is not None:
        query = query.filter(Budget.household_id == household_id)
    else:
        query = query.filter(Budget.household_id == None)
    budgets = query.order_by(Budget.year.desc(), Budget.month.desc()).all()
    return [_build_budget_out(b, db, user.id, household_id) for b in budgets]


@router.post("", response_model=BudgetOut)
def create_budget(data: BudgetCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    verify_household_access(data.household_id, user, db)
    existing_query = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.month == data.month,
        Budget.year == data.year,
    )
    if data.household_id is not None:
        existing_query = existing_query.filter(Budget.household_id == data.household_id)
    else:
        existing_query = existing_query.filter(Budget.household_id == None)
    existing = existing_query.first()
    if existing:
        raise HTTPException(status_code=409, detail="Budget already exists for this month")

    income_value = data.total_income
    if income_value == 0:
        income_query = db.query(Income).filter(Income.user_id == user.id)
        if data.household_id is not None:
            income_query = income_query.filter(Income.household_id == data.household_id)
        latest = income_query.order_by(Income.date.desc()).first()
        if latest:
            income_value = latest.amount

    budget = Budget(user_id=user.id, month=data.month, year=data.year, total_income=income_value, household_id=data.household_id)
    db.add(budget)
    db.flush()

    all_cats = db.query(Category).all()
    if not all_cats:
        default_cats = [
            "Food & Dining", "Transportation", "Shopping", "Bills & Utilities",
            "Entertainment", "Health & Fitness", "Education", "Housing",
            "Travel", "Groceries", "Personal Care", "Subscription", "Other",
        ]
        for cat_name in default_cats:
            bc = BudgetCategory(budget_id=budget.id, category=cat_name)
            db.add(bc)
    else:
        for cat in all_cats:
            bc = BudgetCategory(budget_id=budget.id, category=cat.name)
            db.add(bc)

    db.commit()
    db.refresh(budget)
    return _build_budget_out(budget, db, user.id, data.household_id)


@router.get("/current", response_model=BudgetOut)
def get_current_budget(
    household_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today = date.today()
    verify_household_access(household_id, user, db)
    query = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.month == today.month,
        Budget.year == today.year,
    )
    if household_id is not None:
        query = query.filter(Budget.household_id == household_id)
    else:
        query = query.filter(Budget.household_id == None)
    budget = query.first()

    if not budget:
        income_value = 0.0
        income_query = db.query(Income).filter(Income.user_id == user.id)
        if household_id is not None:
            income_query = income_query.filter(Income.household_id == household_id)
        latest = income_query.order_by(Income.date.desc()).first()
        if latest:
            income_value = latest.amount

        budget = Budget(user_id=user.id, month=today.month, year=today.year, total_income=income_value, household_id=household_id)
        db.add(budget)
        db.flush()

        all_cats = db.query(Category).all()
        if not all_cats:
            default_cats = [
                "Food & Dining", "Transportation", "Shopping", "Bills & Utilities",
                "Entertainment", "Health & Fitness", "Education", "Housing",
                "Travel", "Groceries", "Personal Care", "Other",
            ]
            for cat_name in default_cats:
                bc = BudgetCategory(budget_id=budget.id, category=cat_name)
                db.add(bc)
        else:
            for cat in all_cats:
                bc = BudgetCategory(budget_id=budget.id, category=cat.name)
                db.add(bc)

        db.commit()
        db.refresh(budget)

    return _build_budget_out(budget, db, user.id, household_id)


@router.get("/{budget_id}", response_model=BudgetOut)
def get_budget(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget or (budget.user_id != user.id and budget.household_id is not None):
        raise HTTPException(status_code=404, detail="Budget not found")
    verify_household_access(budget.household_id, user, db)
    return _build_budget_out(budget, db, user.id, budget.household_id)


@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(budget_id: int, data: BudgetUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget or budget.user_id != user.id:
        raise HTTPException(status_code=404, detail="Budget not found")
    verify_household_access(budget.household_id, user, db)
    if data.total_income is not None:
        budget.total_income = data.total_income
    if data.is_active is not None:
        budget.is_active = data.is_active
    db.commit()
    db.refresh(budget)
    return _build_budget_out(budget, db, user.id, budget.household_id)


@router.delete("/{budget_id}")
def delete_budget(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget or budget.user_id != user.id:
        raise HTTPException(status_code=404, detail="Budget not found")
    verify_household_access(budget.household_id, user, db)
    db.query(BudgetCategory).filter(BudgetCategory.budget_id == budget.id).delete()
    db.delete(budget)
    db.commit()
    return {"detail": "Budget deleted"}


@router.put("/{budget_id}/categories", response_model=BudgetOut)
def assign_categories(
    budget_id: int,
    data: List[BudgetCategoryAssign],
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget or budget.user_id != user.id:
        raise HTTPException(status_code=404, detail="Budget not found")
    verify_household_access(budget.household_id, user, db)

    existing = {bc.category: bc for bc in db.query(BudgetCategory).filter(BudgetCategory.budget_id == budget.id).all()}
    for item in data:
        if item.category in existing:
            existing[item.category].assigned_amount = item.assigned_amount
        else:
            bc = BudgetCategory(budget_id=budget.id, category=item.category, assigned_amount=item.assigned_amount)
            db.add(bc)
    db.commit()
    db.refresh(budget)
    return _build_budget_out(budget, db, user.id, budget.household_id)
