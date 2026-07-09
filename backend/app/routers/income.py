from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.database import get_db
from app.models.user import User
from app.models.income import Income
from app.schemas import IncomeCreate, IncomeOut
from app.utils import get_current_user

router = APIRouter(prefix="/api/income", tags=["income"])


@router.post("", response_model=IncomeOut)
def create_income(data: IncomeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    income = Income(user_id=user.id, **data.model_dump())
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


@router.get("", response_model=List[IncomeOut])
def list_incomes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Income).filter(Income.user_id == user.id).order_by(Income.date.desc()).all()


@router.get("/latest", response_model=IncomeOut)
def latest_income(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    income = db.query(Income).filter(Income.user_id == user.id).order_by(Income.date.desc()).first()
    if not income:
        raise HTTPException(status_code=404, detail="No income found")
    return income
