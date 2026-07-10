export interface User {
  id: number
  email: string
  name: string
  currency: string
  is_active: boolean
  email_verified: boolean
  avatar_url: string | null
  created_at: string
}

export interface Income {
  id: number
  user_id: number
  amount: number
  frequency: string
  source: string
  date: string
  created_at: string
}

export interface Expense {
  id: number
  user_id: number
  amount: number
  category: string
  description: string
  merchant: string
  use_case: string
  raw_chat_input: string
  source: string
  import_batch_id: number | null
  date: string
  household_id: number | null
  tax_deductible: boolean
  tax_category: string | null
  receipt_url: string | null
  created_at: string
}

export interface ExpenseSplit {
  id: number
  expense_id: number
  user_id: number
  amount: number
  category: string
  description: string
  created_at: string
}

export interface ImportPreviewRow {
  date: string
  description: string
  amount: number
  direction: string
  category_guess: string
  is_duplicate: boolean
  dedupe_hash: string
  include: boolean
}

export interface ImportPreviewResponse {
  bank_name: string
  rows: ImportPreviewRow[]
  duplicate_count: number
  total_count: number
}

export interface ImportConfirmRequest {
  rows: ImportPreviewRow[]
}

export interface ImportBatch {
  id: number
  filename: string
  bank_name: string
  row_count: number
  status: string
  created_at: string
}

export interface SpendingRule {
  id: number
  user_id: number
  category: string
  max_amount: number
  period: string
  is_active: boolean
  created_at: string
}

export interface InvestmentGoal {
  id: number
  user_id: number
  name: string
  target_amount: number
  current_amount: number
  monthly_contribution: number
  expected_return_rate: number
  start_date: string
  created_at: string
}

export interface UserGoal {
  id: number
  user_id: number
  type: string
  target_amount: number
  target_date: string | null
  monthly_contribution: number
  expected_return_rate: number
  created_at: string
}

export interface ExpenseStats {
  this_month_total: number
  last_month_total: number
  category_breakdown: { category: string; total: number; count: number }[]
  monthly_trend: { year: number; month: number; total: number }[]
}

export interface AnalysisResult {
  projected_growth: Record<string, number>
  impact: string
  context: string
  verdict: string
  disclaimer: string
  return_rate_used: number
}

export interface InvestmentOption {
  name: string
  expected_return: number
  monthly_investment: number
  total_invested: number
  final_value: number
  risk: string
}

export interface DetectedSubscription {
  merchant: string
  amount: number
  category: string
  frequency: string
  confidence: string
  last_date: string
  occurrences: number
  days_of_month: number[]
}

export interface SubscriptionDetectResponse {
  subscriptions: DetectedSubscription[]
  total_monthly: number
  total_yearly: number
}

export interface AccountData {
  id: number
  user_id: number
  name: string
  type: string
  balance: number
  institution: string
  created_at: string
  updated_at: string
}

export interface NetWorthResponse {
  total_assets: number
  total_liabilities: number
  net_worth: number
  account_count: number
}

export interface InvestmentAssistantResponse {
  target_return: number
  years: number
  options: InvestmentOption[]
  disclaimer: string
}

export interface BudgetCategoryInfo {
  category: string
  assigned_amount: number
  spent_amount: number
  remaining: number
}

export interface Fund {
  id: number
  user_id: number
  name: string
  type: string
  current_amount: number
  monthly_contribution: number
  goal_id: number | null
  created_at: string
}

export interface AgentAction {
  type: string
  payload: Record<string, unknown>
}

export interface Budget {
  id: number
  user_id: number
  month: number
  year: number
  total_income: number
  is_active: boolean
  categories: BudgetCategoryInfo[]
  total_assigned: number
  total_spent: number
  total_remaining: number
  created_at: string
  updated_at: string
}

export interface Holding {
  id: number
  user_id: number
  ticker: string
  shares: number
  cost_basis: number
  account_id: number | null
  notes: string
  created_at: string
  updated_at: string
}

export interface PortfolioHolding {
  id: number
  ticker: string
  shares: number
  cost_basis: number
  current_price: number
  change_pct: number
  current_value: number
  gain_loss: number
  gain_loss_pct: number
  notes: string
  price_unavailable: boolean
  price_as_of?: string
}

export interface PortfolioResponse {
  holdings: PortfolioHolding[]
  total_value: number
  total_cost: number
  total_gain_loss: number
  total_gain_loss_pct: number
}

export interface NetWorthSnapshot {
  id: number
  total_assets: number
  total_liabilities: number
  net_worth: number
  snapshot_date: string
  created_at: string
}

export interface NetWorthHistoryResponse {
  snapshots: NetWorthSnapshot[]
  change_1m: number | null
  change_3m: number | null
  change_6m: number | null
}

export interface RecurringTransaction {
  id: number
  user_id: number
  type: string
  amount: number
  category: string
  description: string
  merchant: string
  frequency: string
  interval_days: number | null
  next_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
}

export interface UpcomingOccurrence {
  recurring_id: number
  type: string
  amount: number
  category: string
  description: string
  merchant: string
  due_date: string
}

export interface UpcomingResponse {
  occurrences: UpcomingOccurrence[]
  total: number
}

export interface Household {
  id: number
  name: string
  invite_code: string | null
  created_by: number
  created_at: string
}

export interface HouseholdMember {
  id: number
  household_id: number
  user_id: number
  role: string
  joined_at: string
  user_name: string
  user_email: string
}

export interface HouseholdDetail {
  household: Household
  members: HouseholdMember[]
  is_owner: boolean
  is_admin: boolean
}
