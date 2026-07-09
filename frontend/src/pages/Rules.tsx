import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import type { SpendingRule } from '../types'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'
import PillBadge from '../components/PillBadge'
import { formatAmount, getCurrencySymbol } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'

const categories = [
  'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities',
  'Entertainment', 'Health & Fitness', 'Education', 'Housing',
  'Travel', 'Groceries', 'Other',
]

export default function Rules() {
  const [rules, setRules] = useState<SpendingRule[]>([])
  const [category, setCategory] = useState('Food & Dining')
  const [maxAmount, setMaxAmount] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [spendData, setSpendData] = useState<Record<string, number>>({})
  const { currency } = useCurrency()

  const fetch = () => {
    api.get('/rules').then(r => setRules(r.data)).catch(() => {})
    api.get('/expenses/stats').then(r => {
      const data: Record<string, number> = {}
      r.data.category_breakdown.forEach((c: any) => { data[c.category] = c.total })
      setSpendData(data)
    }).catch(() => {})
  }
  useEffect(fetch, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await api.put(`/rules/${editingId}`, { category, max_amount: Number(maxAmount), period: 'monthly' })
      setEditingId(null)
    } else {
      await api.post('/rules', { category, max_amount: Number(maxAmount), period: 'monthly' })
    }
    setMaxAmount('')
    setCategory('Food & Dining')
    fetch()
  }

  const handleDelete = async (id: number) => {
    await api.delete(`/rules/${id}`)
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const handleEdit = (rule: SpendingRule) => {
    setCategory(rule.category)
    setMaxAmount(String(rule.max_amount))
    setEditingId(rule.id)
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Spending Rules</h1>
        <p className="text-ash text-sm mt-1">Set monthly limits to stay on track</p>
      </div>

      {/* Form */}
      <GlassCard className="p-5" hover={false}>
        <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-xs text-ash block mb-1.5 font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-ash block mb-1.5 font-medium">Monthly Limit ({getCurrencySymbol(currency)})</label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="500"
              required
              className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors w-32 placeholder-[#70707d]"
            />
          </div>
          <PillButton type="submit">{editingId ? 'Update' : 'Add Rule'}</PillButton>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setMaxAmount('') }} className="text-sm text-ash hover:text-ivory transition-colors">
              Cancel
            </button>
          )}
        </form>
      </GlassCard>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule, i) => {
          const spent = spendData[rule.category] || 0
          const pct = rule.max_amount > 0 ? (spent / rule.max_amount) * 100 : 0
          const isOver = spent > rule.max_amount
          return (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ivory">{rule.category}</span>
                        {isOver && <PillBadge variant="warning">Exceeded</PillBadge>}
                      </div>
                      <span className={`text-sm ${isOver ? 'text-red-400 font-medium' : 'text-ash'}`}>
                        {formatAmount(spent, currency)} / {formatAmount(rule.max_amount, currency)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[rgba(237,237,243,0.06)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-400' : 'bg-[#5266eb]'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(rule)} className="text-xs text-ash hover:text-ivory transition-colors">Edit</button>
                    <button onClick={() => handleDelete(rule.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Delete</button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
        {rules.length === 0 && (
          <p className="text-center py-8 text-ash text-sm">No spending rules yet. Add one to start tracking limits.</p>
        )}
      </div>
    </div>
  )
}
