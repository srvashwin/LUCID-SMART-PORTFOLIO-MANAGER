import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.user import User
from app.models.household import Household, HouseholdMember
from app.models.expense import Expense
from app.models.income import Income
from app.models.budget import Budget, BudgetCategory
from app.models.spending_rule import SpendingRule
from app.models.recurring import RecurringTransaction
from app.models.investment_goal import InvestmentGoal
from app.models.user_goal import UserGoal
from app.models.fund import Fund
from app.schemas import (
    HouseholdCreate, HouseholdOut, HouseholdMemberOut, HouseholdDetailOut,
    JoinHouseholdRequest, TransferOwnershipRequest,
)
from app.utils import get_current_user

router = APIRouter(prefix="/api/households", tags=["households"])


def get_household_for_user(household_id: int, db: Session, user: User) -> Optional[Household]:
    membership = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == user.id,
    ).first()
    if not membership:
        return None
    household = db.query(Household).filter(Household.id == household_id).first()
    return household


def get_members(household_id: int, db: Session) -> list:
    rows = db.query(
        HouseholdMember, User.name, User.email
    ).join(User, HouseholdMember.user_id == User.id).filter(
        HouseholdMember.household_id == household_id
    ).all()
    members = []
    for row, name, email in rows:
        members.append(HouseholdMemberOut(
            id=row.id,
            household_id=row.household_id,
            user_id=row.user_id,
            role=row.role,
            joined_at=row.joined_at,
            user_name=name,
            user_email=email,
        ))
    return members


@router.post("", response_model=HouseholdDetailOut)
def create_household(data: HouseholdCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    invite_code = secrets.token_urlsafe(12)
    household = Household(name=data.name, invite_code=invite_code, created_by=user.id)
    db.add(household)
    db.flush()

    member = HouseholdMember(household_id=household.id, user_id=user.id, role="owner")
    db.add(member)

    if data.share_data:
        hid = household.id
        for expense in db.query(Expense).filter(Expense.user_id == user.id, Expense.household_id == None).all():
            copy = Expense(
                user_id=user.id, amount=expense.amount, category=expense.category,
                description=expense.description, merchant=expense.merchant,
                use_case=expense.use_case, raw_chat_input=expense.raw_chat_input,
                source=expense.source, dedupe_hash=expense.dedupe_hash,
                date=expense.date, household_id=hid,
            )
            db.add(copy)
        for income in db.query(Income).filter(Income.user_id == user.id, Income.household_id == None).all():
            copy = Income(user_id=user.id, amount=income.amount, frequency=income.frequency,
                          source=income.source, date=income.date, household_id=hid)
            db.add(copy)
        for rule in db.query(SpendingRule).filter(SpendingRule.user_id == user.id, SpendingRule.household_id == None).all():
            copy = SpendingRule(user_id=user.id, category=rule.category, max_amount=rule.max_amount,
                                period=rule.period, is_active=rule.is_active, household_id=hid)
            db.add(copy)
        for rec in db.query(RecurringTransaction).filter(RecurringTransaction.user_id == user.id, RecurringTransaction.household_id == None).all():
            copy = RecurringTransaction(
                user_id=user.id, type=rec.type, amount=rec.amount, category=rec.category,
                description=rec.description, merchant=rec.merchant, frequency=rec.frequency,
                interval_days=rec.interval_days, next_date=rec.next_date, end_date=rec.end_date,
                is_active=rec.is_active, household_id=hid,
            )
            db.add(copy)
        for ig in db.query(InvestmentGoal).filter(InvestmentGoal.user_id == user.id, InvestmentGoal.household_id == None).all():
            copy = InvestmentGoal(
                user_id=user.id, name=ig.name, target_amount=ig.target_amount,
                current_amount=ig.current_amount, monthly_contribution=ig.monthly_contribution,
                expected_return_rate=ig.expected_return_rate, start_date=ig.start_date, household_id=hid,
            )
            db.add(copy)
        for ug in db.query(UserGoal).filter(UserGoal.user_id == user.id, UserGoal.household_id == None).all():
            copy = UserGoal(
                user_id=user.id, type=ug.type, target_amount=ug.target_amount,
                target_date=ug.target_date, monthly_contribution=ug.monthly_contribution,
                expected_return_rate=ug.expected_return_rate, household_id=hid,
            )
            db.add(copy)
        for fund in db.query(Fund).filter(Fund.user_id == user.id, Fund.household_id == None).all():
            copy = Fund(
                user_id=user.id, name=fund.name, type=fund.type,
                current_amount=fund.current_amount, monthly_contribution=fund.monthly_contribution,
                goal_id=fund.goal_id, household_id=hid,
            )
            db.add(copy)
        for budget in db.query(Budget).filter(Budget.user_id == user.id, Budget.household_id == None).all():
            copy = Budget(
                user_id=user.id, month=budget.month, year=budget.year,
                total_income=budget.total_income, is_active=budget.is_active, household_id=hid,
            )
            db.add(copy)
            db.flush()
            for bc in db.query(BudgetCategory).filter(BudgetCategory.budget_id == budget.id).all():
                bc_copy = BudgetCategory(budget_id=copy.id, category=bc.category,
                                         assigned_amount=bc.assigned_amount, note=bc.note)
                db.add(bc_copy)

    db.commit()
    db.refresh(household)

    members = get_members(household.id, db)
    return HouseholdDetailOut(
        household=HouseholdOut.model_validate(household),
        members=members,
        is_owner=True,
        is_admin=True,
    )


@router.get("", response_model=List[HouseholdOut])
def list_households(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    memberships = db.query(HouseholdMember).filter(HouseholdMember.user_id == user.id).all()
    ids = [m.household_id for m in memberships]
    households = db.query(Household).filter(Household.id.in_(ids)).all() if ids else []
    return households


@router.get("/{household_id}", response_model=HouseholdDetailOut)
def get_household(household_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Household not found")

    household = db.query(Household).filter(Household.id == household_id).first()
    members = get_members(household_id, db)
    return HouseholdDetailOut(
        household=HouseholdOut.model_validate(household),
        members=members,
        is_owner=membership.role == "owner",
        is_admin=membership.role in ("owner", "admin"),
    )


@router.put("/{household_id}", response_model=HouseholdOut)
def update_household(household_id: int, data: HouseholdCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    household = get_household_for_user(household_id, db, user)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    membership = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == user.id,
    ).first()
    if membership and membership.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owner or admin can update")

    household.name = data.name
    db.commit()
    db.refresh(household)
    return household


@router.post("/{household_id}/invite")
def generate_invite(household_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    household = get_household_for_user(household_id, db, user)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    membership = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == user.id,
    ).first()
    if membership and membership.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owner or admin can generate invites")

    household.invite_code = secrets.token_urlsafe(12)
    db.commit()
    return {"invite_code": household.invite_code}


@router.post("/join", response_model=HouseholdDetailOut)
def join_household(data: JoinHouseholdRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    household = db.query(Household).filter(Household.invite_code == data.invite_code).first()
    if not household:
        raise HTTPException(status_code=400, detail="Invalid invite code")

    existing = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household.id,
        HouseholdMember.user_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")

    member = HouseholdMember(household_id=household.id, user_id=user.id, role="member")
    db.add(member)
    db.commit()

    members = get_members(household.id, db)
    return HouseholdDetailOut(
        household=HouseholdOut.model_validate(household),
        members=members,
        is_owner=False,
        is_admin=False,
    )


@router.post("/{household_id}/leave")
def leave_household(household_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member")

    if membership.role == "owner":
        other_members = db.query(HouseholdMember).filter(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id != user.id,
        ).count()
        if other_members > 0:
            raise HTTPException(status_code=400, detail="Transfer ownership to another member before leaving")

    db.delete(membership)

    remaining = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id
    ).count()
    if remaining == 0:
        db.query(Household).filter(Household.id == household_id).delete()

    db.commit()
    return {"detail": "Left household"}


@router.delete("/{household_id}/members/{member_id}")
def remove_member(household_id: int, member_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == user.id,
    ).first()
    if not membership or membership.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owner or admin can remove members")

    target = db.query(HouseholdMember).filter(
        HouseholdMember.id == member_id,
        HouseholdMember.household_id == household_id,
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    if target.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the owner")
    if target.role == "admin" and membership.role != "owner":
        raise HTTPException(status_code=403, detail="Only owner can remove admins")

    db.delete(target)
    db.commit()
    return {"detail": "Member removed"}


@router.post("/{household_id}/transfer")
def transfer_ownership(household_id: int, data: TransferOwnershipRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == user.id,
    ).first()
    if not membership or membership.role != "owner":
        raise HTTPException(status_code=403, detail="Only owner can transfer ownership")

    target = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == data.user_id,
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target user is not a member")

    membership.role = "admin"
    target.role = "owner"
    db.commit()

    household = db.query(Household).filter(Household.id == household_id).first()
    household.created_by = data.user_id
    db.commit()

    return {"detail": f"Ownership transferred to member {data.user_id}"}
