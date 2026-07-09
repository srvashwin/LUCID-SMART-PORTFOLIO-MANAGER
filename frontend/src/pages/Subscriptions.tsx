import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import type { SubscriptionDetectResponse } from '../types'
import GlassCard from '../components/GlassCard'
import MetricCard from '../components/MetricCard'
import PillBadge from '../components/PillBadge'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'

export default function Subscriptions() {
  const [data, setData] = useState<SubscriptionDetectResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const { currency } = useCurrency()

  useEffect(() => {
    api.get('/subscriptions/detect')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const visible = (data?.subscriptions || []).filter(s => !dismissed.has(s.merchant))
  const visibleTotal = visible.reduce((s, sub) => s + sub.amount, 0)

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Subscriptions</h1>
        <p className="text-ash text-sm mt-1">Recurring payments detected from your expense history</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#5266eb] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.subscriptions.length === 0 ? (
        <GlassCard className="p-8 text-center" hover={false}>
          <p className="text-ash text-sm">No recurring subscriptions detected yet.</p>
          <p className="text-ash/60 text-xs mt-2">Add expenses with merchant names to enable detection.</p>
        </GlassCard>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard label="Active Subscriptions" value={String(visible.length)} delay={0} />
            <MetricCard label="Monthly Total" value={formatAmount(visibleTotal, currency)} delay={100} />
            <MetricCard label="Yearly Total" value={formatAmount(visibleTotal * 12, currency)} delay={200} />
          </div>

          {/* Subscription list */}
          <div className="space-y-2">
            {visible.map((sub, i) => (
              <motion.div
                key={sub.merchant}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[rgba(82,102,235,0.12)] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#9cb4e8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-ivory truncate">{sub.merchant}</span>
                          <PillBadge variant={sub.confidence === 'high' ? 'success' : 'warning'}>
                            {sub.confidence}
                          </PillBadge>
                        </div>
                        <span className="text-sm text-ivory font-medium shrink-0">{formatAmount(sub.amount, currency)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-ash">{sub.category}</span>
                        <span className="text-xs text-ash/50">&middot;</span>
                        <span className="text-xs text-ash">{sub.frequency}</span>
                        <span className="text-xs text-ash/50">&middot;</span>
                        <span className="text-xs text-ash">{sub.occurrences} payments</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDismissed(prev => new Set(prev).add(sub.merchant))}
                      className="text-xs text-ash hover:text-red-400 transition-colors shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {dismissed.size > 0 && (
            <button
              onClick={() => setDismissed(new Set())}
              className="text-sm text-[#5266eb] hover:text-[#6b7df5] transition-colors"
            >
              Undo dismiss all
            </button>
          )}
        </>
      )}
    </div>
  )
}
