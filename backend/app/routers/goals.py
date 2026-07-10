from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.user_goal import UserGoal
from app.models.investment_goal import InvestmentGoal
from datetime import date, datetime
from app.schemas import UserGoalCreate, UserGoalOut, InvestmentGoalCreate, InvestmentGoalOut, GoalTimelineRequest, GoalTimelineResponse
from app.utils import get_current_user

router = APIRouter(prefix="/api/goals", tags=["goals"])


# === User Goals (yearly savings, etc.) ===

@router.post("/user-goals", response_model=UserGoalOut)
def create_user_goal(data: UserGoalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = UserGoal(user_id=user.id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("/user-goals", response_model=List[UserGoalOut])
def list_user_goals(
    household_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(UserGoal).filter(UserGoal.user_id == user.id)
    if household_id is not None:
        query = query.filter(UserGoal.household_id == household_id)
    else:
        query = query.filter(UserGoal.household_id == None)
    return query.all()


@router.put("/user-goals/{goal_id}", response_model=UserGoalOut)
def update_user_goal(goal_id: int, data: UserGoalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = db.query(UserGoal).filter(UserGoal.id == goal_id, UserGoal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for key, val in data.model_dump().items():
        setattr(goal, key, val)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/user-goals/{goal_id}")
def delete_user_goal(goal_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = db.query(UserGoal).filter(UserGoal.id == goal_id, UserGoal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"detail": "Goal deleted"}


# === Investment Goals ===

@router.post("/investment", response_model=InvestmentGoalOut)
def create_investment_goal(data: InvestmentGoalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = InvestmentGoal(user_id=user.id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("/investment", response_model=List[InvestmentGoalOut])
def list_investment_goals(
    household_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(InvestmentGoal).filter(InvestmentGoal.user_id == user.id)
    if household_id is not None:
        query = query.filter(InvestmentGoal.household_id == household_id)
    else:
        query = query.filter(InvestmentGoal.household_id == None)
    return query.all()


@router.put("/investment/{goal_id}", response_model=InvestmentGoalOut)
def update_investment_goal(goal_id: int, data: InvestmentGoalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = db.query(InvestmentGoal).filter(InvestmentGoal.id == goal_id, InvestmentGoal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for key, val in data.model_dump().items():
        setattr(goal, key, val)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/investment/{goal_id}")
def delete_investment_goal(goal_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = db.query(InvestmentGoal).filter(InvestmentGoal.id == goal_id, InvestmentGoal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"detail": "Goal deleted"}


@router.post("/calculate-timeline", response_model=GoalTimelineResponse)
def calculate_goal_timeline(data: GoalTimelineRequest):
    remaining = data.target_amount - data.current_amount
    if remaining <= 0:
        return GoalTimelineResponse(
            required_monthly=0,
            months_remaining=0,
            on_track=True,
            total_needed=0,
            target_date=data.target_date,
        )

    today = date.today()
    months_remaining = max(1, (data.target_date.year - today.year) * 12 + (data.target_date.month - today.month))
    required_monthly = round(remaining / months_remaining, 2)
    on_track = data.monthly_contribution >= required_monthly if data.monthly_contribution > 0 else False

    return GoalTimelineResponse(
        required_monthly=required_monthly,
        months_remaining=months_remaining,
        on_track=on_track,
        total_needed=remaining,
        target_date=data.target_date,
    )
