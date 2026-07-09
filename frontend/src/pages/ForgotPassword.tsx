import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import AuthLayout from '../components/AuthLayout'
import PillButton from '../components/PillButton'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent a reset link if that email is registered.">
        <div className="text-center space-y-4">
          <svg className="w-12 h-12 text-emerald-400 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="text-sm text-ash">If an account exists for <span className="text-ivory">{email}</span>, you'll receive a password reset link shortly.</p>
          <Link to="/login" className="text-sm text-[#9cb4e8] hover:text-ivory transition-colors font-medium block mt-4">Back to Sign In</Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot password" subtitle="Enter your email to receive a reset link">
      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 px-3.5 py-2.5 rounded-lg">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-ash mb-1.5 tracking-wide">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-2.5 bg-[#14141e] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] focus:ring-4 focus:ring-[rgba(82,102,235,0.12)] transition-all placeholder-[#5c5c68]"
          />
        </div>
        <PillButton type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </PillButton>
      </form>
      <p className="text-sm text-ash text-center mt-6">
        Remember your password?{' '}
        <Link to="/login" className="text-[#9cb4e8] hover:text-ivory transition-colors font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
