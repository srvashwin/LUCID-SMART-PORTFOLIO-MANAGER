from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.utils import get_current_user
from app.services.cashflow import compute_forecast

router = APIRouter(prefix="/api/cashflow", tags=["cashflow"])


@router.get("/forecast")
def forecast(
    days: int = Query(30, ge=7, le=90),
    household_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return compute_forecast(
        db=db,
        user_id=user.id,
        days=days,
        household_id=household_id,
    )
