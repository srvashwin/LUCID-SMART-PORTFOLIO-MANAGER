import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Logo from './Logo'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

const stats = [
  { label: 'Net worth tracked', value: '$2.4M+' },
  { label: 'Accounts synced', value: '12k+' },
  { label: 'Avg. savings lift', value: '18%' },
]

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#08080f] flex">
      {/* Form column */}
      <div className="w-full lg:w-[440px] flex-shrink-0 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <Logo size={32} />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-2xl text-ivory mb-1.5" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              {title}
            </h1>
            <p className="text-sm text-ash mb-8">{subtitle}</p>
            {children}
          </motion.div>
        </div>
      </div>

      {/* Branded panel — hidden on small screens */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center border-l border-[rgba(237,237,243,0.06)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 60% at 25% 15%, rgba(82,102,235,0.22), transparent 60%),' +
              'radial-gradient(60% 50% at 90% 85%, rgba(139,92,246,0.14), transparent 60%),' +
              'linear-gradient(180deg, #0b0b16 0%, #08080f 100%)',
          }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#ededf3" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="relative z-10 max-w-md px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center mb-8"
          >
            <div className="glass rounded-2xl p-6">
              <Logo size={56} showText={false} />
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-2xl text-ivory mb-3"
            style={{ fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            Clarity for every dollar
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-sm text-ash leading-relaxed mb-10"
          >
            Track spending, investments, and net worth in one calm, intelligent
            view — built for people who want their money to make sense.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="grid grid-cols-3 gap-3"
          >
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-xl px-3 py-4">
                <p className="text-lg text-ivory" style={{ fontWeight: 700 }}>{s.value}</p>
                <p className="text-[11px] text-ash mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
