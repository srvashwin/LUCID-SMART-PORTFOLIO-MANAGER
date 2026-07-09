import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const seen = localStorage.getItem('lucid_welcomed')
    if (!seen) {
      setTimeout(() => setVisible(true), 400)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('lucid_welcomed', 'true')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            className="glass-card rounded-2xl p-8 w-full max-w-md mx-4 text-center"
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5266eb"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4"
            >
              <polygon points="12 2 22 12 12 22 2 12 12 2" fill="#5266eb" fillOpacity="0.2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>

            <h2 className="text-xl font-semibold text-white mb-2">Welcome to Lucid</h2>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Try our AI Agent to add expenses, set income, create goals, and manage everything — just type naturally.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { dismiss(); navigate('/chat') }}
                className="flex-1 py-3 rounded-xl bg-[#5266eb] hover:bg-[#4555d0] text-white font-medium text-sm transition-all active:scale-[0.98]"
              >
                Try the Agent
              </button>
              <button
                onClick={dismiss}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-sm transition-all"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
