export interface User {
  id: number
  email: string
  name: string
  currency: string
  is_active: boolean
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
  date: string
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
