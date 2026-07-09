import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import api from '../services/api'
import type { PortfolioResponse, PortfolioHolding, Holding, AccountData } from '../types'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'
import MetricCard from '../components/MetricCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { LoadingCard, LoadingList } from '../components/LoadingSkeleton'
import { useToast } from '../components/Toast'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'

const COLORS = ['#5266eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f472b6', '#22c55e', '#e879f9', '#aebbff']

function AllocationDonut({ holdings, totalValue }: { holdings: PortfolioHolding[]; totalValue: number }) {
  const data = holdings
    .filter(h => h.current_value > 0)
    .map(h => ({
      name: h.ticker,
      value: h.current_value,
      pct: totalValue > 0 ? ((h.current_value / totalValue) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return <p className="text-sm text-ash text-center py-8">No holdings with value</p>
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="w-56 h-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1e1e2a', border: '1px solid rgba(237,237,243,0.08)', borderRadius: 8, fontSize: 13 }}
              itemStyle={{ color: '#ededf3' }}
              formatter={(value: number) => [formatAmount(value), 'Value']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2 w-full">
        {data.slice(0, 10).map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-ivory">{d.name}</span>
            </div>
            <span className="text-ash text-xs">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HoldingForm({
  editing, initial, onSave, onCancel,
}: {
  editing: boolean
  initial: Partial<Holding>
  onSave: (data: Partial<Holding>) => void
  onCancel: () => void
}) {
  const [ticker, setTicker] = useState(initial.ticker || '')
  const [shares, setShares] = useState(String(initial.shares || ''))
  const [costBasis, setCostBasis] = useState(String(initial.cost_basis || ''))
  const [notes, setNotes] = useState(initial.notes || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ticker: ticker.toUpperCase(), shares: Number(shares), cost_basis: Number(costBasis) || 0, notes })
  }

  return (
    <GlassCard className="p-5" hover={false}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" placeholder="Ticker (e.g. AAPL)" value={ticker}
            onChange={e => setTicker(e.target.value)} required disabled={editing}
            className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d] uppercase" />
          <input type="number" step="0.0001" placeholder="Shares" value={shares}
            onChange={e => setShares(e.target.value)} required
            className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
          <input type="number" step="0.01" placeholder="Cost basis per share" value={costBasis}
            onChange={e => setCostBasis(e.target.value)}
            className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
          <input type="text" placeholder="Notes (optional)" value={notes}
            onChange={e => setNotes(e.target.value)}
            className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
        </div>
        <div className="flex gap-2">
          <PillButton type="submit">{editing ? 'Update' : 'Add'} Holding</PillButton>
          <button type="button" onClick={onCancel} className="text-sm text-ash hover:text-ivory transition-colors">Cancel</button>
        </div>
      </form>
    </GlassCard>
  )
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
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

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/holdings/portfolio').then(r => setPortfolio(r.data)),
      api.get('/holdings').then(r => setHoldings(r.data)),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [refreshKey])

  const openAdd = () => {
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (h: Holding) => {
    setEditingId(h.id)
    setShowForm(true)
  }

  const handleSave = async (data: Partial<Holding>) => {
    try {
      if (editingId) {
        await api.put(`/holdings/${editingId}`, data)
        toast('Holding updated', 'success')
      } else {
        await api.post('/holdings', data)
        toast('Holding added', 'success')
      }
      setShowForm(false)
      setEditingId(null)
      setRefreshKey(k => k + 1)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to save holding'
      toast(detail, 'error')
    }
  }

  const handleDelete = async (id: number) => {
    setConfirmId(null)
    try {
      await api.delete(`/holdings/${id}`)
      setRefreshKey(k => k + 1)
      toast('Holding deleted', 'success')
    } catch {
      toast('Failed to delete holding', 'error')
    }
  }

  const editingHolding = editingId ? holdings.find(h => h.id === editingId) : undefined

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirmId !== null}
        title="Delete Holding?"
        message="This will permanently remove this holding. This action cannot be undone."
        onConfirm={() => handleDelete(confirmId!)}
        onCancel={() => setConfirmId(null)}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Portfolio</h1>
          <p className="text-ash text-sm mt-1">Track your real investment holdings with live prices</p>
        </div>
        <PillButton onClick={openAdd}>Add Holding</PillButton>
      </div>

      {/* Summary metrics */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <LoadingCard key={i} />)}
        </div>
      ) : portfolio && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Total Value" value={formatAmount(portfolio.total_value, currency)} delay={0} />
          <MetricCard label="Total Cost" value={formatAmount(portfolio.total_cost, currency)} delay={100} />
          <MetricCard
            label="Total Gain/Loss"
            value={`${portfolio.total_gain_loss >= 0 ? '+' : ''}${formatAmount(portfolio.total_gain_loss, currency)}`
              + ` (${portfolio.total_gain_loss_pct >= 0 ? '+' : ''}${portfolio.total_gain_loss_pct.toFixed(1)}%)`}
            trendUp={portfolio.total_gain_loss >= 0}
            delay={200}
          />
          <MetricCard label="Holdings" value={String(portfolio.holdings.length)} delay={300} />
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <HoldingForm
          editing={editingId !== null}
          initial={editingHolding || { ticker: '', shares: 0, cost_basis: 0, notes: '' }}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingId(null) }}
        />
      )}

      {/* Allocation Donut */}
      {!loading && portfolio && portfolio.holdings.length > 0 && (
        <GlassCard className="p-5">
          <h2 className="text-sm font-medium text-ivory tracking-wide uppercase mb-4">Allocation</h2>
          <AllocationDonut holdings={portfolio.holdings} totalValue={portfolio.total_value} />
        </GlassCard>
      )}

      {/* Holdings Table */}
      {loading ? (
        <LoadingList rows={5} />
      ) : portfolio && portfolio.holdings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ash text-xs uppercase tracking-wider border-b border-[rgba(237,237,243,0.06)]">
                <th className="text-left py-3 px-2 font-medium">Ticker</th>
                <th className="text-right py-3 px-2 font-medium">Shares</th>
                <th className="text-right py-3 px-2 font-medium">Cost Basis</th>
                <th className="text-right py-3 px-2 font-medium">Current Price</th>
                <th className="text-right py-3 px-2 font-medium">Change</th>
                <th className="text-right py-3 px-2 font-medium">Current Value</th>
                <th className="text-right py-3 px-2 font-medium">Gain/Loss</th>
                <th className="text-right py-3 px-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((h, i) => (
                <motion.tr
                  key={h.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[rgba(237,237,243,0.04)] hover:bg-[rgba(237,237,243,0.02)] transition-colors"
                >
                  <td className="py-3 px-2">
                    <span className="text-ivory font-medium">{h.ticker}</span>
                    {h.notes && <p className="text-xs text-ash mt-0.5">{h.notes}</p>}
                  </td>
                  <td className="text-right py-3 px-2 text-ivory">{h.shares}</td>
                  <td className="text-right py-3 px-2 text-ash">{formatAmount(h.cost_basis, currency)}</td>
                  <td className="text-right py-3 px-2 text-ivory">{h.current_price > 0 ? formatAmount(h.current_price, currency) : '—'}</td>
                  <td className={`text-right py-3 px-2 ${h.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {h.change_pct !== 0 ? `${h.change_pct >= 0 ? '+' : ''}${h.change_pct.toFixed(2)}%` : '—'}
                  </td>
                  <td className="text-right py-3 px-2 text-ivory font-medium">{formatAmount(h.current_value, currency)}</td>
                  <td className={`text-right py-3 px-2 font-medium ${h.gain_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {h.gain_loss >= 0 ? '+' : ''}{formatAmount(h.gain_loss, currency)}
                    <span className="text-xs ml-1">({h.gain_loss_pct >= 0 ? '+' : ''}{h.gain_loss_pct.toFixed(1)}%)</span>
                  </td>
                  <td className="text-right py-3 px-2">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(holdings.find(hh => hh.id === h.id)!)} className="text-xs text-ash hover:text-ivory transition-colors">Edit</button>
                      <button onClick={() => setConfirmId(h.id)} className="text-xs text-ash hover:text-red-400 transition-colors">Del</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <GlassCard className="p-8 text-center" hover={false}>
          <p className="text-ash text-sm">No holdings yet. Add your first stock or ETF above.</p>
        </GlassCard>
      )}
    </div>
  )
}
