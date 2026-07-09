from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from collections import defaultdict

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.recurring import RecurringTransaction
from app.schemas import DetectedSubscription, SubscriptionDetectResponse, PromoteSubscriptionRequest, RecurringOut
from app.utils import get_current_user

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


@router.get("/detect", response_model=SubscriptionDetectResponse)
def detect_subscriptions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    expenses = db.query(Expense).filter(
        Expense.user_id == user.id,
    ).order_by(Expense.date.desc()).all()

    single_subscription_expenses = []
    merchant_groups = defaultdict(list)
    for e in expenses:
        merchant = e.merchant.strip().lower() if e.merchant else ""
        if merchant:
            merchant_groups[merchant].append(e)
        if e.category == "Subscription" or "subscription" in (e.description or "").lower() or "subscription" in (e.merchant or "").lower():
            single_subscription_expenses.append(e)

    subscriptions = []
    for merchant, entries in merchant_groups.items():
        if len(entries) < 2:
            continue

        amount_groups = defaultdict(list)
        for e in entries:
            amount_groups[round(e.amount, 2)].append(e)

        best_amount = max(amount_groups, key=lambda a: len(amount_groups[a]))
        best_entries = amount_groups[best_amount]

        if len(best_entries) < 2:
            continue

        days = sorted(set(e.date.day for e in best_entries))
        dates = sorted(e.date for e in best_entries)

        total_months_span = 1
        if len(dates) >= 2:
            total_months_span = max(1, (dates[-1].year - dates[0].year) * 12 + (dates[-1].month - dates[0].month))

        occurrences = len(best_entries)
        expected = min(occurrences, total_months_span + 1)
        regularity = occurrences / max(expected, 1)

        if regularity >= 0.8 and occurrences >= 3:
            confidence = "high"
        elif regularity >= 0.5 and occurrences >= 2:
            confidence = "medium"
        else:
            continue

        subscriptions.append(DetectedSubscription(
            merchant=merchant.title(),
            amount=best_amount,
            category=best_entries[0].category,
            frequency="monthly",
            confidence=confidence,
            last_date=dates[-1],
            occurrences=occurrences,
            days_of_month=days,
        ))

    tracked_merchants = {s.merchant.lower() for s in subscriptions}
    for e in single_subscription_expenses:
        m = (e.merchant or "").strip().lower()
        if m and m not in tracked_merchants:
            tracked_merchants.add(m)
            subscriptions.append(DetectedSubscription(
                merchant=e.merchant.title(),
                amount=round(e.amount, 2),
                category=e.category,
                frequency="monthly",
                confidence="medium",
                last_date=e.date,
                occurrences=1,
                days_of_month=[e.date.day],
            ))

    subscriptions.sort(key=lambda s: s.amount, reverse=True)
    total_monthly = round(sum(s.amount for s in subscriptions), 2)

    return SubscriptionDetectResponse(
        subscriptions=subscriptions,
        total_monthly=total_monthly,
        total_yearly=round(total_monthly * 12, 2),
    )


@router.post("/promote", response_model=RecurringOut)
def promote_to_recurring(data: PromoteSubscriptionRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == user.id,
        RecurringTransaction.merchant == data.merchant,
        RecurringTransaction.is_active == True,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Recurring transaction for {data.merchant} already exists")

    now = date.today()
    next_date = now + timedelta(days=30)

    recurring = RecurringTransaction(
        user_id=user.id,
        type="expense",
        amount=data.amount,
        category=data.category,
        description=f"{data.merchant} subscription",
        merchant=data.merchant,
        frequency="monthly",
        interval_days=30,
        next_date=next_date,
        end_date=None,
        is_active=True,
    )
    db.add(recurring)
    db.commit()
    db.refresh(recurring)
    return recurring
