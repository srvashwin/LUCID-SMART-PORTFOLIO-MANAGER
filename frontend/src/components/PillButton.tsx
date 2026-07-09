interface PillButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'ghost' | 'outline'
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

export default function PillButton({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}: PillButtonProps) {
  const base = 'pill px-5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2'
  const variants = {
    primary: 'bg-[#5266eb] text-white hover:brightness-110 active:translate-y-[1px] disabled:opacity-50',
    ghost: 'text-ivory hover:bg-[rgba(82,102,235,0.12)] active:translate-y-[1px] disabled:opacity-50',
    outline: 'border border-[#ededf3] text-ivory hover:bg-[rgba(237,237,243,0.06)] active:translate-y-[1px] disabled:opacity-50',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
