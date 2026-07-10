import httpx
import re
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.holding import HoldingPrice
from app.config import settings

YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=5d&interval=1d"
YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote?symbols={ticker}"
TWELVE_DATA_QUOTE_URL = "https://api.twelvedata.com/quote?symbol={ticker}&apikey={key}"
FINNHUB_QUOTE_URL = "https://finnhub.io/api/v1/quote?symbol={ticker}&token={key}"

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


def _fetch_from_yahoo(ticker: str) -> Optional[dict]:
    headers = {"User-Agent": USER_AGENT}
    with httpx.Client(timeout=15) as client:
        resp = client.get(YAHOO_CHART_URL.format(ticker=ticker), headers=headers)
        if resp.status_code != 200:
            resp = client.get(YAHOO_QUOTE_URL.format(ticker=ticker), headers=headers)
            if resp.status_code != 200:
                return None
            data = resp.json()
            result = data.get("quoteResponse", {}).get("result", [None])[0]
            if not result:
                return None
            price = result.get("regularMarketPrice")
            prev_close = result.get("regularMarketPreviousClose")
            if price is None or prev_close is None or prev_close == 0:
                return None
            change_pct = round((price - prev_close) / prev_close * 100, 2)
            return {"price": round(price, 4), "change_pct": change_pct}

        data = resp.json()
        result = data.get("chart", {}).get("result", [None])[0]
        if not result:
            return None
        meta = result.get("meta", {})
        price = meta.get("regularMarketPrice")
        prev_close = meta.get("chartPreviousClose") or meta.get("previousClose")
        if price is None:
            return None
        change_pct = 0.0
        if prev_close and prev_close != 0:
            change_pct = round((price - prev_close) / prev_close * 100, 2)
        return {"price": round(price, 4), "change_pct": change_pct}


def _fetch_from_twelvedata(ticker: str) -> Optional[dict]:
    key = settings.TWELVE_DATA_API_KEY
    if not key:
        return None
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.get(TWELVE_DATA_QUOTE_URL.format(ticker=ticker, key=key))
            if resp.status_code != 200:
                return None
            data = resp.json()
            if data.get("status") == "error":
                return None
            price_str = data.get("close")
            prev_close_str = data.get("previous_close")
            if price_str is None or prev_close_str is None:
                return None
            price = float(price_str)
            prev_close = float(prev_close_str)
            change_pct = round((price - prev_close) / prev_close * 100, 2) if prev_close else 0.0
            return {"price": round(price, 4), "change_pct": change_pct}
    except Exception:
        return None


def _fetch_from_finnhub(ticker: str) -> Optional[dict]:
    key = settings.FINNHUB_API_KEY
    if not key:
        return None
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.get(FINNHUB_QUOTE_URL.format(ticker=ticker, token=key))
            if resp.status_code != 200:
                return None
            data = resp.json()
            price = data.get("c")
            prev_close = data.get("pc")
            if price is None or price == 0:
                return None
            change_pct = round((price - prev_close) / prev_close * 100, 2) if prev_close else 0.0
            return {"price": round(price, 4), "change_pct": change_pct}
    except Exception:
        return None


PROVIDERS = {
    "yahoo": _fetch_from_yahoo,
    "twelvedata": _fetch_from_twelvedata,
    "finnhub": _fetch_from_finnhub,
}


def fetch_current_price(ticker: str) -> Optional[dict]:
    """Fetch current price and change % from the configured provider."""
    provider = settings.PRICE_PROVIDER or "yahoo"
    fetcher = PROVIDERS.get(provider, _fetch_from_yahoo)
    try:
        return fetcher(ticker)
    except Exception:
        return None


def get_price_for_ticker(ticker: str, db: Optional[Session] = None) -> Optional[dict]:
    """Get cached price or fetch live. Returns dict with price, change_pct, or None on failure."""
    ticker_upper = ticker.upper().strip()

    if db:
        cached = db.query(HoldingPrice).filter(HoldingPrice.ticker == ticker_upper).first()
        if cached:
            return {"price": cached.price, "change_pct": cached.change_pct, "updated_at": cached.updated_at}

    fetched = fetch_current_price(ticker_upper)
    if fetched is None:
        return None

    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True

    try:
        existing = db.query(HoldingPrice).filter(HoldingPrice.ticker == ticker_upper).first()
        if existing:
            existing.price = fetched["price"]
            existing.change_pct = fetched["change_pct"]
        else:
            hp = HoldingPrice(ticker=ticker_upper, price=fetched["price"], change_pct=fetched["change_pct"])
            db.add(hp)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        if own_session:
            db.close()

    fetched["updated_at"] = datetime.utcnow()
    return fetched


def refresh_all_prices(tickers: list[str], db: Session) -> int:
    """Fetch fresh prices for all given tickers. Returns count updated."""
    count = 0
    for ticker in tickers:
        fetched = fetch_current_price(ticker)
        if fetched is None:
            continue
        existing = db.query(HoldingPrice).filter(HoldingPrice.ticker == ticker.upper()).first()
        if existing:
            existing.price = fetched["price"]
            existing.change_pct = fetched["change_pct"]
        else:
            hp = HoldingPrice(ticker=ticker.upper(), price=fetched["price"], change_pct=fetched["change_pct"])
            db.add(hp)
        count += 1
    if count:
        db.commit()
    return count
