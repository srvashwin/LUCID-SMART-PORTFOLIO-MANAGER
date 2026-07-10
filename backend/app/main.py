import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app.routers import auth, expenses, income, rules, goals, ai, reports, budgets, subscriptions, accounts, funds, imports, holdings, recurring, households, cashflow
from app.models.user import User

if not os.getenv("TESTING"):
    Base.metadata.create_all(bind=engine)

    # Migrate existing users: set email_verified=True for pre-existing accounts
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email_verified == None).all()
        for u in existing:
            u.email_verified = True
        if existing:
            db.commit()
    finally:
        db.close()

app = FastAPI(title="Smart Expense Tracker", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(income.router)
app.include_router(rules.router)
app.include_router(goals.router)
app.include_router(ai.router)
app.include_router(reports.router)
app.include_router(budgets.router)
app.include_router(subscriptions.router)
app.include_router(accounts.router)
app.include_router(funds.router)
app.include_router(imports.router)
app.include_router(holdings.router)
app.include_router(recurring.router)
app.include_router(households.router)
app.include_router(cashflow.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
