import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import type { Expense, ExpenseSplit } from '../types'
import GlassCard from '../components/GlassCard'
import PillBadge from '../components/PillBadge'
import { LoadingList } from '../components/LoadingSkeleton'
import { useToast } from '../components/Toast'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'
import { useHousehold } from '../hooks/useHousehold'
import { usePagination } from '../hooks/usePagination'
import Pagination from '../components/Pagination'
import { getCategoryColor } from '../utils/colors'

const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities',
  'Entertainment', 'Health & Fitness', 'Education', 'Housing',
  'Travel', 'Groceries', 'Subscription', 'Other',
]

export default function Expenses() {
  const { activeHouseholdId } = useHousehold()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [taxFilter, setTaxFilter] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [refreshKey, setRefreshKey] = useState(0)
  const { currency } = useCurrency()
  const { toast } = useToast()
  const pag = usePagination(20)

  // Split modal state
  const [splitExpense, setSplitExpense] = useState<Expense | null>(null)
  const [splits, setSplits] = useState<ExpenseSplit[]>([])
  const [splitForm, setSplitForm] = useState({ amount: '', category: 'Other', description: '' })

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1)
    window.addEventListener('lucid-data-changed', handler)
    return () => window.removeEventListener('lucid-data-changed', handler)
  }, [])

  const fetchExpenses = useCallback(() => {
    setLoading(true)
    const params: any = { month, year, offset: pag.offset, limit: pag.limit }
    if (filter) params.category = filter
    if (taxFilter === 'yes') params.tax_deductible = true
    else if (taxFilter === 'no') params.tax_deductible = false
    if (activeHouseholdId) params.household_id = activeHouseholdId
    api.get('/expenses', { params }).then(r => {
      setExpenses(r.data.items)
      pag.setTotal(r.data.total)
    }).catch(() => {
      toast('Failed to load expenses', 'error')
    }).finally(() => setLoading(false))
  }, [filter, taxFilter, month, year, refreshKey, activeHouseholdId, pag.offset, pag.limit])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Reset offset when filters change
  useEffect(() => {
    pag.goToPage(0)
  }, [filter, taxFilter, month, year, activeHouseholdId])

  useEffect(() => {
    if (splitExpense) {
      api.get(`/expenses/${splitExpense.id}/splits`).then(r => setSplits(r.data)).catch(() => {})
    }
  }, [splitExpense])

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const handleUploadReceipt = async (expenseId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post(`/expenses/${expenseId}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast('Receipt uploaded', 'success')
      setRefreshKey(k => k + 1)
    } catch {
      toast('Failed to upload receipt', 'error')
    }
  }

  const handleAddSplit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!splitExpense) return
    try {
      await api.post(`/expenses/${splitExpense.id}/splits`, {
        ...splitForm,
        amount: parseFloat(splitForm.amount),
      })
      setSplitForm({ amount: '', category: 'Other', description: '' })
      const res = await api.get(`/expenses/${splitExpense.id}/splits`)
      setSplits(res.data)
      toast('Split added', 'success')
    } catch {
      toast('Failed to add split', 'error')
    }
  }

  const totalSplitAmount = splits.reduce((s, sp) => s + sp.amount, 0)

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Expenses</h1>
        <p className="text-ash text-sm mt-1">Review and filter your transactions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={taxFilter} onChange={(e) => setTaxFilter(e.target.value)}
          className="px-4 py-2 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors">
          <option value="">All Tax Status</option>
          <option value="yes">Tax Deductible</option>
          <option value="no">Non-deductible</option>
        </select>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
          className="px-4 py-2 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="px-4 py-2 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <Link to="/import">
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-[#5266eb] text-white hover:brightness-110 transition-all flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Statement
          </button>
        </Link>
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
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider hidden md:table-cell">Tags</th>
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider hidden lg:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <LoadingList rows={5} />
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-ash text-sm">No expenses found for this period</td>
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
                    <td className="px-4 md:px-5 py-3 text-ash hidden sm:table-cell max-w-[160px] truncate">{exp.description}</td>
                    <td className="px-4 md:px-5 py-3 text-ash hidden sm:table-cell">{exp.merchant}</td>
                    <td className="px-4 md:px-5 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {exp.source === 'import' ? (
                          <PillBadge variant="success">Imported</PillBadge>
                        ) : exp.source === 'ai_chat' ? (
                          <PillBadge variant="accent">AI</PillBadge>
                        ) : (
                          <PillBadge variant="default">Manual</PillBadge>
                        )}
                        {exp.tax_deductible && (
                          <PillBadge variant="success">Tax</PillBadge>
                        )}
                        {exp.receipt_url && (
                          <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-[#9cb4e8] hover:underline">Receipt</a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-5 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-ash hover:text-ivory cursor-pointer transition-colors flex items-center gap-1">
                          <input
                            type="file" accept="image/*,.pdf" className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUploadReceipt(exp.id, file)
                              e.target.value = ''
                            }}
                          />
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          Receipt
                        </label>
                        <button
                          onClick={() => setSplitExpense(exp)}
                          className="text-xs text-ash hover:text-[#9cb4e8] transition-colors"
                        >
                          Split
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Pagination page={pag.page} totalPages={pag.totalPages} hasPrev={pag.hasPrev} hasNext={pag.hasNext} onPrev={pag.prevPage} onNext={pag.nextPage} onGoTo={pag.goToPage} />

      {/* Split Modal */}
      <AnimatePresence>
        {splitExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSplitExpense(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1e2a] border border-[rgba(237,237,243,0.08)] rounded-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ivory">Split Expense</h2>
                <button onClick={() => setSplitExpense(null)} className="text-ash hover:text-ivory transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <p className="text-sm text-ash">
                Splitting <span className="text-ivory font-medium">{formatAmount(splitExpense.amount, currency)}</span> — {splitExpense.description || splitExpense.category}
              </p>

              {/* Existing splits */}
              {splits.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-ash font-medium uppercase tracking-wider">Splits ({formatAmount(totalSplitAmount, currency)} / {formatAmount(splitExpense.amount, currency)})</p>
                  {splits.map(sp => (
                    <div key={sp.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[rgba(237,237,243,0.03)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(sp.category) }} />
                        <span className="text-sm text-ivory">{sp.category}</span>
                        {sp.description && <span className="text-xs text-ash">— {sp.description}</span>}
                      </div>
                      <span className="text-sm text-ivory font-medium">{formatAmount(sp.amount, currency)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add split form */}
              <form onSubmit={handleAddSplit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ash mb-1">Amount</label>
                    <input type="number" step="0.01" required placeholder="0.00" value={splitForm.amount}
                      onChange={e => setSplitForm(f => ({ ...f, amount: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#14141e] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-ash mb-1">Category</label>
                    <select value={splitForm.category} onChange={e => setSplitForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#14141e] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-ash mb-1">Description (optional)</label>
                  <input type="text" placeholder="e.g. My portion" value={splitForm.description}
                    onChange={e => setSplitForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#14141e] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors" />
                </div>
                <button type="submit"
                  className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-[#5266eb] text-white hover:brightness-110 transition-all">
                  Add Split
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
