from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Query


class PaginationParams(BaseModel):
    limit: Optional[int] = None
    offset: int = 0


def paginate(query: Query, offset: int = 0, limit: Optional[int] = None) -> dict:
    total = query.count()
    if limit is not None:
        query = query.offset(offset).limit(limit)
    items = query.all()
    return {"items": items, "total": total, "offset": offset, "limit": limit}
