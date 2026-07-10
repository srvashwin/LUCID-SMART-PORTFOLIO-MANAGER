import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import type { Income } from '../types'
import GlassCard from '../components/GlassCard'
import PillBadge from '../components/PillBadge'
import { LoadingList } from '../components/LoadingSkeleton'
import { useToast } from '../components/Toast'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'
import { useHousehold } from '../hooks/useHousehold'

export default function Incomes() {
  const { activeHouseholdId } = useHousehold()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Income | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { currency } = useCurrency()
  const { toast } = useToast()

  const [form, setForm] = useState({ amount: '', source: '', frequency: 'monthly', date: '' })

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1)
    window.addEventListener('lucid-data-changed', handler)
    return () => window.removeEventListener('lucid-data-changed', handler)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: any = {}
    if (activeHouseholdId) params.household_id = activeHouseholdId
    api.get('/income', { params }).then(r => setIncomes(r.data)).catch(() => {
      toast('Failed to load income', 'error')
    }).finally(() => setLoading(false))
  }, [refreshKey, activeHouseholdId])

  const total = incomes.reduce((s, inc) => s + inc.amount, 0)

  const resetForm = () => {
    setForm({ amount: '', source: '', frequency: 'monthly', date: '' })
    setEditing(null)
    setShowAdd(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      ...form,
      amount: parseFloat(form.amount),
      household_id: activeHouseholdId || undefined,
    }
    try {
      if (editing) {
        await api.patch(`/income/${editing.id}`, body)
        toast('Income updated', 'success')
      } else {
        await api.post('/income', body)
        toast('Income added', 'success')
      }
      resetForm()
      setRefreshKey(k => k + 1)
    } catch {
      toast('Failed to save income', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this income entry?')) return
    try {
      await api.delete(`/income/${id}`)
      toast('Income deleted', 'success')
      setRefreshKey(k => k + 1)
    } catch {
      toast('Failed to delete income', 'error')
    }
  }

  const startEdit = (inc: Income) => {
    setForm({
      amount: String(inc.amount),
      source: inc.source,
      frequency: inc.frequency,
      date: inc.date,
    })
    setEditing(inc)
    setShowAdd(true)
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Income</h1>
        <p className="text-ash text-sm mt-1">Track your income sources</p>
      </div>

      {/* Summary + Add button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-ash">
          Total income: <span className="text-emerald-400 font-semibold">{formatAmount(total, currency)}</span>
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(!showAdd) }}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-[#5266eb] text-white hover:brightness-110 transition-all flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showAdd ? 'Cancel' : 'Add Income'}
        </button>
      </div>

      {/* Add / Edit form */}
      {showAdd && (
        <GlassCard hover={false}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-ash mb-1">Amount</label>
              <input
                type="number" step="0.01" required placeholder="0.00"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2 bg-[#14141e] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ash mb-1">Source</label>
              <input
                type="text" required placeholder="Salary / Freelance"
                value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="w-full px-3 py-2 bg-[#14141e] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ash mb-1">Frequency</label>
              <select
                value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                className="w-full px-3 py-2 bg-[#14141e] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
              >
                <option value="once">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ash mb-1">Date</label>
              <input
                type="date" required
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 bg-[#14141e] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
              />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium bg-[#5266eb] text-white hover:brightness-110 transition-all">
                {editing ? 'Update' : 'Add'}
              </button>
              {editing && (
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium text-ash hover:text-ivory transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </GlassCard>
      )}

      {/* Table */}
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(237,237,243,0.06)]">
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider">Date</th>
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider hidden sm:table-cell">Source</th>
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider hidden sm:table-cell">Frequency</th>
                <th className="text-left px-4 md:px-5 py-3 text-xs font-medium text-ash uppercase tracking-wider hidden md:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4">
                    <LoadingList rows={5} />
                  </td>
                </tr>
              ) : incomes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-ash text-sm">No income entries yet</td>
                </tr>
              ) : (
                incomes.map((inc, i) => (
                  <motion.tr
                    key={inc.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.2 }}
                    className="border-b border-[rgba(237,237,243,0.03)] hover:bg-[rgba(237,237,243,0.02)] transition-colors"
                  >
                    <td className="px-4 md:px-5 py-3 text-ash whitespace-nowrap">{inc.date}</td>
                    <td className="px-4 md:px-5 py-3 text-emerald-400 font-medium whitespace-nowrap">{formatAmount(inc.amount, currency)}</td>
                    <td className="px-4 md:px-5 py-3 text-ash hidden sm:table-cell">{inc.source}</td>
                    <td className="px-4 md:px-5 py-3 hidden sm:table-cell">
                      <PillBadge variant="default">{inc.frequency}</PillBadge>
                    </td>
                    <td className="px-4 md:px-5 py-3 hidden md:table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(inc)} className="text-xs text-ash hover:text-[#9cb4e8] transition-colors">Edit</button>
                        <button onClick={() => handleDelete(inc.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Delete</button>
                      </div>
                    </td>
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
