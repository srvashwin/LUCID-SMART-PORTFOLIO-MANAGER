import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'
import HelpBot from './HelpBot'
import WelcomePopup from './WelcomePopup'
import {
  DashboardIcon, ChatIcon, ExpenseIcon, SubscriptionIcon, RuleIcon,
  GoalIcon, AnalyzeIcon, BankIcon, ReportIcon, AccountIcon, HelpIcon, BudgetIcon,
} from './icons'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/chat', label: 'Assistant', icon: ChatIcon },
  { to: '/expenses', label: 'Expenses', icon: ExpenseIcon },
  { to: '/subscriptions', label: 'Subscriptions', icon: SubscriptionIcon },
  { to: '/rules', label: 'Rules', icon: RuleIcon },
  { to: '/budget', label: 'Budget', icon: BudgetIcon },
  { to: '/goals', label: 'Investments', icon: GoalIcon },
  { to: '/analyze', label: 'Analyze', icon: AnalyzeIcon },
  { to: '/accounts', label: 'Accounts', icon: BankIcon },
  { to: '/reports', label: 'Reports', icon: ReportIcon },
]

const bottomItems = [
  { to: '/account', label: 'Account', icon: AccountIcon },
  { to: '/help', label: 'Help', icon: HelpIcon },
]

export default function Layout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#08080f] flex">
      <aside className="w-52 flex-shrink-0 glass-strong flex flex-col h-screen sticky top-0">
        <div className="px-4 py-4 border-b border-[rgba(237,237,243,0.06)]">
          <Logo />
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-all duration-200 ${
                  isActive
                    ? 'bg-[rgba(82,102,235,0.12)] text-[#9cb4e8] font-medium'
                    : 'text-[#d4d4dd] hover:text-ivory hover:bg-[rgba(237,237,243,0.04)]'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-2 py-2 border-t border-[rgba(237,237,243,0.06)] space-y-0.5">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-all duration-200 ${
                  isActive
                    ? 'bg-[rgba(82,102,235,0.12)] text-[#9cb4e8] font-medium'
                    : 'text-[#d4d4dd] hover:text-ivory hover:bg-[rgba(237,237,243,0.04)]'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="px-3 py-3 border-t border-[rgba(237,237,243,0.06)]">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-[#d4d4dd] hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-[rgba(237,237,243,0.04)] text-left"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto max-w-6xl mx-auto w-full">
        <Outlet />
      </main>

      <HelpBot />
      <WelcomePopup />
    </div>
  )
}
