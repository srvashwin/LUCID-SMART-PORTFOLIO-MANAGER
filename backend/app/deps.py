from fastapi import HTTPException
from typing import Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.household import HouseholdMember


def verify_household_access(
    household_id: Optional[int],
    user: User,
    db: Session,
) -> None:
    if household_id is None:
        return
    member = db.query(HouseholdMember).filter(
        HouseholdMember.household_id == household_id,
        HouseholdMember.user_id == user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this household")
