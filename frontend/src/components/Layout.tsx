import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HouseholdProvider } from '../hooks/useHousehold'
import { ToastProvider } from './Toast'
import Logo from './Logo'
import HelpBot from './HelpBot'
import WelcomePopup from './WelcomePopup'
import CommandPalette from './CommandPalette'
import {
  DashboardIcon, ChatIcon, ExpenseIcon, SubscriptionIcon, RuleIcon,
  GoalIcon, AnalyzeIcon, BankIcon, ReportIcon, AccountIcon, HelpIcon, BudgetIcon, PortfolioIcon, RecurringIcon, HouseholdIcon, IncomeIcon,
} from './icons'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
      { to: '/chat', label: 'Assistant', icon: ChatIcon },
    ],
  },
  {
    label: 'Money',
    items: [
      { to: '/income', label: 'Income', icon: IncomeIcon },
      { to: '/expenses', label: 'Expenses', icon: ExpenseIcon },
      { to: '/subscriptions', label: 'Subscriptions', icon: SubscriptionIcon },
      { to: '/recurring', label: 'Recurring', icon: RecurringIcon },
      { to: '/budget', label: 'Budget', icon: BudgetIcon },
      { to: '/rules', label: 'Rules', icon: RuleIcon },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/portfolio', label: 'Portfolio', icon: PortfolioIcon },
      { to: '/goals', label: 'Goals', icon: GoalIcon },
      { to: '/analyze', label: 'Analyze', icon: AnalyzeIcon },
      { to: '/accounts', label: 'Accounts', icon: BankIcon },
      { to: '/reports', label: 'Reports', icon: ReportIcon },
    ],
  },
]

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const displayNavGroups = navGroups.map(g => {
    if (g.label === 'Insights') {
      return {
        ...g,
        items: [
          ...g.items,
          { to: '/household', label: 'Household', icon: HouseholdIcon },
        ],
      }
    }
    return g
  })

  return (
    <>
      <div className="px-4 py-4 border-b border-[rgba(237,237,243,0.06)]">
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {displayNavGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5c5c68]">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-[rgba(82,102,235,0.12)] text-[#9cb4e8] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                        : 'text-[#d4d4dd] hover:text-ivory hover:bg-[rgba(237,237,243,0.04)]'
                    }`
                  }
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  )
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileMounted, setMobileMounted] = useState(false)
  const navigate = useNavigate()

  const closeMobile = () => {
    setMobileOpen(false)
    setTimeout(() => setMobileMounted(false), 300)
  }

  const toggleMobile = () => {
    if (!mobileOpen) setMobileMounted(true)
    setMobileOpen(!mobileOpen)
  }

  return (
    <ToastProvider>
      <HouseholdProvider>
      <div className="min-h-screen bg-[#08080f] flex">
        {/* Hamburger */}
        <button
          onClick={toggleMobile}
          className="fixed top-4 left-4 z-50 md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-[#1e1e2a] border border-[rgba(237,237,243,0.08)] text-ivory hover:bg-[#272735] transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {/* Mobile overlay */}
        <AnimatePresence>
          {(mobileOpen || mobileMounted) && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Mobile drawer */}
        <AnimatePresence>
          {(mobileOpen || mobileMounted) && (
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-52 glass-strong flex flex-col md:hidden"
            >
              <SidebarContent onNavClick={closeMobile} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-52 flex-shrink-0 glass-strong flex-col h-screen sticky top-0">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-auto max-w-6xl mx-auto w-full min-h-screen">
          {/* Top header */}
          <div className="flex items-center justify-end gap-3 mb-6">
            <button onClick={() => navigate('/help')} className="w-9 h-9 flex items-center justify-center rounded-lg text-ash hover:text-ivory hover:bg-[rgba(237,237,243,0.04)] transition-all" aria-label="Help">
              <HelpIcon className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/account')} className="w-9 h-9 flex items-center justify-center rounded-lg text-ash hover:text-ivory hover:bg-[rgba(237,237,243,0.04)] transition-all" aria-label="Account settings">
              <AccountIcon className="w-5 h-5" />
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={useLocation().pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <HelpBot />
        <WelcomePopup />
        <CommandPalette />
      </div>
      </HouseholdProvider>
    </ToastProvider>
  )
}