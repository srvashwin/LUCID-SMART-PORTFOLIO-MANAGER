from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.fund import Fund
from app.schemas import FundCreate, FundOut
from app.utils import get_current_user

router = APIRouter(prefix="/api/funds", tags=["funds"])


@router.get("", response_model=List[FundOut])
def list_funds(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Fund).filter(Fund.user_id == user.id).order_by(Fund.created_at.desc()).all()


@router.post("", response_model=FundOut)
def create_fund(data: FundCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fund = Fund(
        user_id=user.id,
        name=data.name,
        type=data.type,
        current_amount=data.current_amount,
        monthly_contribution=data.monthly_contribution,
        goal_id=data.goal_id,
    )
    db.add(fund)
    db.commit()
    db.refresh(fund)
    return fund


@router.put("/{fund_id}", response_model=FundOut)
def update_fund(fund_id: int, data: FundCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fund = db.query(Fund).filter(Fund.id == fund_id, Fund.user_id == user.id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    for key, val in data.model_dump().items():
        setattr(fund, key, val)
    db.commit()
    db.refresh(fund)
    return fund


@router.delete("/{fund_id}")
def delete_fund(fund_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fund = db.query(Fund).filter(Fund.id == fund_id, Fund.user_id == user.id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    db.delete(fund)
    db.commit()
    return {"detail": "Fund deleted"}
