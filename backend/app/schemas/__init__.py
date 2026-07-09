from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    currency: str = "USD"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    currency: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class IncomeCreate(BaseModel):
    amount: float
    frequency: str = "monthly"
    source: str = ""
    date: date


class IncomeOut(BaseModel):
    id: int
    user_id: int
    amount: float
    frequency: str
    source: str
    date: date
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: str = ""
    merchant: str = ""
    use_case: str = ""
    date: date


class ExpenseChat(BaseModel):
    message: str
    use_case: Optional[str] = ""


class ExpenseOut(BaseModel):
    id: int
    user_id: int
    amount: float
    category: str
    description: str
    merchant: str
    use_case: str
    raw_chat_input: str
    source: str = "manual"
    import_batch_id: Optional[int] = None
    date: date
    created_at: datetime

    class Config:
        from_attributes = True


class SpendingRuleCreate(BaseModel):
    category: str
    max_amount: float
    period: str = "monthly"


class SpendingRuleOut(BaseModel):
    id: int
    user_id: int
    category: str
    max_amount: float
    period: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class InvestmentGoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    monthly_contribution: float = 0.0
    expected_return_rate: float = 7.0
    start_date: date


class InvestmentGoalOut(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    current_amount: float
    monthly_contribution: float
    expected_return_rate: float
    start_date: date
    created_at: datetime

    class Config:
        from_attributes = True


class UserGoalCreate(BaseModel):
    type: str
    target_amount: float
    target_date: Optional[date] = None
    monthly_contribution: float = 0.0
    expected_return_rate: float = 7.0


class UserGoalOut(BaseModel):
    id: int
    user_id: int
    type: str
    target_amount: float
    target_date: Optional[date]
    monthly_contribution: float
    expected_return_rate: float
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryOut(BaseModel):
    id: int
    name: str
    icon: str
    is_user_defined: bool

    class Config:
        from_attributes = True


class AnalysisRequest(BaseModel):
    expense_amount: float
    expense_description: str
    use_case: str = ""


class SuggestionRequest(BaseModel):
    pass


class AccountCreate(BaseModel):
    name: str
    type: str
    balance: float = 0.0
    institution: str = ""


class AccountOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: str
    balance: float
    institution: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NetWorthResponse(BaseModel):
    total_assets: float
    total_liabilities: float
    net_worth: float
    account_count: int


class GoalTimelineRequest(BaseModel):
    target_amount: float
    current_amount: float = 0.0
    target_date: date
    monthly_contribution: float = 0.0


class GoalTimelineResponse(BaseModel):
    required_monthly: float
    months_remaining: int
    on_track: bool
    total_needed: float
    target_date: date


class InvestmentAssistantRequest(BaseModel):
    target_return: float
    years: int
    preference: str = ""


class InvestmentOption(BaseModel):
    name: str
    expected_return: float
    monthly_investment: float
    total_invested: float
    final_value: float
    risk: str


class InvestmentAssistantResponse(BaseModel):
    target_return: float
    years: int
    options: list[InvestmentOption]
    disclaimer: str


class DetectedSubscription(BaseModel):
    merchant: str
    amount: float
    category: str
    frequency: str
    confidence: str
    last_date: date
    occurrences: int
    days_of_month: list[int]


class SubscriptionDetectResponse(BaseModel):
    subscriptions: list[DetectedSubscription]
    total_monthly: float
    total_yearly: float


class BudgetCreate(BaseModel):
    month: int
    year: int
    total_income: float = 0.0


class BudgetUpdate(BaseModel):
    total_income: Optional[float] = None
    is_active: Optional[bool] = None


class BudgetCategoryAssign(BaseModel):
    category: str
    assigned_amount: float


class BudgetCategoryOut(BaseModel):
    category: str
    assigned_amount: float
    spent_amount: float
    remaining: float

    class Config:
        from_attributes = True


class BudgetOut(BaseModel):
    id: int
    user_id: int
    month: int
    year: int
    total_income: float
    is_active: bool
    categories: list[BudgetCategoryOut]
    total_assigned: float
    total_spent: float
    total_remaining: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FundCreate(BaseModel):
    name: str
    type: str = "savings"
    current_amount: float = 0.0
    monthly_contribution: float = 0.0
    goal_id: Optional[int] = None


class FundOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: str
    current_amount: float
    monthly_contribution: float
    goal_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class AgentAction(BaseModel):
    type: str
    payload: dict


class AgentRequest(BaseModel):
    message: str


class AgentData(BaseModel):
    income: Optional[dict] = None
    expense: Optional[dict] = None
    goal: Optional[dict] = None
    rule: Optional[dict] = None
    currency: Optional[str] = None
    fund: Optional[dict] = None


class AgentResponse(BaseModel):
    intent: str
    message: str
    data: AgentData
    action: Optional[AgentAction] = None


class ImportPreviewRow(BaseModel):
    date: date
    description: str
    amount: float
    direction: str = ""
    category_guess: str = "Other"
    is_duplicate: bool = False
    dedupe_hash: str = ""
    include: bool = True


class ImportPreviewResponse(BaseModel):
    bank_name: str
    rows: list[ImportPreviewRow]
    duplicate_count: int = 0
    total_count: int = 0


class ImportConfirmRequest(BaseModel):
    rows: list[ImportPreviewRow]


class ImportBatchOut(BaseModel):
    id: int
    filename: str
    bank_name: str
    row_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class HoldingCreate(BaseModel):
    ticker: str
    shares: float
    cost_basis: float = 0.0
    account_id: Optional[int] = None
    notes: str = ""


class HoldingUpdate(BaseModel):
    shares: Optional[float] = None
    cost_basis: Optional[float] = None
    account_id: Optional[int] = None
    notes: Optional[str] = None


class HoldingOut(BaseModel):
    id: int
    user_id: int
    ticker: str
    shares: float
    cost_basis: float
    account_id: Optional[int]
    notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PortfolioHolding(BaseModel):
    id: int
    ticker: str
    shares: float
    cost_basis: float
    current_price: float
    change_pct: float
    current_value: float
    gain_loss: float
    gain_loss_pct: float
    notes: str


class PortfolioResponse(BaseModel):
    holdings: list[PortfolioHolding]
    total_value: float
    total_cost: float
    total_gain_loss: float
    total_gain_loss_pct: float


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class RecurringCreate(BaseModel):
    type: str = "expense"
    amount: float
    category: str = "Other"
    description: str = ""
    merchant: str = ""
    frequency: str = "monthly"
    interval_days: Optional[int] = None
    next_date: date
    end_date: Optional[date] = None
    is_active: bool = True


class RecurringUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    frequency: Optional[str] = None
    interval_days: Optional[int] = None
    next_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class RecurringOut(BaseModel):
    id: int
    user_id: int
    type: str
    amount: float
    category: str
    description: str
    merchant: str
    frequency: str
    interval_days: Optional[int]
    next_date: date
    end_date: Optional[date]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UpcomingOccurrence(BaseModel):
    recurring_id: int
    type: str
    amount: float
    category: str
    description: str
    merchant: str
    due_date: date


class UpcomingResponse(BaseModel):
    occurrences: list[UpcomingOccurrence]
    total: float


class PromoteSubscriptionRequest(BaseModel):
    merchant: str
    amount: float
    category: str


class NetWorthSnapshotOut(BaseModel):
    id: int
    total_assets: float
    total_liabilities: float
    net_worth: float
    snapshot_date: date
    created_at: datetime

    class Config:
        from_attributes = True


class NetWorthHistoryResponse(BaseModel):
    snapshots: list[NetWorthSnapshotOut]
    change_1m: Optional[float] = None
    change_3m: Optional[float] = None
    change_6m: Optional[float] = None
