from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.spending_rule import SpendingRule
from app.schemas import SpendingRuleCreate, SpendingRuleOut
from app.utils import get_current_user
from app.deps import verify_household_access

router = APIRouter(prefix="/api/rules", tags=["rules"])


@router.post("", response_model=SpendingRuleOut)
def create_rule(data: SpendingRuleCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    verify_household_access(data.household_id, user, db)
    rule = SpendingRule(user_id=user.id, **data.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("", response_model=List[SpendingRuleOut])
def list_rules(
    household_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(SpendingRule).filter(SpendingRule.user_id == user.id)
    verify_household_access(household_id, user, db)
    if household_id is not None:
        query = query.filter(SpendingRule.household_id == household_id)
    else:
        query = query.filter(SpendingRule.household_id == None)
    return query.all()


@router.put("/{rule_id}", response_model=SpendingRuleOut)
def update_rule(rule_id: int, data: SpendingRuleCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rule = db.query(SpendingRule).filter(SpendingRule.id == rule_id, SpendingRule.user_id == user.id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    for key, val in data.model_dump().items():
        setattr(rule, key, val)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rule = db.query(SpendingRule).filter(SpendingRule.id == rule_id, SpendingRule.user_id == user.id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"detail": "Rule deleted"}
