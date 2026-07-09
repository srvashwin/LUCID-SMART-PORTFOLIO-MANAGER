from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, timedelta
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.services.reports import generate_excel_report, generate_expense_chart, generate_category_chart
from app.utils import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/excel")
def download_excel(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now = date.today()
    month = month or now.month
    year = year or now.year

    expenses_query = db.query(Expense).filter(
        Expense.user_id == user.id,
        func.extract("month", Expense.date) == month,
        func.extract("year", Expense.date) == year,
    ).order_by(Expense.date.desc()).all()

    expenses_data = [
        {
            "date": str(e.date),
            "amount": e.amount,
            "category": e.category,
            "description": e.description,
            "merchant": e.merchant,
            "use_case": e.use_case,
        }
        for e in expenses_query
    ]

    # Monthly trend (last 12 months)
    trend = db.query(
        func.extract("year", Expense.date).label("year"),
        func.extract("month", Expense.date).label("month"),
        func.sum(Expense.amount).label("total"),
    ).filter(
        Expense.user_id == user.id,
        Expense.date >= date(year - 1, month, 1) if month else Expense.date >= date(now.year - 1, now.month, 1),
    ).group_by(
        func.extract("year", Expense.date),
        func.extract("month", Expense.date),
    ).order_by(
        func.extract("year", Expense.date),
        func.extract("month", Expense.date),
    ).all()

    monthly_trend = [
        {"year": int(t.year), "month": int(t.month), "total": round(t.total, 2)}
        for t in trend
    ]

    # Category breakdown for the month
    cat_breakdown = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count"),
    ).filter(
        Expense.user_id == user.id,
        func.extract("month", Expense.date) == month,
        func.extract("year", Expense.date) == year,
    ).group_by(Expense.category).all()

    cat_data = [
        {"category": c.category, "total": round(c.total, 2), "count": c.count}
        for c in cat_breakdown
    ]

    excel_file = generate_excel_report(expenses_data, monthly_trend, cat_data)
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=expenses_{year}_{month:02d}.xlsx"},
    )


@router.get("/charts/trend")
def download_trend_chart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now = date.today()
    trend = db.query(
        func.extract("year", Expense.date).label("year"),
        func.extract("month", Expense.date).label("month"),
        func.sum(Expense.amount).label("total"),
    ).filter(
        Expense.user_id == user.id,
        Expense.date >= date(now.year - 1, now.month, 1),
    ).group_by(
        func.extract("year", Expense.date),
        func.extract("month", Expense.date),
    ).order_by(
        func.extract("year", Expense.date),
        func.extract("month", Expense.date),
    ).all()

    monthly_trend = [
        {"year": int(t.year), "month": int(t.month), "total": round(t.total, 2)}
        for t in trend
    ]

    chart = generate_expense_chart(monthly_trend)
    return StreamingResponse(
        chart,
        media_type="image/png",
        headers={"Content-Disposition": "attachment; filename=spending_trend.png"},
    )


@router.get("/charts/category")
def download_category_chart(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now = date.today()
    month = month or now.month
    year = year or now.year

    cat_breakdown = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total"),
    ).filter(
        Expense.user_id == user.id,
        func.extract("month", Expense.date) == month,
        func.extract("year", Expense.date) == year,
    ).group_by(Expense.category).all()

    cat_data = [
        {"category": c.category, "total": round(c.total, 2)}
        for c in cat_breakdown
    ]

    chart = generate_category_chart(cat_data)
    return StreamingResponse(
        chart,
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename=category_breakdown_{year}_{month:02d}.png"},
    )
