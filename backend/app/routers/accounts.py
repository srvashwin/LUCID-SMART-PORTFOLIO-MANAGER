from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.account import Account
from app.schemas import AccountCreate, AccountOut, NetWorthResponse
from app.utils import get_current_user

router = APIRouter(prefix="/api/accounts", tags=["accounts"])

ASSET_TYPES = {"checking", "savings", "investment", "property", "other"}
LIABILITY_TYPES = {"credit_card", "loan"}


@router.get("", response_model=List[AccountOut])
def list_accounts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Account).filter(Account.user_id == user.id).order_by(Account.type, Account.name).all()


@router.post("", response_model=AccountOut)
def create_account(data: AccountCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    account = Account(user_id=user.id, **data.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.put("/{account_id}", response_model=AccountOut)
def update_account(account_id: int, data: AccountCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    for key, val in data.model_dump().items():
        setattr(account, key, val)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return {"detail": "Account deleted"}


@router.get("/net-worth", response_model=NetWorthResponse)
def net_worth(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    total_assets = 0.0
    total_liabilities = 0.0
    for a in accounts:
        if a.type in ASSET_TYPES:
            total_assets += a.balance
        elif a.type in LIABILITY_TYPES:
            total_liabilities += abs(a.balance)
    return NetWorthResponse(
        total_assets=round(total_assets, 2),
        total_liabilities=round(total_liabilities, 2),
        net_worth=round(total_assets - total_liabilities, 2),
        account_count=len(accounts),
    )
