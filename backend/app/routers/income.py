from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.user import User
from app.models.income import Income
from app.schemas import IncomeCreate, IncomeUpdate, IncomeOut
from app.utils import get_current_user
from app.deps import verify_household_access
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/api/income", tags=["income"])


@router.post("", response_model=IncomeOut)
def create_income(data: IncomeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    verify_household_access(data.household_id, user, db)
    income = Income(user_id=user.id, **data.model_dump())
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


@router.get("")
def list_incomes(
    household_id: Optional[int] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Income).filter(Income.user_id == user.id)
    verify_household_access(household_id, user, db)
    if household_id is not None:
        query = query.filter(Income.household_id == household_id)
    else:
        query = query.filter(Income.household_id == None)
    return paginate(query.order_by(Income.date.desc()), params.offset, params.limit)


@router.get("/latest", response_model=IncomeOut)
def latest_income(
    household_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Income).filter(Income.user_id == user.id)
    verify_household_access(household_id, user, db)
    if household_id is not None:
        query = query.filter(Income.household_id == household_id)
    else:
        query = query.filter(Income.household_id == None)
    income = query.order_by(Income.date.desc()).first()
    if not income:
        raise HTTPException(status_code=404, detail="No income found")
    return income


@router.patch("/{income_id}", response_model=IncomeOut)
def update_income(income_id: int, data: IncomeUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == user.id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(income, field, value)
    db.commit()
    db.refresh(income)
    return income


@router.delete("/{income_id}")
def delete_income(income_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    income = db.query(Income).filter(Income.id == income_id, Income.user_id == user.id).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    db.delete(income)
    db.commit()
    return {"detail": "Income deleted"}
