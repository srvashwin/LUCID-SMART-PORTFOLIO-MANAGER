from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, expenses, income, rules, goals, ai, reports, budgets, subscriptions, accounts, funds, imports, holdings, recurring

Base.metadata.create_all(bind=engine)

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


@app.get("/api/health")
def health():
    return {"status": "ok"}
