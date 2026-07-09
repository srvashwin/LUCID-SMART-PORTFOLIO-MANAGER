export default function BankIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 2 9 22 9 22 7 12 2" />
      <rect x="4" y="11" width="4" height="7" />
      <rect x="10" y="11" width="4" height="7" />
      <rect x="16" y="11" width="4" height="7" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  )
}
