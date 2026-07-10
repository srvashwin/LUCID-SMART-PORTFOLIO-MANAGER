import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'

const actions = [
  { id: 'dashboard', label: 'Go to Dashboard', keywords: 'home main', path: '/dashboard' },
  { id: 'chat', label: 'Open Assistant', keywords: 'ai agent help', path: '/chat' },
  { id: 'expenses', label: 'View Expenses', keywords: 'spending transactions', path: '/expenses' },
  { id: 'income', label: 'View Income', keywords: 'salary earnings', path: '/income' },
  { id: 'budget', label: 'Open Budget', keywords: 'spending plan month', path: '/budget' },
  { id: 'portfolio', label: 'View Portfolio', keywords: 'investments holdings stocks', path: '/portfolio' },
  { id: 'subscriptions', label: 'Manage Subscriptions', keywords: 'recurring bills', path: '/subscriptions' },
  { id: 'recurring', label: 'Recurring Transactions', keywords: 'monthly bills', path: '/recurring' },
  { id: 'rules', label: 'Spending Rules', keywords: 'limits alerts', path: '/rules' },
  { id: 'accounts', label: 'Net Worth Accounts', keywords: 'assets liabilities', path: '/accounts' },
  { id: 'goals', label: 'Financial Goals', keywords: 'savings targets', path: '/goals' },
  { id: 'analyze', label: 'Analyze Spending', keywords: 'insights trends', path: '/analyze' },
  { id: 'reports', label: 'Reports', keywords: 'export excel pdf', path: '/reports' },
  { id: 'import', label: 'Import Statement', keywords: 'csv bank upload', path: '/import' },
  { id: 'settings', label: 'Account Settings', keywords: 'profile currency', path: '/account' },
]

export default function CommandPalette() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const el = document.getElementById('cmdk-input')
        if (el) {
          el.focus()
        } else {
          const container = document.getElementById('cmdk-overlay')
          if (container) container.style.display = 'flex'
        }
      }
      if (e.key === 'Escape') {
        const container = document.getElementById('cmdk-overlay')
        if (container) container.style.display = 'none'
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSelect = (path: string) => {
    const container = document.getElementById('cmdk-overlay')
    if (container) container.style.display = 'none'
    navigate(path)
  }

  return (
    <div
      id="cmdk-overlay"
      style={{ display: 'none' }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          (e.currentTarget as HTMLElement).style.display = 'none'
        }
      }}
    >
      <Command className="w-full max-w-lg bg-[#1e1e2a] border border-[rgba(237,237,243,0.08)] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center px-4 border-b border-[rgba(237,237,243,0.06)]">
          <svg className="w-4 h-4 text-ash shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Command.Input
            id="cmdk-input"
            autoFocus
            placeholder="Search pages..."
            className="w-full px-3 py-4 bg-transparent text-ivory text-sm outline-none placeholder:text-ash"
          />
          <kbd className="text-[10px] text-ash bg-[rgba(237,237,243,0.06)] px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <Command.List className="max-h-64 overflow-y-auto p-2">
          <Command.Empty className="text-sm text-ash text-center py-8">No results found.</Command.Empty>
          <Command.Group heading={
            <span className="text-xs font-medium text-ash uppercase tracking-wider px-2 py-1.5">Pages</span>
          }>
            {actions.map(a => (
              <Command.Item
                key={a.id}
                value={`${a.label} ${a.keywords}`}
                onSelect={() => handleSelect(a.path)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ivory cursor-pointer aria-selected:bg-[rgba(82,102,235,0.15)] aria-selected:text-[#aebbff] transition-colors"
              >
                <span>{a.label}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}
