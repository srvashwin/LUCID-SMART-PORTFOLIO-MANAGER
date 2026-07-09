interface PillBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'success' | 'warning'
  className?: string
}

export default function PillBadge({ children, variant = 'default', className = '' }: PillBadgeProps) {
  const colors = {
    default: 'bg-[rgba(237,237,243,0.08)] text-ash',
    accent: 'bg-[rgba(82,102,235,0.15)] text-[#9cb4e8]',
    success: 'bg-[rgba(52,211,153,0.12)] text-[#34d399]',
    warning: 'bg-[rgba(251,191,36,0.12)] text-[#fbbf24]',
  }
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant]} ${className}`}>
      {children}
    </span>
  )
}
