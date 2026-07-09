from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, timedelta
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.income import Income
from app.models.investment_goal import InvestmentGoal
from app.models.user_goal import UserGoal
from app.models.spending_rule import SpendingRule
from app.schemas import AnalysisRequest, SuggestionRequest, InvestmentAssistantRequest, AgentRequest, AgentResponse, AgentData
from app.utils import get_current_user
from app.services import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/suggest")
def get_suggestions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Gather user's financial context
    income = db.query(Income).filter(Income.user_id == user.id).order_by(Income.date.desc()).first()
    income_total = income.amount if income else 0

    now = date.today()
    month_start = now.replace(day=1)

    # Monthly expenses
    monthly_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user.id,
        Expense.date >= month_start,
    ).scalar() or 0

    # Category breakdown
    category_breakdown = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count"),
    ).filter(
        Expense.user_id == user.id,
        Expense.date >= month_start,
    ).group_by(Expense.category).all()

    cats_data = [
        {"category": c.category, "total": round(c.total, 2), "count": c.count}
        for c in category_breakdown
    ]

    # Goals
    inv_goals = db.query(InvestmentGoal).filter(InvestmentGoal.user_id == user.id).all()
    inv_data = [
        {
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "monthly_contribution": g.monthly_contribution,
            "expected_return_rate": g.expected_return_rate,
        }
        for g in inv_goals
    ]

    user_goals = db.query(UserGoal).filter(UserGoal.user_id == user.id).all()
    goals_data = [
        {
            "type": g.type,
            "target_amount": g.target_amount,
            "monthly_contribution": g.monthly_contribution,
            "expected_return_rate": g.expected_return_rate,
        }
        for g in user_goals
    ]

    # Rules
    rules = db.query(SpendingRule).filter(SpendingRule.user_id == user.id, SpendingRule.is_active == True).all()
    rules_data = [
        {"category": r.category, "max_amount": r.max_amount, "period": r.period}
        for r in rules
    ]

    suggestions = ai_service.get_suggestions(
        income_total=income_total,
        monthly_expenses=monthly_expenses,
        category_breakdown=cats_data,
        investment_goals=inv_data,
        user_goals=goals_data,
        spending_rules=rules_data,
    )
    return {"suggestions": suggestions}


@router.post("/analyze")
def analyze_purchase(data: AnalysisRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv_goals = db.query(InvestmentGoal).filter(InvestmentGoal.user_id == user.id).all()
    inv_data = [
        {
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "monthly_contribution": g.monthly_contribution,
            "expected_return_rate": g.expected_return_rate,
        }
        for g in inv_goals
    ]

    user_goals = db.query(UserGoal).filter(UserGoal.user_id == user.id).all()
    goals_data = [
        {
            "type": g.type,
            "target_amount": g.target_amount,
            "monthly_contribution": g.monthly_contribution,
            "expected_return_rate": g.expected_return_rate,
        }
        for g in user_goals
    ]

    result = ai_service.analyze_purchase(
        expense_amount=data.expense_amount,
        expense_description=data.expense_description,
        use_case=data.use_case,
        investment_goals=inv_data,
        user_goals=goals_data,
    )
    return result


@router.post("/rules-suggestions")
def suggest_rules(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    now = date.today()
    month_start = now.replace(day=1)
    sym = ai_service._get_symbol(user.currency)

    category_breakdown = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total"),
    ).filter(
        Expense.user_id == user.id,
        Expense.date >= month_start,
    ).group_by(Expense.category).having(
        func.sum(Expense.amount) > 0
    ).all()

    suggestions = []
    for c in category_breakdown:
        if c.total > 200:
            suggested_limit = round(c.total * 0.8, -1)
            suggestions.append({
                "category": c.category,
                "suggested_max": suggested_limit,
                "current_spend": round(c.total, 2),
                "reason": f"You spent {sym}{c.total:.2f} on {c.category} this month. Consider a {sym}{suggested_limit:.0f} limit.",
            })
    return {"suggestions": suggestions}


@router.post("/investment-assistant")
def investment_assistant(data: InvestmentAssistantRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    result = ai_service.calculate_investment_plan(
        target_return=data.target_return,
        years=data.years,
        preference=data.preference,
    )
    return result


@router.post("/agent")
def agent_chat(data: AgentRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    parsed = ai_service.process_agent_message(data.message, user.currency)
    intent = parsed.get("intent", "general")
    params = parsed.get("data", {})

    agent_data = AgentData()

    if intent == "add_income":
        income = Income(
            user_id=user.id,
            amount=params.get("amount", 0),
            frequency=params.get("frequency", "monthly"),
            source=params.get("source", ""),
            date=date.today(),
        )
        db.add(income)
        db.commit()
        db.refresh(income)
        agent_data = AgentData(
            income={"amount": income.amount, "frequency": income.frequency, "source": income.source},
        )

    elif intent == "add_expense":
        expense = Expense(
            user_id=user.id,
            amount=params.get("amount", 0),
            category=params.get("category", "Other"),
            description=params.get("description", ""),
            merchant=params.get("merchant", ""),
            raw_chat_input=data.message,
            date=date.today(),
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        agent_data = AgentData(
            expense={"amount": expense.amount, "category": expense.category, "description": expense.description, "merchant": expense.merchant},
        )

    elif intent == "add_investment_goal":
        goal = InvestmentGoal(
            user_id=user.id,
            name=params.get("name", "Investment Goal"),
            target_amount=params.get("target_amount", 10000),
            current_amount=0,
            monthly_contribution=params.get("monthly_contribution", 0),
            expected_return_rate=7.0,
            start_date=date.today(),
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        agent_data = AgentData(
            goal={"name": goal.name, "target_amount": goal.target_amount, "monthly_contribution": goal.monthly_contribution},
        )

    elif intent == "add_investment":
        mc = params.get("monthly_contribution", 0)
        ca = params.get("current_amount", 0)
        existing = db.query(InvestmentGoal).filter(
            InvestmentGoal.user_id == user.id
        ).order_by(InvestmentGoal.created_at.desc()).first()
        if existing:
            if mc > 0:
                existing.monthly_contribution = mc
            if ca > 0:
                existing.current_amount = (existing.current_amount or 0) + ca
                expense = Expense(
                    user_id=user.id, amount=ca, category="Investment",
                    description=f"Investment contribution - {existing.name}", merchant="", date=date.today(),
                )
                db.add(expense)
            db.commit()
            db.refresh(existing)
            agent_data = AgentData(
                goal={"name": existing.name, "target_amount": existing.target_amount, "monthly_contribution": existing.monthly_contribution},
            )
        else:
            target = mc * 120 if mc > 0 else (ca * 5 if ca > 0 else 10000)
            goal = InvestmentGoal(
                user_id=user.id,
                name="Investment Goal",
                target_amount=target,
                current_amount=ca or 0,
                monthly_contribution=mc or 0,
                expected_return_rate=7.0,
                start_date=date.today(),
            )
            db.add(goal)
            if ca > 0:
                expense = Expense(
                    user_id=user.id, amount=ca, category="Investment",
                    description=f"Investment contribution - {goal.name}", merchant="", date=date.today(),
                )
                db.add(expense)
            db.commit()
            db.refresh(goal)
            agent_data = AgentData(
                goal={"name": goal.name, "target_amount": goal.target_amount, "monthly_contribution": goal.monthly_contribution},
            )

    elif intent == "add_savings_goal":
        goal = UserGoal(
            user_id=user.id,
            type=params.get("type", "yearly_savings"),
            target_amount=params.get("target_amount", 10000),
            monthly_contribution=params.get("monthly_contribution", 0),
            expected_return_rate=7.0,
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        agent_data = AgentData(
            goal={"type": goal.type, "target_amount": goal.target_amount, "monthly_contribution": goal.monthly_contribution},
        )

    elif intent == "add_spending_rule":
        rule = SpendingRule(
            user_id=user.id,
            category=params.get("category", "Other"),
            max_amount=params.get("max_amount", 200),
            period=params.get("period", "monthly"),
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
        agent_data = AgentData(
            rule={"category": rule.category, "max_amount": rule.max_amount, "period": rule.period},
        )

    elif intent == "change_currency":
        user.currency = params.get("currency", "USD")
        db.commit()
        db.refresh(user)
        agent_data = AgentData(currency=user.currency)

    return AgentResponse(
        intent=intent,
        message=parsed.get("message", "Done!"),
        data=agent_data,
    )
