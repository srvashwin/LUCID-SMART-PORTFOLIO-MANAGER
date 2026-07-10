from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from typing import Optional
from app.models.account import Account
from app.models.income import Income
from app.models.recurring import RecurringTransaction
from app.models.expense import Expense


def compute_forecast(
    db: Session,
    user_id: int,
    days: int = 30,
    household_id: Optional[int] = None,
) -> dict:
    today = date.today()
    end = today + timedelta(days=days)

    # Starting balance
    account_query = db.query(Account).filter(Account.user_id == user_id)
    if household_id is not None:
        account_query = account_query.filter(Account.household_id == household_id)
    else:
        account_query = account_query.filter(Account.household_id == None)
    accounts = account_query.all()
    starting_balance = sum(a.balance for a in accounts)

    # Income entries
    income_query = db.query(Income).filter(Income.user_id == user_id)
    if household_id is not None:
        income_query = income_query.filter(Income.household_id == household_id)
    else:
        income_query = income_query.filter(Income.household_id == None)
    incomes = income_query.all()

    # Recurring transactions
    recurring_query = db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == user_id,
        RecurringTransaction.is_active == True,
    )
    if household_id is not None:
        recurring_query = recurring_query.filter(RecurringTransaction.household_id == household_id)
    else:
        recurring_query = recurring_query.filter(RecurringTransaction.household_id == None)
    recurrings = recurring_query.all()

    # Historical daily average expense (last 90 days)
    ninety_days_ago = today - timedelta(days=90)
    expense_query = db.query(Expense).filter(
        Expense.user_id == user_id,
        Expense.date >= ninety_days_ago,
        Expense.date < today,
    )
    if household_id is not None:
        expense_query = expense_query.filter(Expense.household_id == household_id)
    else:
        expense_query = expense_query.filter(Expense.household_id == None)
    historical_expenses = expense_query.all()
    total_historical = sum(e.amount for e in historical_expenses)
    daily_avg_expense = total_historical / 90 if total_historical > 0 else 0

    # Build daily projection
    daily_balance = []
    balance = starting_balance
    total_income = 0.0
    total_expenses = 0.0

    for d in (today + timedelta(n) for n in range(days + 1)):
        day_income = 0.0
        day_expense = 0.0

        # Income on this day
        for inc in incomes:
            inc_date = inc.date
            if isinstance(inc_date, datetime):
                inc_date = inc_date.date()
            if inc.frequency == "once":
                if inc_date == d:
                    day_income += inc.amount
            elif inc.frequency == "weekly":
                if inc_date <= d and (d - inc_date).days % 7 == 0:
                    day_income += inc.amount
            elif inc.frequency == "biweekly":
                if inc_date <= d and (d - inc_date).days % 14 == 0:
                    day_income += inc.amount
            elif inc.frequency == "monthly":
                if inc_date.day == d.day or (inc_date.day > 28 and d.day == 28):
                    if inc_date <= d:
                        day_income += inc.amount
            elif inc.frequency == "yearly":
                if inc_date.month == d.month and inc_date.day == d.day:
                    day_income += inc.amount

        # Recurring transactions on this day
        for rec in recurrings:
            next_d = rec.next_date
            if isinstance(next_d, datetime):
                next_d = next_d.date()
            if rec.end_date:
                end_d = rec.end_date
                if isinstance(end_d, datetime):
                    end_d = end_d.date()
                if d > end_d:
                    continue
            if rec.frequency == "weekly":
                if next_d <= d and (d - next_d).days % 7 == 0:
                    if rec.type == "expense":
                        day_expense += rec.amount
                    else:
                        day_income += rec.amount
            elif rec.frequency == "biweekly":
                if next_d <= d and (d - next_d).days % 14 == 0:
                    if rec.type == "expense":
                        day_expense += rec.amount
                    else:
                        day_income += rec.amount
            elif rec.frequency == "monthly":
                if (next_d.day == d.day or (next_d.day > 28 and d.day == 28)) and next_d <= d:
                    if rec.type == "expense":
                        day_expense += rec.amount
                    else:
                        day_income += rec.amount
            elif rec.frequency == "yearly":
                if next_d.month == d.month and next_d.day == d.day:
                    if rec.type == "expense":
                        day_expense += rec.amount
                    else:
                        day_income += rec.amount

        # Variable daily expenses
        day_expense += daily_avg_expense

        balance += day_income - day_expense
        total_income += day_income
        total_expenses += day_expense

        daily_balance.append({
            "date": d.isoformat(),
            "balance": round(balance, 2),
            "income": round(day_income, 2),
            "expenses": round(day_expense, 2),
        })

    lowest_balance = min(d["balance"] for d in daily_balance)
    highest_balance = max(d["balance"] for d in daily_balance)

    # Days until balance hits zero (if applicable)
    days_until_zero = None
    if lowest_balance < 0:
        for i, d in enumerate(daily_balance):
            if d["balance"] < 0:
                days_until_zero = i
                break

    return {
        "starting_balance": round(starting_balance, 2),
        "ending_balance": round(balance, 2),
        "total_projected_income": round(total_income, 2),
        "total_projected_expenses": round(total_expenses, 2),
        "lowest_balance": round(lowest_balance, 2),
        "highest_balance": round(highest_balance, 2),
        "days_until_zero": days_until_zero,
        "daily_projections": daily_balance,
    }
