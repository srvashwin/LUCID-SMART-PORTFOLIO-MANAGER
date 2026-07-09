import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'

const quickGuide = [
  {
    step: '1',
    title: 'Add Your Income',
    desc: 'Go to the Assistant page and type something like "I earn $4000 per month from my job". Lucid will save it as your monthly income.',
    link: '/chat',
  },
  {
    step: '2',
    title: 'Log Your Expenses',
    desc: 'Type "spent $45 on groceries at Walmart" in the Assistant, or use the Quick Add form on the Dashboard for one-tap logging. Your expenses are automatically sorted by category.',
    link: '/dashboard',
  },
  {
    step: '3',
    title: 'Set a Budget',
    desc: 'On the Budget page, assign your income to spending categories. Lucid helps you track every dollar and shows progress bars so you never overspend.',
    link: '/budget',
  },
  {
    step: '4',
    title: 'Track Your Accounts',
    desc: 'Add your bank accounts, credit cards, and loans on the Accounts page. Lucid calculates your net worth automatically.',
    link: '/accounts',
  },
  {
    step: '5',
    title: 'Review and Improve',
    desc: 'The Dashboard shows your spending trends, savings rate, and debt payoff progress. Use the Analyze page to see the true cost of your purchases.',
    link: '/dashboard',
  },
]

const faqs = [
  {
    q: 'How do I add an expense?',
    a: 'There are two ways: 1) On the Dashboard, click "Add Expense" to open the quick form — enter the amount, pick a category, and tap "Log Expense". 2) On the Assistant page, type naturally like "spent $45 on groceries at Walmart" and Lucid will classify and save it automatically.',
  },
  {
    q: 'How do I add income?',
    a: 'Go to the Assistant page and type naturally, like "I earn $4000 per month from my job" or "received $500 freelance payment". Lucid will save it to your income records.',
  },
  {
    q: 'How do I add a credit card or loan?',
    a: 'On the Accounts page, click "Add Account" and choose "Credit Card" or "Loan" as the type. This debt will then show up on your Dashboard under Loans & Debt with a payoff progress bar.',
  },
  {
    q: 'How does the AI work?',
    a: 'Lucid uses Google Gemini to analyze your natural language input and extract amounts, categories, and merchants. Without a Gemini API key, Lucid falls back to smart keyword detection.',
  },
  {
    q: 'What are spending rules?',
    a: 'Spending rules let you set monthly limits per category. When you exceed a limit, Lucid will alert you. Create them on the Rules page.',
  },
  {
    q: 'How does the purchase analysis work?',
    a: 'The Analyze page shows the opportunity cost of a purchase based on your investment goals. It calculates what that money could grow to if invested instead, so you can make an informed decision.',
  },
  {
    q: 'How do I download reports?',
    a: 'Go to the Reports page, select a month and year, then download your data as Excel (.xlsx) or chart images (.png).',
  },
  {
    q: 'Is this financial advice?',
    a: 'No. Lucid provides data and projections for informational purposes only. All suggestions include a disclaimer that they are not financial advice.',
  },
  {
    q: 'How do I set up the Gemini API key?',
    a: 'Get a free API key from aistudio.google.com/apikey, then add it to the backend/.env file as GEMINI_API_KEY=your-key-here. Restart the backend server.',
  },
  {
    q: 'Is my data secure?',
    a: 'Your data is stored locally in your own database. Passwords are hashed using bcrypt. No financial data is shared with third parties.',
  },
]

export default function Help() {
  const navigate = useNavigate()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const filtered = faqs.filter(
    f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Help</h1>
        <p className="text-ash text-sm mt-1">Frequently asked questions and support</p>
      </div>

      {/* Quick Start Guide */}
      <GlassCard className="p-5" hover={false}>
        <h2 className="text-base font-semibold text-ivory mb-4" style={{ fontWeight: 600 }}>How Lucid Works</h2>
        <div className="space-y-4">
          {quickGuide.map(item => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#5266eb] flex items-center justify-center text-sm font-bold text-white shrink-0 mt-0.5">
                {item.step}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ivory">{item.title}</p>
                <p className="text-sm text-ash mt-0.5 leading-relaxed">{item.desc}</p>
                <button
                  onClick={() => navigate(item.link)}
                  className="text-xs text-[#5266eb] hover:text-[#6b7df5] transition-colors mt-1"
                >
                  Go to {item.title.replace('Your ', '').replace('the ', 'the ')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Search */}
      <GlassCard className="p-0" hover={false}>
        <div className="flex items-center px-5">
          <svg className="w-4 h-4 text-ash shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search for help..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-3.5 bg-transparent text-ivory text-sm outline-none placeholder-[#70707d]"
          />
        </div>
      </GlassCard>

      {/* FAQ */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((faq, i) => (
            <motion.div
              key={faq.q}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: i * 0.02 }}
            >
              <div
                className={`glass rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${openIndex === i ? 'ring-1 ring-[rgba(82,102,235,0.3)]' : ''}`}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-ivory">{faq.q}</p>
                    <svg
                      className={`w-4 h-4 text-ash transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <AnimatePresence>
                    {openIndex === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-ash mt-3 leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-ash text-sm">No results found. Try a different search term.</p>
        )}
      </div>

      {/* Contact */}
      <GlassCard className="p-5 text-center" hover={false}>
        <h2 className="text-sm font-medium text-ivory mb-2">Still need help?</h2>
        <p className="text-xs text-ash mb-3">Contact us and we'll get back to you within 24 hours.</p>
        <PillButton variant="outline">Contact Support</PillButton>
      </GlassCard>
    </div>
  )
}
