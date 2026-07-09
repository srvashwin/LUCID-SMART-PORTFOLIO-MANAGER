import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import type { AnalysisResult } from '../types'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'
import { useToast } from '../components/Toast'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'

export default function Analyze() {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [useCase, setUseCase] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const { currency } = useCurrency()
  const { toast } = useToast()

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/ai/analyze', {
        expense_amount: Number(amount),
        expense_description: description,
        use_case: useCase,
      })
      setResult(res.data)
    } catch {
      setResult(null)
      toast('Analysis failed. Try again.', 'error')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Purchase Analysis</h1>
        <p className="text-ash text-sm mt-1">See the opportunity cost of any purchase against your goals</p>
      </div>

      <GlassCard className="p-5" hover={false}>
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ash block mb-1.5 font-medium">How much does it cost?</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 2000"
                required
                className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]"
              />
            </div>
            <div>
              <label className="text-xs text-ash block mb-1.5 font-medium">What is it?</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., New MacBook Pro"
                required
                className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-ash block mb-1.5 font-medium">Use case</label>
            <input
              type="text"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              placeholder="e.g., For work - need a faster laptop for development"
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]"
            />
          </div>
          <PillButton type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Purchase'}
          </PillButton>
        </form>
      </GlassCard>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <GlassCard className="p-6" hover={false}>
            <h2 className="text-lg font-semibold text-ivory mb-5" style={{ fontWeight: 600 }}>
              Analysis: {formatAmount(Number(amount), currency)} on {description}
            </h2>

            {/* Projected Growth */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {Object.entries(result.projected_growth).map(([year, value]) => (
                <div key={year} className="bg-[rgba(82,102,235,0.08)] rounded-xl p-4 text-center">
                  <p className="text-xs text-ash mb-1 capitalize">{year.replace('_', ' ')}</p>
                  <p className="text-xl font-semibold text-ivory">{formatAmount(value as number, currency)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-ash mb-4">At {result.return_rate_used}% annual return rate</p>

            <div className="space-y-3 border-t border-[rgba(237,237,243,0.06)] pt-4">
              <div className="bg-[rgba(251,191,36,0.06)] rounded-xl p-4">
                <p className="text-xs font-medium text-ivory mb-1">Impact on your goals</p>
                <p className="text-sm text-ash">{result.impact}</p>
              </div>
              <div className="bg-[rgba(237,237,243,0.03)] rounded-xl p-4">
                <p className="text-xs font-medium text-ivory mb-1">Context</p>
                <p className="text-sm text-ash">{result.context}</p>
              </div>
            </div>

            <div className="border-t border-[rgba(237,237,243,0.06)] pt-4 mt-4 text-center">
              <p className="text-lg font-semibold text-ivory">{result.verdict}</p>
              <p className="text-xs text-ash mt-2">{result.disclaimer}</p>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}
