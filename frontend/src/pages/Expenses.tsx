import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import type { Expense } from '../types'
import GlassCard from '../components/GlassCard'
import PillBadge from '../components/PillBadge'
import { LoadingList } from '../components/LoadingSkeleton'
import { useToast } from '../components/Toast'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'
import { getCategoryColor } from '../utils/colors'

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [refreshKey, setRefreshKey] = useState(0)
  const { currency } = useCurrency()
  const { toast } = useToast()

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1)
    window.addEventListener('lucid-data-changed', handler)
    return () => window.removeEventListener('lucid-data-changed', handler)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: any = { month, year }
    if (filter) params.category = filter
    api.get('/expenses', { params }).then(r => setExpenses(r.data)).catch(() => {
      toast('Failed to load expenses', 'error')
    }).finally(() => setLoading(false))
  }, [filter, month, year, refreshKey])

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities',
    'Entertainment', 'Health & Fitness', 'Education', 'Housing',
    'Travel', 'Groceries', 'Subscription', 'Other',
  ]

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Expenses</h1>
        <p className="text-ash text-sm mt-1">Review and filter your transactions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-4 py-2 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-4 py-2 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
        >
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex-1" />
        <div className="text-sm text-ash">
          Total: <span className="text-ivory font-semibold">{formatAmount(total, currency)}</span>
        </div>
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(237,237,243,0.06)]">
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider">Date</th>
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider">Category</th>
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider hidden sm:table-cell">Description</th>
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider hidden sm:table-cell">Merchant</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4">
                    <LoadingList rows={5} />
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-ash text-sm">No expenses found for this period</td>
                </tr>
              ) : (
                expenses.map((exp, i) => (
                  <motion.tr
                    key={exp.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.2 }}
                    className="border-b border-[rgba(237,237,243,0.03)] hover:bg-[rgba(237,237,243,0.02)] transition-colors"
                  >
                    <td className="px-4 md:px-5 py-3 text-ash whitespace-nowrap">{exp.date}</td>
                    <td className="px-4 md:px-5 py-3 text-ivory font-medium whitespace-nowrap">{formatAmount(exp.amount, currency)}</td>
                    <td className="px-4 md:px-5 py-3">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(exp.category) }} />
                        <PillBadge variant="accent">{exp.category}</PillBadge>
                      </span>
                    </td>
                    <td className="px-4 md:px-5 py-3 text-ash hidden sm:table-cell">{exp.description}</td>
                    <td className="px-4 md:px-5 py-3 text-ash hidden sm:table-cell">{exp.merchant}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
