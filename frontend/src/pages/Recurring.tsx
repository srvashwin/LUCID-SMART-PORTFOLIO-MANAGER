import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import type { RecurringTransaction, UpcomingResponse } from '../types'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'
import ConfirmDialog from '../components/ConfirmDialog'
import { LoadingList } from '../components/LoadingSkeleton'
import { useToast } from '../components/Toast'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'

const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities',
  'Entertainment', 'Health & Fitness', 'Education', 'Housing',
  'Travel', 'Groceries', 'Subscription', 'Other',
]

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

function RecurringForm({
  editing, initial, onSave, onCancel,
}: {
  editing: boolean
  initial: Partial<RecurringTransaction>
  onSave: (data: Partial<RecurringTransaction>) => void
  onCancel: () => void
}) {
  const [type, setType] = useState(initial.type || 'expense')
  const [amount, setAmount] = useState(String(initial.amount || ''))
  const [category, setCategory] = useState(initial.category || 'Subscription')
  const [description, setDescription] = useState(initial.description || '')
  const [merchant, setMerchant] = useState(initial.merchant || '')
  const [frequency, setFrequency] = useState(initial.frequency || 'monthly')
  const [nextDate, setNextDate] = useState(initial.next_date || '')
  const [endDate, setEndDate] = useState(initial.end_date || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      type, amount: Number(amount), category, description, merchant,
      frequency, next_date: nextDate, end_date: endDate || undefined,
    })
  }

  return (
    <GlassCard className="p-5" hover={false}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={type} onChange={e => setType(e.target.value)}
            className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input type="number" step="0.01" placeholder="Amount" value={amount}
            onChange={e => setAmount(e.target.value)} required
            className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
          <select value={frequency} onChange={e => setFrequency(e.target.value)}
            className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors">
            {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" placeholder="Merchant (optional)" value={merchant}
            onChange={e => setMerchant(e.target.value)}
            className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
          <input type="text" placeholder="Description (optional)" value={description}
            onChange={e => setDescription(e.target.value)}
            className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ash mb-1">Next Date *</label>
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} required
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-ash mb-1">End Date (optional)</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors" />
          </div>
        </div>
        <div className="flex gap-2">
          <PillButton type="submit">{editing ? 'Update' : 'Add'} Recurring</PillButton>
          <button type="button" onClick={onCancel} className="text-sm text-ash hover:text-ivory transition-colors">Cancel</button>
        </div>
      </form>
    </GlassCard>
  )
}

export default function Recurring() {
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const { currency } = useCurrency()
  const { toast } = useToast()

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1)
    window.addEventListener('lucid-data-changed', handler)
    return () => window.removeEventListener('lucid-data-changed', handler)
  }, [])

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get('/recurring').then(r => setRecurringList(r.data)),
      api.get('/recurring/upcoming?days=30').then(r => setUpcoming(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(fetchData, [refreshKey])

  const openAdd = () => {
    setEditingId(null); setShowForm(true)
  }

  const openEdit = (r: RecurringTransaction) => {
    setEditingId(r.id); setShowForm(true)
  }

  const handleSave = async (data: Partial<RecurringTransaction>) => {
    try {
      if (editingId) {
        await api.put(`/recurring/${editingId}`, data)
        toast('Recurring updated', 'success')
      } else {
        await api.post('/recurring', data)
        toast('Recurring added', 'success')
      }
      setShowForm(false)
      setEditingId(null)
      setRefreshKey(k => k + 1)
    } catch {
      toast('Failed to save', 'error')
    }
  }

  const handleToggle = async (r: RecurringTransaction) => {
    try {
      await api.put(`/recurring/${r.id}`, { is_active: !r.is_active })
      setRefreshKey(k => k + 1)
      toast(r.is_active ? 'Paused' : 'Activated', 'success')
    } catch {
      toast('Failed to toggle', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    setConfirmId(null)
    try {
      await api.delete(`/recurring/${id}`)
      setRefreshKey(k => k + 1)
      toast('Deleted', 'success')
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  const editingRecurring = editingId ? recurringList.find(r => r.id === editingId) : undefined

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirmId !== null}
        title="Delete Recurring?"
        message="This will permanently remove this recurring transaction."
        onConfirm={() => handleDelete(confirmId!)}
        onCancel={() => setConfirmId(null)}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Recurring</h1>
          <p className="text-ash text-sm mt-1">Manage bills, subscriptions, and recurring income</p>
        </div>
        <PillButton onClick={openAdd}>Add Recurring</PillButton>
      </div>

      {/* Upcoming */}
      {!loading && upcoming && upcoming.occurrences.length > 0 && (
        <GlassCard className="p-5" delay={0.05}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-ivory" style={{ fontWeight: 500 }}>Upcoming (30 days)</h2>
            <span className="text-sm text-ivory font-medium">{formatAmount(upcoming.total, currency)}</span>
          </div>
          <div className="space-y-2">
            {upcoming.occurrences.slice(0, 10).map((o, i) => (
              <div key={`${o.recurring_id}-${o.due_date}`} className="flex items-center justify-between text-sm py-1.5">
                <div className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${o.type === 'income' ? 'bg-emerald-400' : 'bg-[#5266eb]'}`} />
                  <span className="text-ivory">{o.merchant || o.description || o.category}</span>
                  <span className="text-xs text-ash">{o.due_date}</span>
                </div>
                <span className={`text-sm font-medium ${o.type === 'income' ? 'text-emerald-400' : 'text-ivory'}`}>
                  {o.type === 'income' ? '+' : ''}{formatAmount(o.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Form */}
      {showForm && (
        <RecurringForm
          editing={editingId !== null}
          initial={editingRecurring || { type: 'expense', amount: 0, category: 'Subscription', description: '', merchant: '', frequency: 'monthly', next_date: new Date().toISOString().split('T')[0] }}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingId(null) }}
        />
      )}

      {/* List */}
      {loading ? (
        <LoadingList rows={4} />
      ) : recurringList.length === 0 ? (
        <GlassCard className="p-8 text-center" hover={false}>
          <p className="text-ash text-sm">No recurring transactions yet.</p>
        </GlassCard>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ash text-xs uppercase tracking-wider border-b border-[rgba(237,237,243,0.06)]">
                <th className="text-left py-3 px-2 font-medium">Name</th>
                <th className="text-right py-3 px-2 font-medium">Amount</th>
                <th className="text-left py-3 px-2 font-medium">Frequency</th>
                <th className="text-left py-3 px-2 font-medium">Next</th>
                <th className="text-center py-3 px-2 font-medium">Status</th>
                <th className="text-right py-3 px-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recurringList.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`border-b border-[rgba(237,237,243,0.04)] hover:bg-[rgba(237,237,243,0.02)] transition-colors ${!r.is_active ? 'opacity-50' : ''}`}
                >
                  <td className="py-3 px-2">
                    <span className="text-ivory font-medium">{r.merchant || r.description || r.category}</span>
                    {r.description && r.merchant && <p className="text-xs text-ash">{r.description}</p>}
                  </td>
                  <td className={`text-right py-3 px-2 font-medium ${r.type === 'income' ? 'text-emerald-400' : 'text-ivory'}`}>
                    {r.type === 'income' ? '+' : ''}{formatAmount(r.amount, currency)}
                  </td>
                  <td className="py-3 px-2 text-ash capitalize">{r.frequency}</td>
                  <td className="py-3 px-2 text-ash">{r.next_date}</td>
                  <td className="text-center py-3 px-2">
                    <button
                      onClick={() => handleToggle(r)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.is_active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-ash/10 text-ash'
                      }`}
                    >
                      {r.is_active ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td className="text-right py-3 px-2">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(r)} className="text-xs text-ash hover:text-ivory transition-colors">Edit</button>
                      <button onClick={() => setConfirmId(r.id)} className="text-xs text-ash hover:text-red-400 transition-colors">Del</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
