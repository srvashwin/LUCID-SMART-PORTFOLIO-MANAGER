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
