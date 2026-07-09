import { useState } from 'react'
import { motion } from 'framer-motion'
import type { InvestmentAssistantResponse, InvestmentOption } from '../types'

export default function InvestmentAssistant() {
  const [targetReturn, setTargetReturn] = useState('')
  const [years, setYears] = useState('')
  const [preference, setPreference] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InvestmentAssistantResponse | null>(null)
  const [error, setError] = useState('')

  const handleCalculate = async () => {
    if (!targetReturn || !years) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/investment-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          target_return: parseFloat(targetReturn),
          years: parseInt(years),
          preference,
        }),
      })
      if (!res.ok) throw new Error('Failed to calculate')
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Could not calculate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSetGoal = async (opt: InvestmentOption) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'investment',
          name: opt.name,
          target_amount: opt.final_value,
          monthly_contribution: opt.monthly_investment,
          expected_return_rate: opt.expected_return,
        }),
      })
      if (!res.ok) throw new Error('Failed to create goal')
      window.location.reload()
    } catch {
      setError('Failed to set as goal. Try again.')
    }
  }

  if (!result) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-1 text-white">Investment Assistant</h3>
        <p className="text-sm text-white/50 mb-5">
          Find out how much to invest monthly to reach a target.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Target Return ($)</label>
            <input
              type="number"
              value={targetReturn}
              onChange={(e) => setTargetReturn(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#5266eb] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Time Horizon (years)</label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="e.g. 10"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#5266eb] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Preference (optional)</label>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#5266eb] transition-colors"
            >
              <option value="">Any strategy</option>
              <option value="bonds">Fixed Deposits / Bonds</option>
              <option value="balanced">Balanced Mutual Funds</option>
              <option value="etfs">Index Funds / ETFs</option>
              <option value="stocks">Growth Stocks</option>
              <option value="aggressive">Aggressive Portfolio</option>
            </select>
          </div>
          <button
            onClick={handleCalculate}
            disabled={loading || !targetReturn || !years}
            className="w-full py-3 rounded-xl bg-[#5266eb] hover:bg-[#4555d0] disabled:opacity-40 text-white font-medium transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? 'Calculating...' : 'Calculate Plan'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Investment Plan</h3>
        <button
          onClick={() => setResult(null)}
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          Reset
        </button>
      </div>
      <p className="text-sm text-white/50 mb-5">
        To reach <span className="text-white font-medium">${result.target_return.toLocaleString()}</span> in{' '}
        <span className="text-white font-medium">{result.years} years</span>, here are your options:
      </p>
      <div className="space-y-3">
        {result.options.map((opt, i) => (
          <motion.div
            key={opt.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white">{opt.name}</h4>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  opt.risk === 'Low'
                    ? 'bg-green-500/20 text-green-400'
                    : opt.risk === 'Medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : opt.risk === 'High' || opt.risk === 'Medium-High'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-red-500/20 text-red-400'
                }`}
              >
                {opt.risk}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-white/40">Monthly:</span>{' '}
                <span className="text-white">${opt.monthly_investment.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-white/40">Total invested:</span>{' '}
                <span className="text-white">${opt.total_invested.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-white/40">Expected return:</span>{' '}
                <span className="text-[#5266eb]">{opt.expected_return}%</span>
              </div>
              <div>
                <span className="text-white/40">Final value:</span>{' '}
                <span className="text-green-400">${opt.final_value.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => handleSetGoal(opt)}
              className="mt-3 w-full py-2 text-sm rounded-xl border border-[#5266eb]/30 text-[#5266eb] hover:bg-[#5266eb]/10 transition-all active:scale-[0.98]"
            >
              Set as Investment Goal
            </button>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-white/30 mt-4">{result.disclaimer}</p>
    </div>
  )
}
