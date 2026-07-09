import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import type { AccountData, NetWorthResponse } from '../types'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'
import MetricCard from '../components/MetricCard'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking', isAsset: true },
  { value: 'savings', label: 'Savings', isAsset: true },
  { value: 'investment', label: 'Investment', isAsset: true },
  { value: 'property', label: 'Property', isAsset: true },
  { value: 'credit_card', label: 'Credit Card', isAsset: false },
  { value: 'loan', label: 'Loan', isAsset: false },
  { value: 'other', label: 'Other', isAsset: true },
]

function TypeIcon({ type }: { type: string }) {
  return (
    <svg className="w-4 h-4 text-[#9cb4e8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {type === 'checking' || type === 'savings' ? (
        <polygon points="12 2 2 7 2 9 22 9 22 7 12 2" />
      ) : type === 'investment' ? (
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      ) : type === 'property' ? (
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      ) : type === 'credit_card' ? (
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      ) : type === 'loan' ? (
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      ) : (
        <circle cx="12" cy="12" r="10" />
      )}
    </svg>
  )
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<AccountData[]>([])
  const [netWorth, setNetWorth] = useState<NetWorthResponse | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState('checking')
  const [balance, setBalance] = useState('')
  const [institution, setInstitution] = useState('')

  const [refreshKey, setRefreshKey] = useState(0)
  const { currency } = useCurrency()

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1)
    window.addEventListener('lucid-data-changed', handler)
    return () => window.removeEventListener('lucid-data-changed', handler)
  }, [])

  useEffect(() => {
    api.get('/accounts').then(r => setAccounts(r.data)).catch(() => {})
    api.get('/accounts/net-worth').then(r => setNetWorth(r.data)).catch(() => {})
  }, [refreshKey])

  const openAdd = () => {
    setName(''); setType('checking'); setBalance(''); setInstitution('')
    setEditingId(null); setShowForm(true)
  }

  const openEdit = (a: AccountData) => {
    setName(a.name); setType(a.type); setBalance(String(a.balance)); setInstitution(a.institution)
    setEditingId(a.id); setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { name, type, balance: Number(balance), institution }
    if (editingId) {
      await api.put(`/accounts/${editingId}`, data)
    } else {
      await api.post('/accounts', data)
    }
    setShowForm(false)
    setRefreshKey(k => k + 1)
  }

  const handleDelete = async (id: number) => {
    await api.delete(`/accounts/${id}`)
    setRefreshKey(k => k + 1)
  }

  const assets = accounts.filter(a => ACCOUNT_TYPES.find(t => t.value === a.type)?.isAsset !== false)
  const liabilities = accounts.filter(a => ACCOUNT_TYPES.find(t => t.value === a.type)?.isAsset === false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Accounts</h1>
          <p className="text-ash text-sm mt-1">Track your assets, liabilities, and net worth</p>
        </div>
        <PillButton onClick={openAdd}>Add Account</PillButton>
      </div>

      {/* Net Worth Summary */}
      {netWorth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard label="Net Worth" value={formatAmount(netWorth.net_worth, currency)}
            trendUp={netWorth.net_worth >= 0} delay={0} />
          <MetricCard label="Total Assets" value={formatAmount(netWorth.total_assets, currency)} delay={100} />
          <MetricCard label="Total Liabilities" value={formatAmount(netWorth.total_liabilities, currency)}
            trendUp={false} delay={200} />
          <MetricCard label="Accounts Tracked" value={String(netWorth.account_count)} delay={300} />
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <GlassCard className="p-5" hover={false}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Account name" value={name} onChange={e => setName(e.target.value)} required
                className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
              <select value={type} onChange={e => setType(e.target.value)}
                className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors">
                {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input type="number" step="0.01" placeholder="Balance" value={balance} onChange={e => setBalance(e.target.value)} required
                className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
              <input type="text" placeholder="Institution (optional)" value={institution} onChange={e => setInstitution(e.target.value)}
                className="px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
            </div>
            <div className="flex gap-2">
              <PillButton type="submit">{editingId ? 'Update' : 'Add'} Account</PillButton>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-ash hover:text-ivory transition-colors">Cancel</button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-ivory tracking-wide uppercase">Assets</h2>
          {assets.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <GlassCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <TypeIcon type={a.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-ivory">{a.name}</p>
                        <p className="text-xs text-ash">{ACCOUNT_TYPES.find(t => t.value === a.type)?.label || a.type}{a.institution ? ` \u00B7 ${a.institution}` : ''}</p>
                      </div>
                      <span className="text-sm text-emerald-400 font-medium">{formatAmount(a.balance, currency)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(a)} className="text-xs text-ash hover:text-ivory transition-colors">Edit</button>
                    <button onClick={() => handleDelete(a.id)} className="text-xs text-ash hover:text-red-400 transition-colors">Del</button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
          {assets.length === 0 && <p className="text-sm text-ash text-center py-4">No asset accounts yet</p>}
        </div>

        {/* Liabilities */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-ivory tracking-wide uppercase">Liabilities</h2>
          {liabilities.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <GlassCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <TypeIcon type={a.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-ivory">{a.name}</p>
                        <p className="text-xs text-ash">{ACCOUNT_TYPES.find(t => t.value === a.type)?.label || a.type}{a.institution ? ` \u00B7 ${a.institution}` : ''}</p>
                      </div>
                      <span className="text-sm text-red-400 font-medium">{formatAmount(Math.abs(a.balance), currency)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(a)} className="text-xs text-ash hover:text-ivory transition-colors">Edit</button>
                    <button onClick={() => handleDelete(a.id)} className="text-xs text-ash hover:text-red-400 transition-colors">Del</button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
          {liabilities.length === 0 && <p className="text-sm text-ash text-center py-4">No liabilities yet</p>}
        </div>
      </div>
    </div>
  )
}
