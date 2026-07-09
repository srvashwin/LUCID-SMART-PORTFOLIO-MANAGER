from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.recurring import RecurringTransaction
from app.schemas import RecurringCreate, RecurringUpdate, RecurringOut, UpcomingOccurrence, UpcomingResponse
from app.utils import get_current_user

router = APIRouter(prefix="/api/recurring", tags=["recurring"])

FREQUENCY_DAYS = {
    "weekly": 7,
    "biweekly": 14,
    "monthly": 30,
    "quarterly": 91,
    "yearly": 365,
}


@router.get("", response_model=List[RecurringOut])
def list_recurring(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == user.id
    ).order_by(RecurringTransaction.next_date).all()


@router.post("", response_model=RecurringOut)
def create_recurring(data: RecurringCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    recurring = RecurringTransaction(
        user_id=user.id,
        type=data.type,
        amount=data.amount,
        category=data.category,
        description=data.description,
        merchant=data.merchant,
        frequency=data.frequency,
        interval_days=data.interval_days or FREQUENCY_DAYS.get(data.frequency),
        next_date=data.next_date,
        end_date=data.end_date,
        is_active=data.is_active,
    )
    db.add(recurring)
    db.commit()
    db.refresh(recurring)
    return recurring


@router.put("/{recurring_id}", response_model=RecurringOut)
def update_recurring(recurring_id: int, data: RecurringUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    recurring = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == recurring_id, RecurringTransaction.user_id == user.id
    ).first()
    if not recurring:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(recurring, key, val)
    if data.frequency and not data.interval_days:
        recurring.interval_days = FREQUENCY_DAYS.get(data.frequency)
    db.commit()
    db.refresh(recurring)
    return recurring


@router.delete("/{recurring_id}")
def delete_recurring(recurring_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    recurring = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == recurring_id, RecurringTransaction.user_id == user.id
    ).first()
    if not recurring:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")
    db.delete(recurring)
    db.commit()
    return {"detail": "Recurring transaction deleted"}


@router.get("/upcoming", response_model=UpcomingResponse)
def get_upcoming(days: int = 30, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    recurring_list = db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == user.id,
        RecurringTransaction.is_active == True,
    ).all()

    today = date.today()
    cutoff = today + timedelta(days=days)
    occurrences = []
    total = 0.0

    for r in recurring_list:
        current = r.next_date
        interval = r.interval_days or FREQUENCY_DAYS.get(r.frequency, 30)
        while current <= cutoff:
            if current >= today:
                occurrences.append(UpcomingOccurrence(
                    recurring_id=r.id,
                    type=r.type,
                    amount=r.amount,
                    category=r.category,
                    description=r.description,
                    merchant=r.merchant,
                    due_date=current,
                ))
                total += r.amount
            if interval:
                current += timedelta(days=interval)
            else:
                break
        if r.end_date and current > r.end_date:
            pass

    occurrences.sort(key=lambda o: o.due_date)
    return UpcomingResponse(occurrences=occurrences, total=round(total, 2))
