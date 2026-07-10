import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'
import { useAuth } from '../hooks/useAuth'
import { useHousehold } from '../hooks/useHousehold'

type Message = { role: 'bot' | 'user'; text: string; result?: AgentResult }
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

const knowledgeBase: Record<string, string> = {
  'add expense': 'You can add expenses two ways: 1) On the Dashboard, click "Add Expense" and fill in the amount, category, and description. 2) On the Assistant page, just type naturally like "spent $45 on groceries at Walmart" and Lucid will classify and save it automatically.',
  'how to add': 'You can add expenses two ways: 1) On the Dashboard, click "Add Expense" and fill in the amount, category, and description. 2) On the Assistant page, just type naturally like "spent $45 on groceries at Walmart" and Lucid will classify and save it automatically.',
  'add income': 'Go to the Assistant page and type naturally, like "I earn $4000 per month from my job" or "received $500 freelance payment". Lucid will save it as your income.',
  'income': 'Go to the Assistant page and type naturally, like "I earn $4000 per month from my job" or "received $500 freelance payment". Lucid will save it as your income.',
  'rule': 'Spending rules are on the Rules page. Set a monthly or weekly limit per category — Lucid will alert you when you exceed it.',
  'limit': 'Spending rules are on the Rules page. Set a monthly or weekly limit per category — Lucid will alert you when you exceed it.',
  'goal': 'Investments are on the Investments page. You can set investment plans or savings targets (vacation, down payment, emergency fund, etc.).',
  'investment goal': 'Investments are on the Investments page. You can set investment plans or savings targets (vacation, down payment, emergency fund, etc.).',
  'savings': 'Savings goals are on the Investments page. You can set savings targets like a vacation, down payment, emergency fund, or anything else.',
  'analyze': 'The Analyze page shows the opportunity cost of a purchase — what that money could grow to if invested instead.',
  'report': 'Go to the Reports page to download Excel spreadsheets and chart images with your spending breakdown by category.',
  'download': 'Go to the Reports page to download Excel spreadsheets and chart images with your spending breakdown by category.',
  'excel': 'Go to the Reports page to download Excel spreadsheets and chart images with your spending breakdown by category.',
  'currency': 'Go to Account and change your currency in the Preferences section. We support 20 currencies including USD, EUR, GBP, JPY, and more.',
  'change currency': 'Go to Account and change your currency in the Preferences section. We support 20 currencies including USD, EUR, GBP, JPY, and more.',
  'account': 'The Account page lets you update your name, email, and preferred currency.',
  'chat': 'The Assistant page lets you add expenses by typing naturally. Just describe a purchase and Lucid will classify and save it. You can also add income and set goals here.',
  'dashboard': 'The Dashboard shows your monthly spending summary, category charts, budget status, savings goals progress, and debt payoff tracking all in one place.',
  'navigation': 'Use the sidebar on the left to navigate between pages. Each page has a specific purpose: Assistant (add data), Budget (plan spending), Accounts (track net worth), Investments (set targets).',
  'budget page': 'The Budget page lets you assign your income to categories. Choose Envelope mode for simple limits or Zero-Based mode to assign every dollar a job.',
  'subscription': 'The Subscriptions page shows recurring payments detected from your expense history. Lucid finds patterns like monthly streaming services automatically.',
  'accounts page': 'The Accounts page lets you track your assets (checking, savings, investments) and liabilities (credit cards, loans). Your net worth is calculated automatically.',
  'debt': 'Add credit cards and loans on the Accounts page. They will appear on your Dashboard under "Loans & Debt" with payoff progress bars showing how close you are to being debt-free.',
  'loan': 'Add credit cards and loans on the Accounts page. They will appear on your Dashboard under "Loans & Debt" with payoff progress bars showing how close you are to being debt-free.',
  'credit card': 'Add credit cards on the Accounts page as a "Credit Card" type. The balance will show up as a debt on your Dashboard.',
  'budget': 'The Budget page lets you plan your spending. First add your income on the Assistant page, then go to Budget to assign each category a limit.',
  'net worth': 'Your net worth is calculated on the Accounts page as Total Assets minus Total Liabilities. Add all your accounts there to see your true net worth.',
  'hello': 'Hey {name}! Welcome to Lucid. I can help you add expenses, set income, create goals, and more. Try saying "add expense" or "how do I get started?"',
  'hi': 'Hey {name}! Welcome to Lucid. I can help you add expenses, set income, create goals, and more. Try saying "add expense" or "how do I get started?"',
  'thanks': "You're welcome! Let me know if you need anything else.",
  'who are you': "I'm Lucid Assistant! I can help you manage your finances, add expenses, set goals, track debt, and more. Try typing something like 'spent $20 on lunch' or 'set a savings goal of $5000'.",
  'start': 'To get started with Lucid: 1) Add your income on the Assistant page ("I earn $4000/month"), 2) Log expenses as they happen, 3) Set a budget on the Budget page, 4) Add accounts on the Accounts page to track net worth. Your Dashboard shows everything at a glance!',
  'getting started': 'To get started with Lucid: 1) Add your income on the Assistant page ("I earn $4000/month"), 2) Log expenses as they happen, 3) Set a budget on the Budget page, 4) Add accounts on the Accounts page to track net worth. Your Dashboard shows everything at a glance!',
  'how does this work': 'To get started with Lucid: 1) Add your income on the Assistant page ("I earn $4000/month"), 2) Log expenses as they happen, 3) Set a budget on the Budget page, 4) Add accounts on the Accounts page to track net worth. Your Dashboard shows everything at a glance!',
}

const quickActions = [
  { label: 'Add an expense', keyword: 'add expense' },
  { label: 'Add income', keyword: 'add income' },
  { label: 'How to start', keyword: 'getting started' },
  { label: 'Set a budget', keyword: 'budget' },
  { label: 'Track debt', keyword: 'debt' },
]

function findFAQ(input: string, userName?: string): string | null {
  const lower = input.toLowerCase()
  for (const [key, response] of Object.entries(knowledgeBase)) {
    if (lower.includes(key)) return response.replace('{name}', userName || 'there')
  }
  return null
}

function AgentResultCard({ result }: { result: AgentResult }) {
  const { currency } = useCurrency()
  const d = result.data

  if (result.intent === 'add_income' && d.income) {
    return (
      <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-lg p-2.5">
        <p className="text-green-400 text-xs font-medium">Income Added</p>
        <p className="text-white text-xs mt-0.5">{formatAmount(d.income.amount, currency)} / {d.income.frequency}</p>
        <p className="text-white/50 text-xs">Source: {d.income.source}</p>
      </div>
    )
  }
  if (result.intent === 'add_expense' && d.expense) {
    return (
      <div className="mt-2 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5">
        <p className="text-orange-400 text-xs font-medium">Expense Recorded</p>
        <p className="text-white text-xs mt-0.5">{formatAmount(d.expense.amount, currency)}</p>
        <p className="text-white/50 text-xs">{d.expense.category}</p>
      </div>
    )
  }
  if ((result.intent === 'add_investment_goal' || result.intent === 'add_savings_goal') && d.goal) {
    return (
      <div className="mt-2 bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5">
        <p className="text-purple-400 text-xs font-medium">Goal Created</p>
        <p className="text-white text-xs mt-0.5">{formatAmount(d.goal.target_amount, currency)}</p>
        <p className="text-white/50 text-xs">{d.goal.name || d.goal.type?.replace('_', ' ') || 'Savings'}</p>
      </div>
    )
  }
  if (result.intent === 'add_to_fund' && d.fund) {
    return (
      <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
        <p className="text-emerald-400 text-xs font-medium">Fund Updated</p>
        <p className="text-white text-xs mt-0.5">{formatAmount(d.fund.amount, currency)}</p>
        <p className="text-white/50 text-xs">{d.fund.name}</p>
      </div>
    )
  }

  if (result.intent === 'add_spending_rule' && d.rule) {
    return (
      <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5">
        <p className="text-blue-400 text-xs font-medium">Rule Set</p>
        <p className="text-white text-xs mt-0.5">{formatAmount(d.rule.max_amount, currency)} / {d.rule.period}</p>
        <p className="text-white/50 text-xs">{d.rule.category}</p>
      </div>
    )
  }
  if (result.intent === 'change_currency' && d.currency) {
    return (
      <div className="mt-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2.5">
        <p className="text-cyan-400 text-xs font-medium">Currency Changed</p>
        <p className="text-white text-xs">Now using {d.currency}</p>
      </div>
    )
  }
  return null
}

function FundConfirmCard({ result, onDone }: { result: AgentResult; onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const action = result.action
  if (!action || action.type !== 'confirm_create_fund' || done) return null

  const handleYes = async () => {
    setLoading(true)
    try {
      await api.post('/funds', action.payload)
      window.dispatchEvent(new CustomEvent('lucid-data-changed'))
      setDone(true)
      onDone()
    } catch {}
    setLoading(false)
  }

  return (
    <div className="mt-2 flex gap-2">
      <button
        onClick={handleYes}
        disabled={loading}
        className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Yes, create fund'}
      </button>
      <button
        onClick={() => { setDone(true); onDone() }}
        disabled={loading}
        className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-ash hover:text-ivory hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
      >
        No
      </button>
    </div>
  )
}

export default function HelpBot() {
  const { user } = useAuth()
  const { activeHouseholdId } = useHousehold()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: user?.name ? `Hey ${user.name}! I'm Lucid Assistant. How can I help you?` : "Hey! I'm Lucid Assistant. How can I help you?" },
  ])
  const [input, setInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text: string) => {
    const q = text.trim()
    if (!q) return
    setMessages((prev) => [...prev, { role: 'user', text: q }])
    setInput('')

    const faq = findFAQ(q, user?.name)
    if (faq) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'bot', text: faq }])
      }, 300)
      return
    }

    try {
      const agentPayload: any = { message: q }
      if (activeHouseholdId) agentPayload.household_id = activeHouseholdId
      const res = await api.post('/ai/agent', agentPayload)
      const result: AgentResult = res.data
      if (result.intent !== 'general') {
        window.dispatchEvent(new CustomEvent('lucid-data-changed'))
      }
      const lines = [result.message]
      setMessages((prev) => [...prev, { role: 'bot', text: lines.join('\n'), result }])
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: "I'm not sure what you'd like to do. Try one of the quick actions above, or ask me something specific!" }])
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 z-50 glass rounded-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '520px' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5266eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 22 12 12 22 2 12 12 2" fill="#5266eb" fillOpacity="0.2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span className="text-sm font-semibold text-white">Lucid Assistant</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-3 border-b border-white/5 overflow-x-auto">
              <div className="flex gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.keyword}
                    onClick={() => handleSend(action.label)}
                    className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: '300px' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#5266eb] text-white'
                        : 'bg-white/10 text-white/80'
                    }`}
                  >
                    {msg.text.split('\n').map((line, j) => line ? <p key={j}>{line}</p> : <br key={j} />)}
                    {msg.result && <AgentResultCard result={msg.result} />}
                    {msg.result?.action?.type === 'confirm_create_fund' && (
                      <FundConfirmCard result={msg.result} onDone={() => {}} />
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5266eb] transition-colors"
                />
                <button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim()}
                  className="px-3 py-2.5 rounded-xl bg-[#5266eb] hover:bg-[#4555d0] disabled:opacity-40 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#5266eb] hover:bg-[#4555d0] shadow-lg shadow-[#5266eb]/30 flex items-center justify-center transition-all active:scale-90"
      >
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 12 12 22 2 12 12 2" fill="white" fillOpacity="0.3" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        )}
      </button>
    </>
  )
}
