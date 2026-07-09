import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import type { ExpenseStats, Income, InvestmentGoal, UserGoal, NetWorthResponse, Budget, AccountData } from '../types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import MetricCard from '../components/MetricCard'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'
import ProgressRing from '../components/ProgressRing'
import { formatAmount, getCurrencySymbol } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'
import { getCategoryColor } from '../utils/colors'

const ALL_WIDGETS = [
  { id: 'metrics', label: 'Metric Cards' },
  { id: 'trend', label: 'Spending Trend' },
  { id: 'pie', label: 'Category Pie Chart' },
  { id: 'breakdown', label: 'Category Breakdown' },
  { id: 'goals', label: 'Goals Progress' },
  { id: 'loans', label: 'Loans & Debt' },
  { id: 'budget', label: 'Budget Overview' },
  { id: 'suggestions', label: 'AI Suggestions' },
] as const

type WidgetId = typeof ALL_WIDGETS[number]['id']

const DEFAULT_WIDGETS: WidgetId[] = ['metrics', 'budget', 'loans', 'breakdown']

function loadWidgets(): Set<WidgetId> {
  try {
    const stored = JSON.parse(localStorage.getItem('dashboard_widgets') || 'null')
    if (Array.isArray(stored)) return new Set(stored)
  } catch {}
  return new Set(DEFAULT_WIDGETS)
}

const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities',
  'Entertainment', 'Health & Fitness', 'Education', 'Housing',
  'Travel', 'Groceries', 'Subscription', 'Other',
]

export default function Dashboard() {
  const [stats, setStats] = useState<ExpenseStats | null>(null)
  const [income, setIncome] = useState<Income | null>(null)
  const [invGoals, setInvGoals] = useState<InvestmentGoal[]>([])
  const [userGoals, setUserGoals] = useState<UserGoal[]>([])
  const [netWorth, setNetWorth] = useState<NetWorthResponse | null>(null)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [accounts, setAccounts] = useState<AccountData[]>([])
  const [suggestions, setSuggestions] = useState<{ category: string; suggested_max: number; current_spend: number; reason: string }[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [widgets, setWidgets] = useState<Set<WidgetId>>(loadWidgets)
  const [showCustomize, setShowCustomize] = useState(false)
  const navigate = useNavigate()
  const { currency } = useCurrency()
  const symbol = getCurrencySymbol(currency)

  // Quick expense state
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAmount, setQuickAmount] = useState('')
  const [quickCategory, setQuickCategory] = useState('Food & Dining')
  const [quickDescription, setQuickDescription] = useState('')
  const [quickSuccess, setQuickSuccess] = useState(false)
  const quickRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1)
    window.addEventListener('lucid-data-changed', handler)
    return () => window.removeEventListener('lucid-data-changed', handler)
  }, [])

  useEffect(() => {
    api.get('/expenses/stats').then(r => setStats(r.data)).catch(() => {})
    api.get('/income/latest').then(r => setIncome(r.data)).catch(() => {})
    api.get('/goals/investment').then(r => setInvGoals(r.data)).catch(() => {})
    api.get('/goals/user-goals').then(r => setUserGoals(r.data)).catch(() => {})
    api.get('/accounts/net-worth').then(r => setNetWorth(r.data)).catch(() => {})
    api.get('/budgets/current').then(r => setBudget(r.data)).catch(() => {})
    api.get('/accounts').then(r => setAccounts(r.data)).catch(() => {})
    api.post('/ai/rules-suggestions').then(r => setSuggestions(r.data.suggestions || [])).catch(() => {})
  }, [refreshKey])

  useEffect(() => {
    localStorage.setItem('dashboard_widgets', JSON.stringify([...widgets]))
  }, [widgets])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setShowQuickAdd(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleWidget = (id: WidgetId) => {
    setWidgets(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const w = (id: WidgetId) => widgets.has(id)

  const trendData = (stats?.monthly_trend || []).map(t => ({
    month: `${t.year}-${String(t.month).padStart(2, '0')}`,
    total: t.total,
  }))

  const pieData = (stats?.category_breakdown || []).filter(c => c.total > 0)

  const savingsRate = income && stats
    ? (((income.amount - stats.this_month_total) / income.amount) * 100).toFixed(1)
    : null

  const savingsRateNum = Number(savingsRate)

  // Quick expense
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAmount) return
    try {
      await api.post('/expenses', {
        amount: Number(quickAmount),
        category: quickCategory,
        description: quickDescription || `Quick expense`,
        merchant: '',
        date: new Date().toISOString().split('T')[0],
      })
      setQuickAmount('')
      setQuickDescription('')
      setQuickSuccess(true)
      setTimeout(() => setQuickSuccess(false), 2000)
      window.dispatchEvent(new CustomEvent('lucid-data-changed'))
    } catch {
      // ignore
    }
  }

  // Liabilities for loan widget
  const liabilities = accounts.filter(a => a.type === 'credit_card' || a.type === 'loan')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Dashboard</h1>
          <p className="text-ash text-sm mt-1">Your financial overview at a glance</p>
        </div>
        <button
          onClick={() => setShowCustomize(!showCustomize)}
          className="text-xs text-ash hover:text-ivory transition-colors flex items-center gap-1.5 bg-[#272735] px-3 py-1.5 rounded-lg"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          Customize
        </button>
      </div>

      {/* Customize Panel */}
      {showCustomize && (
        <GlassCard className="p-4" hover={false}>
          <div className="flex flex-wrap gap-3">
            {ALL_WIDGETS.map(widget => (
              <button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  widgets.has(widget.id) ? 'bg-[#5266eb] text-ivory' : 'bg-[#272735] text-ash hover:text-ivory'
                }`}
              >
                {widget.label}
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Quick Expense */}
      <div ref={quickRef} className="relative">
        {!showQuickAdd ? (
          <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            <PillButton onClick={() => setShowQuickAdd(true)}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add Expense
            </PillButton>
            <PillButton variant="outline" onClick={() => navigate('/expenses')}>
              View All Expenses
            </PillButton>
          </div>
        ) : (
          <GlassCard className="p-4" hover={false}>
            <form onSubmit={handleQuickAdd} className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ash text-sm">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={quickAmount}
                  onChange={e => setQuickAmount(e.target.value)}
                  className="pl-8 pr-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-base border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors w-36"
                  autoFocus
                  required
                />
              </div>
              <select
                value={quickCategory}
                onChange={e => setQuickCategory(e.target.value)}
                className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-base border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="text"
                placeholder="Description (optional)"
                value={quickDescription}
                onChange={e => setQuickDescription(e.target.value)}
                className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-base border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d] flex-1 min-w-[140px]"
              />
              <PillButton type="submit" disabled={!quickAmount}>
                {quickSuccess ? 'Saved!' : 'Log Expense'}
              </PillButton>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="text-sm text-ash hover:text-ivory transition-colors px-2 py-1"
              >
                Cancel
              </button>
            </form>
          </GlassCard>
        )}
      </div>

      {/* Metric Cards */}
      {w('metrics') && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard label="Monthly Income" value={formatAmount(income?.amount || 0, currency)} delay={0} />
          <MetricCard
            label="Spent This Month"
            value={formatAmount(stats?.this_month_total || 0, currency)}
            trend={stats ? `vs ${formatAmount(stats.last_month_total, currency)} last month` : undefined}
            trendUp={stats ? stats.this_month_total > stats.last_month_total : undefined}
            delay={100}
          />
          <MetricCard
            label="Savings Rate"
            value={savingsRate ? `${savingsRate}%` : 'N/A'}
            trend={savingsRateNum >= 20 ? 'On track' : 'Could improve'}
            trendUp={savingsRateNum >= 20}
            delay={200}
          />
          <MetricCard
            label="Net Worth"
            value={netWorth ? formatAmount(netWorth.net_worth, currency) : '--'}
            trendUp={netWorth ? netWorth.net_worth >= 0 : undefined}
            delay={300}
          />
          <MetricCard label="Transactions" value={String(stats?.category_breakdown.reduce((s, c) => s + c.count, 0) || 0)} delay={400} />
        </div>
      )}

      {/* Charts */}
      {(w('trend') || w('pie')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {w('trend') && (
            <GlassCard className="p-5" delay={0.1}>
              <h2 className="text-sm font-medium text-ivory mb-4" style={{ fontWeight: 500 }}>Monthly Spending Trend</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <XAxis dataKey="month" tick={{ fill: '#d4d4dd', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#d4d4dd', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e1e2a', border: '1px solid rgba(237,237,243,0.08)', borderRadius: 8, color: '#ededf3' }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#5266eb" strokeWidth={2} dot={{ r: 3, fill: '#5266eb' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {w('pie') && (
            <GlassCard className="p-5" delay={0.2}>
              <h2 className="text-sm font-medium text-ivory mb-4" style={{ fontWeight: 500 }}>Spending by Category</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={getCategoryColor(entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e1e2a', border: '1px solid rgba(237,237,243,0.08)', borderRadius: 8, color: '#ededf3' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>
          )}
        </div>
      )}

      {/* Category Breakdown & Goals & Loans & Budget */}
      {(w('breakdown') || w('goals') || w('loans') || w('budget')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {w('breakdown') && (
              <GlassCard className="p-5" delay={0.3}>
                <h2 className="text-sm font-medium text-ivory mb-4" style={{ fontWeight: 500 }}>Category Breakdown</h2>
                <div className="space-y-3">
                  {pieData.map((c) => {
                    const pct = stats?.this_month_total ? (c.total / stats.this_month_total) * 100 : 0
                    return (
                      <div key={c.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-ivory">{c.category}</span>
                          <span className="text-ash">{formatAmount(c.total, currency)}</span>
                        </div>
                        <div className="w-full h-2 bg-[rgba(237,237,243,0.06)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: getCategoryColor(c.category) }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </GlassCard>
            )}

            {/* Loans & Debt Widget */}
            {w('loans') && (
              <GlassCard className="p-5" delay={0.35}>
                <h2 className="text-sm font-medium text-ivory mb-4" style={{ fontWeight: 500 }}>Loans & Debt</h2>
                {liabilities.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="w-8 h-8 text-emerald-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <p className="text-sm text-ash">No debt tracked</p>
                    <p className="text-xs text-ash mt-1">Add credit cards or loans on the Accounts page</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-[rgba(237,237,243,0.06)]">
                      <span className="text-xs text-ash uppercase tracking-wide font-medium">Total Debt</span>
                      <span className="text-base font-semibold text-red-400">
                        {formatAmount(liabilities.reduce((s, a) => s + Math.abs(a.balance), 0), currency)}
                      </span>
                    </div>
                    {liabilities.map(a => {
                      const pct = 100 - Math.min(100, (Math.abs(a.balance) / (Math.abs(a.balance) + 1)) * 100)
                      return (
                        <div key={a.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${a.type === 'loan' ? 'bg-red-400' : 'bg-orange-400'}`} />
                              <span className="text-sm text-ivory truncate">{a.name}</span>
                              {a.institution && (
                                <span className="text-xs text-ash hidden sm:inline">{a.institution}</span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-red-400 shrink-0 ml-2">
                              {formatAmount(Math.abs(a.balance), currency)}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[rgba(237,237,243,0.06)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, pct)}%`,
                                backgroundColor: pct > 75 ? '#10b981' : pct > 50 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    <PillButton variant="outline" onClick={() => navigate('/accounts')} className="w-full mt-2">
                      Manage Accounts
                    </PillButton>
                  </div>
                )}
              </GlassCard>
            )}
          </div>

          <div className="space-y-6">
            {w('goals') && userGoals.length > 0 && (
              <GlassCard className="p-5" delay={0.35}>
                <h2 className="text-sm font-medium text-ivory mb-4" style={{ fontWeight: 500 }}>Savings Goals</h2>
                {userGoals.map(g => {
                  const pct = income ? Math.min(100, ((income.amount - (stats?.this_month_total || 0)) / g.target_amount) * 100) : 0
                  return (
                    <div key={g.id} className="flex items-center gap-4">
                      <ProgressRing progress={pct} size={56} strokeWidth={3} label={`${Math.round(pct)}%`} />
                      <div className="flex-1">
                        <p className="text-sm text-ivory capitalize">{g.type.replace('_', ' ')}</p>
                        <p className="text-xs text-ash">{formatAmount(g.target_amount, currency)} target</p>
                      </div>
                    </div>
                  )
                })}
              </GlassCard>
            )}

            {w('goals') && invGoals.length > 0 && (
              <GlassCard className="p-5" delay={0.4}>
                <h2 className="text-sm font-medium text-ivory mb-4" style={{ fontWeight: 500 }}>Investment Goals</h2>
                {invGoals.map(g => {
                  const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
                  return (
                    <div key={g.id} className="flex items-center gap-4">
                      <ProgressRing progress={pct} size={56} strokeWidth={3} label={`${Math.round(pct)}%`} />
                      <div className="flex-1">
                        <p className="text-sm text-ivory">{g.name}</p>
                        <p className="text-xs text-ash">{formatAmount(g.current_amount, currency)} of {formatAmount(g.target_amount, currency)}</p>
                      </div>
                    </div>
                  )
                })}
              </GlassCard>
            )}

            {w('budget') && budget && (
              <GlassCard className="p-5" delay={0.42}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-ivory" style={{ fontWeight: 500 }}>Budget Overview</h2>
                  <span className="text-xs text-ash">{budget.month}/{budget.year}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-ash">
                    <span>Assigned</span>
                    <span className="text-ivory">{formatAmount(budget.total_assigned, currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-ash">
                    <span>Spent</span>
                    <span className="text-ivory">{formatAmount(budget.total_spent, currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-ash">
                    <span>Remaining</span>
                    <span className={budget.total_remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {formatAmount(budget.total_remaining, currency)}
                    </span>
                  </div>
                  {budget.total_assigned > 0 && (
                    <div className="w-full h-2 bg-[rgba(237,237,243,0.06)] rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (budget.total_spent / budget.total_assigned) * 100)}%`,
                          backgroundColor: budget.total_spent > budget.total_assigned ? '#ef4444' : '#5266eb',
                        }}
                      />
                    </div>
                  )}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {w('suggestions') && suggestions.length > 0 && (
        <GlassCard className="p-5" hover={false} delay={0.45}>
          <h2 className="text-sm font-medium text-ivory mb-4" style={{ fontWeight: 500 }}>Suggestions</h2>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="flex gap-3 text-sm text-ash bg-[rgba(82,102,235,0.06)] p-3 rounded-lg">
                <span className="text-accent shrink-0 mt-0.5">&bull;</span>
                <span>{s.reason}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
