interface IconProps {
  className?: string
}

export default function IncomeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <polyline points="17,6 12,1 7,6" />
      <polyline points="7,18 12,23 17,18" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
    </svg>
  )
}
