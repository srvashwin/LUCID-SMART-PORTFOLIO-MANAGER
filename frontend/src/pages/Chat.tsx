import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import GlassCard from '../components/GlassCard'
import AssistantAvatar from '../components/AssistantAvatar'
import { useToast } from '../components/Toast'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'
import { useAuth } from '../hooks/useAuth'
import { useHousehold } from '../hooks/useHousehold'

type AgentIntent = 'add_income' | 'add_expense' | 'add_investment_goal' | 'add_savings_goal' | 'add_to_fund' | 'add_spending_rule' | 'change_currency' | 'general'

interface AgentResult {
  intent: AgentIntent
  message: string
  data: {
    income?: { amount: number; frequency: string; source: string }
    expense?: { amount: number; category: string; description: string; merchant: string }
    goal?: { name?: string; type?: string; target_amount: number; monthly_contribution: number }
    rule?: { category: string; max_amount: number; period: string }
    currency?: string
    fund?: { name: string; amount: number; type: string }
  }
  action?: { type: string; payload: Record<string, unknown> }
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  result?: AgentResult
}

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-2 h-2 rounded-full bg-[#5266eb]" style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.16}s infinite` }} />
      ))}
    </div>
  )
}

function FundConfirmCard({ result, onDone }: { result: AgentResult; onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { toast } = useToast()
  const action = result.action
  if (!action || action.type !== 'confirm_create_fund') return null
  if (done) return null

  const handleYes = async () => {
    setLoading(true)
    try {
      await api.post('/funds', action.payload)
      toast('Fund created!', 'success')
      window.dispatchEvent(new CustomEvent('lucid-data-changed'))
      setDone(true)
      onDone()
    } catch {
      toast('Failed to create fund', 'error')
    }
    setLoading(false)
  }

  return (
    <div className="mt-2 flex gap-2">
      <button
        onClick={handleYes}
        disabled={loading}
        className="px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Yes, create fund'}
      </button>
      <button
        onClick={() => { setDone(true); onDone() }}
        disabled={loading}
        className="px-4 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-ash hover:text-ivory hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
      >
        No
      </button>
    </div>
  )
}

function ResultCard({ result }: { result: AgentResult }) {
  const { currency } = useCurrency()
  const d = result.data

  if (result.intent === 'add_income' && d.income) {
    return (
      <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3 space-y-1">
        <p className="text-green-400 text-xs font-medium">Income Added</p>
        <p className="text-white text-sm">{formatAmount(d.income.amount, currency)} <span className="text-white/50">/ {d.income.frequency}</span></p>
        <p className="text-white/60 text-xs">Source: {d.income.source}</p>
      </div>
    )
  }

  if (result.intent === 'add_expense' && d.expense) {
    return (
      <div className="mt-2 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 space-y-1">
        <p className="text-orange-400 text-xs font-medium">Expense Recorded</p>
        <p className="text-white text-sm">{formatAmount(d.expense.amount, currency)}</p>
        <p className="text-white/60 text-xs">{d.expense.category}{d.expense.merchant ? ` at ${d.expense.merchant}` : ''}</p>
      </div>
    )
  }

  if ((result.intent === 'add_investment_goal' || result.intent === 'add_savings_goal') && d.goal) {
    return (
      <div className="mt-2 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 space-y-1">
        <p className="text-purple-400 text-xs font-medium">Goal Created</p>
        <p className="text-white text-sm">{formatAmount(d.goal.target_amount, currency)}{d.goal.monthly_contribution ? ` (${formatAmount(d.goal.monthly_contribution, currency)}/mo)` : ''}</p>
        <p className="text-white/60 text-xs">{d.goal.name || d.goal.type?.replace('_', ' ') || 'Savings Goal'}</p>
      </div>
    )
  }

  if (result.intent === 'add_to_fund' && d.fund) {
    return (
      <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1">
        <p className="text-emerald-400 text-xs font-medium">Fund Updated</p>
        <p className="text-white text-sm">{formatAmount(d.fund.amount, currency)}</p>
        <p className="text-white/60 text-xs">{d.fund.name}</p>
      </div>
    )
  }

  if (result.intent === 'add_spending_rule' && d.rule) {
    return (
      <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 space-y-1">
        <p className="text-blue-400 text-xs font-medium">Spending Rule Set</p>
        <p className="text-white text-sm">{formatAmount(d.rule.max_amount, currency)} / {d.rule.period}</p>
        <p className="text-white/60 text-xs">on {d.rule.category}</p>
      </div>
    )
  }

  if (result.intent === 'change_currency' && d.currency) {
    return (
      <div className="mt-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
        <p className="text-cyan-400 text-xs font-medium">Currency Changed</p>
        <p className="text-white text-sm">Now using {d.currency}</p>
      </div>
    )
  }

  return null
}

export default function Chat() {
  const { user } = useAuth()
  const { activeHouseholdId } = useHousehold()
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = sessionStorage.getItem('chat_messages')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    const name = user?.name
    return [{
      role: 'assistant',
      content: name
        ? `Hey ${name}! I'm Lucid Assistant. Tell me what you'd like to do.\n\nTry: "my income is $5000/month", "spent $45 on groceries", "save $50k for a house", or "limit dining to $200/month"`
        : `Hey! I'm Lucid Assistant. Tell me what you'd like to do.\n\nTry: "my income is $5000/month", "spent $45 on groceries", "save $50k for a house", or "limit dining to $200/month"`
    }]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    sessionStorage.setItem('chat_messages', JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const agentPayload: any = { message: input }
      if (activeHouseholdId) agentPayload.household_id = activeHouseholdId
      const res = await api.post('/ai/agent', agentPayload)
      const result: AgentResult = res.data
      if (result.intent !== 'general') {
        window.dispatchEvent(new CustomEvent('lucid-data-changed'))
      }
      const lines = [result.message]
      const assistantMsg: Message = { role: 'assistant', content: lines.join('\n'), result }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
      toast('Failed to send message', 'error')
    }

    setLoading(false)
    setInput('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 animate-fade-in">
        <AssistantAvatar size={88} className="shrink-0" />
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Assistant</h1>
          <p className="text-ash text-sm mt-1">Add expenses, income, goals, rules, and more — just type naturally</p>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden" hover={false}>
        <div className="h-[480px] overflow-y-auto p-5 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}
              >
                {msg.role === 'assistant' && <AssistantAvatar size={28} className="shrink-0 mt-1 hidden sm:block" />}
                <div className={`max-w-[95%] sm:max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#5266eb] text-white rounded-2xl rounded-br-sm'
                    : 'bg-[rgba(237,237,243,0.06)] text-ivory rounded-2xl rounded-bl-sm'
                }`}>
                  {msg.content.split('\n').map((line, j) => line ? <p key={j}>{line}</p> : <br key={j} />)}
                  {msg.result && <ResultCard result={msg.result} />}
                  {msg.result?.action?.type === 'confirm_create_fund' && (
                    <FundConfirmCard result={msg.result} onDone={() => {}} />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-start gap-2">
              <AssistantAvatar size={28} className="shrink-0 mt-1 hidden sm:block" />
              <div className="bg-[rgba(237,237,243,0.06)] rounded-2xl rounded-bl-sm"><TypingIndicator /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </GlassCard>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder='e.g., "my income is $5000/month" or "spent $45 on groceries"'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          disabled={loading}
          className="flex-1 px-5 py-3 bg-[#272735] text-ivory rounded-full text-sm border border-[rgba(237,237,243,0.08)] placeholder-[#70707d] outline-none focus:border-[#5266eb] transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-[#5266eb] text-white rounded-full text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
