import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import GlassCard from '../components/GlassCard'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'

type AgentIntent = 'add_income' | 'add_expense' | 'add_investment_goal' | 'add_savings_goal' | 'add_spending_rule' | 'change_currency' | 'general'

interface AgentResult {
  intent: AgentIntent
  message: string
  data: {
    income?: { amount: number; frequency: string; source: string }
    expense?: { amount: number; category: string; description: string; merchant: string }
    goal?: { name?: string; type?: string; target_amount: number; monthly_contribution: number }
    rule?: { category: string; max_amount: number; period: string }
    currency?: string
  }
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

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hey! I'm Lucid Assistant. Tell me what you'd like to do.\n\nTry: \"my income is $5000/month\", \"spent $45 on groceries\", \"save $50k for a house\", or \"limit dining to $200/month\""
}

function loadMessages(): Message[] {
  try {
    const stored = sessionStorage.getItem('chat_messages')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return [INITIAL_MESSAGE]
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

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
      const res = await api.post('/ai/agent', { message: input })
      const result: AgentResult = res.data
      if (result.intent !== 'general') {
        window.dispatchEvent(new CustomEvent('lucid-data-changed'))
      }
      const lines = [result.message]
      const assistantMsg: Message = { role: 'assistant', content: lines.join('\n'), result }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    }

    setLoading(false)
    setInput('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Assistant</h1>
        <p className="text-ash text-sm mt-1">Add expenses, income, goals, rules, and more — just type naturally</p>
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
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#5266eb] text-white rounded-2xl rounded-br-sm'
                    : 'bg-[rgba(237,237,243,0.06)] text-ivory rounded-2xl rounded-bl-sm'
                }`}>
                  {msg.content.split('\n').map((line, j) => line ? <p key={j}>{line}</p> : <br key={j} />)}
                  {msg.result && <ResultCard result={msg.result} />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-start">
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
