from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.account import Account
from app.models.net_worth_snapshot import NetWorthSnapshot
from app.schemas import AccountCreate, AccountUpdate, AccountOut, NetWorthResponse, NetWorthSnapshotOut, NetWorthHistoryResponse
from app.utils import get_current_user

router = APIRouter(prefix="/api/accounts", tags=["accounts"])

ASSET_TYPES = {"checking", "savings", "investment", "property", "other"}
LIABILITY_TYPES = {"credit_card", "loan"}


def compute_net_worth(db: Session, user_id: int) -> tuple:
    accounts = db.query(Account).filter(Account.user_id == user_id).all()
    total_assets = 0.0
    total_liabilities = 0.0
    for a in accounts:
        if a.type in ASSET_TYPES:
            total_assets += a.balance
        elif a.type in LIABILITY_TYPES:
            total_liabilities += abs(a.balance)
    return round(total_assets, 2), round(total_liabilities, 2), round(total_assets - total_liabilities, 2)


def auto_snapshot(db: Session, user: User):
    total_assets, total_liabilities, net_worth = compute_net_worth(db, user.id)
    today = date.today()
    existing = db.query(NetWorthSnapshot).filter(
        NetWorthSnapshot.user_id == user.id,
        NetWorthSnapshot.snapshot_date == today,
    ).first()
    if existing:
        existing.total_assets = total_assets
        existing.total_liabilities = total_liabilities
        existing.net_worth = net_worth
    else:
        snapshot = NetWorthSnapshot(
            user_id=user.id,
            total_assets=total_assets,
            total_liabilities=total_liabilities,
            net_worth=net_worth,
            snapshot_date=today,
        )
        db.add(snapshot)
    db.commit()


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
def update_account(account_id: int, data: AccountUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
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
    total_assets, total_liabilities, net_worth_val = compute_net_worth(db, user.id)
    account_count = db.query(Account).filter(Account.user_id == user.id).count()
    auto_snapshot(db, user)
    return NetWorthResponse(
        total_assets=total_assets,
        total_liabilities=total_liabilities,
        net_worth=net_worth_val,
        account_count=account_count,
    )


@router.post("/net-worth/snapshot", response_model=NetWorthSnapshotOut)
def take_snapshot(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    auto_snapshot(db, user)
    today = date.today()
    snapshot = db.query(NetWorthSnapshot).filter(
        NetWorthSnapshot.user_id == user.id,
        NetWorthSnapshot.snapshot_date == today,
    ).first()
    return snapshot


@router.get("/net-worth/history", response_model=NetWorthHistoryResponse)
def net_worth_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    snapshots = db.query(NetWorthSnapshot).filter(
        NetWorthSnapshot.user_id == user.id
    ).order_by(NetWorthSnapshot.snapshot_date.asc()).all()

    change_1m = None
    change_3m = None
    change_6m = None
    n = len(snapshots)
    if n >= 2:
        latest = snapshots[-1].net_worth
        for i in range(n - 2, -1, -1):
            days_ago = (snapshots[-1].snapshot_date - snapshots[i].snapshot_date).days
            if days_ago >= 30 and change_1m is None:
                change_1m = round(latest - snapshots[i].net_worth, 2)
            if days_ago >= 90 and change_3m is None:
                change_3m = round(latest - snapshots[i].net_worth, 2)
            if days_ago >= 180 and change_6m is None:
                change_6m = round(latest - snapshots[i].net_worth, 2)

    return NetWorthHistoryResponse(snapshots=snapshots, change_1m=change_1m, change_3m=change_3m, change_6m=change_6m)
