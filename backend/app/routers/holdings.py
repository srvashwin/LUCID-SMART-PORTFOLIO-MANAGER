from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.holding import Holding
from app.schemas import HoldingCreate, HoldingOut, HoldingUpdate, PortfolioHolding, PortfolioResponse
from app.utils import get_current_user
from app.services.price_fetcher import get_price_for_ticker, refresh_all_prices

router = APIRouter(prefix="/api/holdings", tags=["holdings"])


@router.get("", response_model=List[HoldingOut])
def list_holdings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Holding).filter(Holding.user_id == user.id).order_by(Holding.ticker).all()


@router.post("", response_model=HoldingOut)
def create_holding(data: HoldingCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(Holding).filter(
        Holding.user_id == user.id, Holding.ticker == data.ticker.upper()
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Holding for {data.ticker.upper()} already exists")

    holding = Holding(
        user_id=user.id,
        ticker=data.ticker.upper(),
        shares=data.shares,
        cost_basis=data.cost_basis,
        account_id=data.account_id,
        notes=data.notes or "",
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


@router.put("/{holding_id}", response_model=HoldingOut)
def update_holding(holding_id: int, data: HoldingUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    holding = db.query(Holding).filter(Holding.id == holding_id, Holding.user_id == user.id).first()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(holding, key, val)
    db.commit()
    db.refresh(holding)
    return holding


@router.delete("/{holding_id}")
def delete_holding(holding_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    holding = db.query(Holding).filter(Holding.id == holding_id, Holding.user_id == user.id).first()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(holding)
    db.commit()
    return {"detail": "Holding deleted"}


@router.get("/portfolio", response_model=PortfolioResponse)
def portfolio(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    holdings = db.query(Holding).filter(Holding.user_id == user.id).all()
    if not holdings:
        return PortfolioResponse(holdings=[], total_value=0.0, total_cost=0.0, total_gain_loss=0.0, total_gain_loss_pct=0.0)

    tickers = [h.ticker for h in holdings]
    refresh_all_prices(tickers, db)

    total_value = 0.0
    total_cost = 0.0
    portfolio_holdings: list[PortfolioHolding] = []

    for h in holdings:
        price_info = get_price_for_ticker(h.ticker, db)
        current_price = price_info["price"]
        change_pct = price_info["change_pct"]
        current_value = round(h.shares * current_price, 2)
        cost = round(h.shares * h.cost_basis, 2) if h.cost_basis else 0.0
        gain_loss = round(current_value - cost, 2)
        gain_loss_pct = round((gain_loss / cost * 100), 2) if cost else 0.0

        total_value += current_value
        total_cost += cost

        portfolio_holdings.append(PortfolioHolding(
            id=h.id,
            ticker=h.ticker,
            shares=h.shares,
            cost_basis=h.cost_basis,
            current_price=current_price,
            change_pct=change_pct,
            current_value=current_value,
            gain_loss=gain_loss,
            gain_loss_pct=gain_loss_pct,
            notes=h.notes,
        ))

    total_gain_loss = round(total_value - total_cost, 2)
    total_gain_loss_pct = round((total_gain_loss / total_cost * 100), 2) if total_cost else 0.0

    return PortfolioResponse(
        holdings=portfolio_holdings,
        total_value=round(total_value, 2),
        total_cost=round(total_cost, 2),
        total_gain_loss=total_gain_loss,
        total_gain_loss_pct=total_gain_loss_pct,
    )
