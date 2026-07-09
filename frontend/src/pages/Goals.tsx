import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import type { InvestmentGoal, UserGoal } from '../types'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'
import ProgressRing from '../components/ProgressRing'
import InvestmentAssistant from '../components/InvestmentAssistant'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'

export default function Goals() {
  const [invGoals, setInvGoals] = useState<InvestmentGoal[]>([])
  const [userGoals, setUserGoals] = useState<UserGoal[]>([])

  const [invName, setInvName] = useState('')
  const [invTarget, setInvTarget] = useState('')
  const [invMonthly, setInvMonthly] = useState('')
  const [invRate, setInvRate] = useState('7')
  const [invCurrent, setInvCurrent] = useState('')

  const [goalType, setGoalType] = useState('yearly_savings')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalMonthly, setGoalMonthly] = useState('')
  const [goalTargetDate, setGoalTargetDate] = useState('')
  const [timeline, setTimeline] = useState<{ required: number; months: number; onTrack: boolean } | null>(null)

  const fetch = () => {
    api.get('/goals/investment').then(r => setInvGoals(r.data)).catch(() => {})
    api.get('/goals/user-goals').then(r => setUserGoals(r.data)).catch(() => {})
  }
  const { currency } = useCurrency()
  useEffect(fetch, [])

  useEffect(() => {
    if (goalTarget && goalTargetDate) {
      api.post('/goals/calculate-timeline', {
        target_amount: Number(goalTarget),
        target_date: goalTargetDate,
        current_amount: 0,
        monthly_contribution: Number(goalMonthly) || 0,
      }).then(r => {
        setTimeline({
          required: r.data.required_monthly,
          months: r.data.months_remaining,
          onTrack: r.data.on_track,
        })
      }).catch(() => setTimeline(null))
    } else {
      setTimeline(null)
    }
  }, [goalTarget, goalTargetDate, goalMonthly])

  const addInvGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/goals/investment', {
      name: invName,
      target_amount: Number(invTarget),
      current_amount: Number(invCurrent) || 0,
      monthly_contribution: Number(invMonthly) || 0,
      expected_return_rate: Number(invRate),
      start_date: new Date().toISOString().split('T')[0],
    })
    setInvName(''); setInvTarget(''); setInvMonthly(''); setInvRate('7'); setInvCurrent('')
    fetch()
  }

  const addUserGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/goals/user-goals', {
      type: goalType,
      target_amount: Number(goalTarget),
      monthly_contribution: Number(goalMonthly) || 0,
      target_date: goalTargetDate || null,
      expected_return_rate: 7,
    })
    setGoalTarget(''); setGoalMonthly(''); setGoalTargetDate(''); setTimeline(null)
    fetch()
  }

  const deleteGoal = async (type: 'inv' | 'user', id: number) => {
    if (type === 'inv') await api.delete(`/goals/investment/${id}`)
    else await api.delete(`/goals/user-goals/${id}`)
    fetch()
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Investments & Savings</h1>
        <p className="text-ash text-sm mt-1">Set and track investment plans and savings targets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Goals */}
        <GlassCard className="p-5" hover={false}>
          <h2 className="text-lg font-semibold text-ivory mb-4" style={{ fontWeight: 600 }}>Investment Plans</h2>
          <form onSubmit={addInvGoal} className="space-y-3 mb-6">
            <input type="text" placeholder="Goal name" value={invName} onChange={e => setInvName(e.target.value)} required
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
            <div className="flex gap-2">
              <input type="number" placeholder="Target amount" value={invTarget} onChange={e => setInvTarget(e.target.value)} required
                className="flex-1 px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
              <input type="number" placeholder="Current" value={invCurrent} onChange={e => setInvCurrent(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
            </div>
            <div className="flex gap-2">
              <input type="number" placeholder="Monthly contribution" value={invMonthly} onChange={e => setInvMonthly(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
              <input type="number" placeholder="Return %" value={invRate} onChange={e => setInvRate(e.target.value)}
                className="w-28 px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
            </div>
            <PillButton type="submit" className="w-full">Add Investment Goal</PillButton>
          </form>

          <div className="space-y-3">
            {invGoals.map((g, i) => {
              const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[rgba(237,237,243,0.03)] rounded-xl p-4 flex items-center gap-4"
                >
                  <ProgressRing progress={pct} size={64} strokeWidth={4} label={`${Math.round(pct)}%`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-ivory">{g.name}</p>
                        <p className="text-xs text-ash mt-0.5">{formatAmount(g.current_amount, currency)} of {formatAmount(g.target_amount, currency)}</p>
                      </div>
                      <button onClick={() => deleteGoal('inv', g.id)} className="text-xs text-ash hover:text-red-400 transition-colors">Remove</button>
                    </div>
                    <p className="text-xs text-ash mt-2">{formatAmount(g.monthly_contribution, currency)}/mo at {g.expected_return_rate}% APY</p>
                  </div>
                </motion.div>
              )
            })}
            {invGoals.length === 0 && <p className="text-sm text-ash text-center py-4">No investment goals yet</p>}
          </div>
        </GlassCard>

        {/* Savings Goals */}
        <GlassCard className="p-5" hover={false}>
          <h2 className="text-lg font-semibold text-ivory mb-4" style={{ fontWeight: 600 }}>Savings Goals</h2>
          <form onSubmit={addUserGoal} className="space-y-3 mb-6">
            <select value={goalType} onChange={e => setGoalType(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors">
              <option value="yearly_savings">Yearly Savings</option>
              <option value="investment_return">Investment Return</option>
            </select>
            <input type="number" placeholder="Target amount" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} required
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
            <input type="date" value={goalTargetDate} onChange={e => setGoalTargetDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors" />
            <input type="number" placeholder="Monthly contribution" value={goalMonthly} onChange={e => setGoalMonthly(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />

            {timeline && (
              <div className="bg-[rgba(82,102,235,0.06)] rounded-lg p-3 space-y-1">
                <p className="text-xs text-ash">
                  Need <span className="text-ivory font-medium">{formatAmount(timeline.required, currency)}/mo</span> for {timeline.months} months
                </p>
                <p className={`text-xs ${timeline.onTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {timeline.onTrack ? 'On track with current contribution' : `Increase by ${formatAmount(timeline.required - Number(goalMonthly || 0), currency)}/mo`}
                </p>
              </div>
            )}

            <PillButton type="submit" className="w-full">Add Savings Goal</PillButton>
          </form>

          <div className="space-y-3">
            {userGoals.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[rgba(237,237,243,0.03)] rounded-xl p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-ivory capitalize">{g.type.replace('_', ' ')}</p>
                    <p className="text-xs text-ash mt-0.5">Target: {formatAmount(g.target_amount, currency)}</p>
                    {g.target_date && <p className="text-xs text-ash">by {g.target_date}</p>}
                  </div>
                  <button onClick={() => deleteGoal('user', g.id)} className="text-xs text-ash hover:text-red-400 transition-colors">Remove</button>
                </div>
                <p className="text-xs text-ash mt-2">{formatAmount(g.monthly_contribution, currency)}/mo at {g.expected_return_rate}%</p>
                {g.target_date && g.target_amount > 0 && (
                  <TimelineBadge targetAmount={g.target_amount} targetDate={g.target_date} monthly={g.monthly_contribution} />
                )}
              </motion.div>
            ))}
            {userGoals.length === 0 && <p className="text-sm text-ash text-center py-4">No savings goals yet</p>}
          </div>
        </GlassCard>
      </div>

      <InvestmentAssistant />
    </div>
  )
}

function TimelineBadge({ targetAmount, targetDate, monthly }: { targetAmount: number; targetDate: string; monthly: number }) {
  const [info, setInfo] = useState<{ required: number; months: number; onTrack: boolean } | null>(null)
  useEffect(() => {
    api.post('/goals/calculate-timeline', {
      target_amount: targetAmount,
      target_date: targetDate,
      current_amount: 0,
      monthly_contribution: monthly,
    }).then(r => setInfo(r.data)).catch(() => {})
  }, [targetAmount, targetDate, monthly])
  if (!info) return null
  return (
    <p className={`text-xs mt-1 ${info.onTrack ? 'text-emerald-400/70' : 'text-amber-400/70'}`}>
      {info.onTrack ? 'On track' : `Need ${info.required.toFixed(0)}/mo`} &middot; {info.months} months remaining
    </p>
  )
}
