import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import type { Budget } from '../types'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'
import MetricCard from '../components/MetricCard'
import { useToast } from '../components/Toast'
import { formatAmount, getCurrencySymbol } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'
import { useHousehold } from '../hooks/useHousehold'
import { CATEGORY_COLORS } from '../utils/colors'

type BudgetStyle = 'zero-based' | 'envelope'

export default function BudgetPage() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [assignments, setAssignments] = useState<Record<string, number>>({})
  const [income, setIncome] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [style, setStyle] = useState<BudgetStyle>(() => {
    return (localStorage.getItem('budget_style') as BudgetStyle) || 'zero-based'
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const { currency } = useCurrency()
  const symbol = getCurrencySymbol(currency)
  const { activeHouseholdId } = useHousehold()
  const { toast } = useToast()

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1)
    window.addEventListener('lucid-data-changed', handler)
    return () => window.removeEventListener('lucid-data-changed', handler)
  }, [])

  const fetchBudget = useCallback(async () => {
    setLoading(true)
    try {
      let res
      const now = new Date()
      const hhParam = activeHouseholdId ? { household_id: activeHouseholdId } : {}
      if (month === now.getMonth() + 1 && year === now.getFullYear()) {
        res = await api.get('/budgets/current', { params: hhParam })
      } else {
        const all = await api.get('/budgets', { params: hhParam })
        const found = all.data.find(
          (b: Budget) => b.month === month && b.year === year
        )
        if (found) {
          res = { data: found }
        } else {
          const payload: any = { month, year, total_income: 0 }
          if (activeHouseholdId) payload.household_id = activeHouseholdId
          res = await api.post('/budgets', payload)
        }
      }
      setBudget(res.data)
      setIncome(res.data.total_income)
      const map: Record<string, number> = {}
      for (const c of res.data.categories) {
        map[c.category] = c.assigned_amount
      }
      setAssignments(map)
    } catch {
      toast('Failed to load budget', 'error')
    } finally {
      setLoading(false)
    }
  }, [month, year, refreshKey, activeHouseholdId])

  useEffect(() => {
    fetchBudget()
  }, [fetchBudget])

  useEffect(() => {
    localStorage.setItem('budget_style', style)
  }, [style])

  const totalAssigned = Object.values(assignments).reduce((s, v) => s + v, 0)
  const unassigned = income - totalAssigned

  const handleSave = async () => {
    if (!budget) return
    setSaving(true)
    try {
      const data = Object.entries(assignments)
        .filter(([, v]) => v > 0)
        .map(([category, assigned_amount]) => ({ category, assigned_amount }))
      await api.put(`/budgets/${budget.id}/categories`, data)
      if (income !== budget.total_income) {
        await api.put(`/budgets/${budget.id}`, { total_income: income })
      }
      await fetchBudget()
      toast('Budget saved', 'success')
    } catch {
      toast('Failed to save budget', 'error')
    } finally {
      setSaving(false)
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const goPrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(y => y - 1)
    } else {
      setMonth(m => m - 1)
    }
  }

  const goNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(y => y + 1)
    } else {
      setMonth(m => m + 1)
    }
  }

  const spentTotal = budget?.total_spent || 0

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Budget</h1>
        <p className="text-ash text-sm mt-1">Assign every dollar a job</p>
      </div>

      {/* Month selector + style toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={goPrevMonth} className="text-ash hover:text-ivory transition-colors p-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="text-ivory font-medium text-base min-w-[140px] text-center">
            {monthNames[month - 1]} {year}
          </span>
          <button onClick={goNextMonth} className="text-ash hover:text-ivory transition-colors p-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-[#272735] rounded-lg p-1">
          <button
            onClick={() => setStyle('envelope')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              style === 'envelope' ? 'bg-[#5266eb] text-ivory' : 'text-ash hover:text-ivory'
            }`}
          >
            Envelope
          </button>
          <button
            onClick={() => setStyle('zero-based')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              style === 'zero-based' ? 'bg-[#5266eb] text-ivory' : 'text-ash hover:text-ivory'
            }`}
          >
            Zero-Based
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#5266eb] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !budget ? (
        <GlassCard className="p-8 text-center" hover={false}>
          <p className="text-ash text-sm">Could not load budget. Try again.</p>
        </GlassCard>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Monthly Income"
              value={formatAmount(income, currency)}
              delay={0}
            />
            <MetricCard
              label="Total Assigned"
              value={formatAmount(totalAssigned, currency)}
              delay={100}
            />
            <MetricCard
              label="Total Spent"
              value={formatAmount(spentTotal, currency)}
              delay={200}
            />
            <MetricCard
              label="Remaining"
              value={formatAmount(income - spentTotal, currency)}
              trendUp={income >= spentTotal}
              delay={300}
            />
          </div>

          {/* Unassigned (zero-based mode) */}
          {style === 'zero-based' && (
            <GlassCard className="p-4" hover={false} delay={0.1}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ash">Unassigned</span>
                <span className={`text-sm font-medium ${unassigned < 0 ? 'text-red-400' : unassigned === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatAmount(unassigned, currency)}
                </span>
              </div>
              <div className="text-xs text-ash mt-1">
                {unassigned < 0
                  ? `Over-assigned by ${formatAmount(Math.abs(unassigned), currency)} — reduce some categories`
                  : unassigned === 0
                  ? 'Every dollar has a job'
                  : `${formatAmount(unassigned, currency)} still needs a job`}
              </div>
            </GlassCard>
          )}

          {/* Income input */}
          <GlassCard className="p-4" hover={false} delay={0.15}>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm text-ash shrink-0">Income this month:</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ash text-sm">{symbol}</span>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="pl-8 pr-4 py-2 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors w-full sm:w-36"
                />
              </div>
              <span className="text-xs text-ash">Auto-filled from latest income record</span>
            </div>
          </GlassCard>

          {/* Category assignments */}
          <div className="space-y-2">
            {budget.categories.map((cat, i) => {
              const assigned = assignments[cat.category] || 0
              const spent = cat.spent_amount
              const remaining = assigned - spent
              const pct = assigned > 0 ? Math.min(100, (spent / assigned) * 100) : 0

              return (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <GlassCard className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-0 sm:block w-full sm:w-auto">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 sm:mb-2"
                          style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#6b7280' }}
                        />
                        <span className="text-sm text-ivory font-medium ml-2 sm:ml-0">{cat.category}</span>
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ash">{symbol}</span>
                              <input
                                type="number"
                                value={assigned || ''}
                                onChange={(e) => setAssignments(prev => ({
                                  ...prev,
                                  [cat.category]: Number(e.target.value) || 0,
                                }))}
                                placeholder="0"
                                className="w-24 pl-7 pr-2.5 py-1.5 bg-[#272735] text-ivory rounded-lg text-xs border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]"
                              />
                            </div>
                            <span className="text-xs text-ash tabular-nums whitespace-nowrap">
                              Spent: {formatAmount(spent, currency)}
                            </span>
                            <span
                              className={`text-xs font-medium tabular-nums whitespace-nowrap ${
                                remaining >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {remaining >= 0 ? 'Left: ' : 'Over: '}
                              {formatAmount(Math.abs(remaining), currency)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-[rgba(237,237,243,0.06)] rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              spent > assigned ? 'bg-red-400' : 'bg-[#5266eb]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>

          {/* Save */}
          <div className="flex gap-3 items-center pt-2">
            <PillButton onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Budget'}
            </PillButton>
            {budget.total_assigned !== totalAssigned && (
              <span className="text-xs text-amber-400">Unsaved changes</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
