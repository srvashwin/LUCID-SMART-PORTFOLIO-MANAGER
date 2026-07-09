import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import AuthLayout from '../components/AuthLayout'
import PillButton from '../components/PillButton'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This password reset link is missing or invalid.">
        <Link to="/forgot-password" className="text-sm text-[#9cb4e8] hover:text-ivory transition-colors font-medium block text-center mt-4">Request a new link</Link>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout title="Password reset" subtitle="Your password has been updated successfully.">
        <div className="text-center space-y-4">
          <svg className="w-12 h-12 text-emerald-400 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <PillButton onClick={() => navigate('/login')}>Sign In</PillButton>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set new password" subtitle="Enter your new password below.">
      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 px-3.5 py-2.5 rounded-lg">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-ash mb-1.5 tracking-wide">New Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-2.5 bg-[#14141e] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] focus:ring-4 focus:ring-[rgba(82,102,235,0.12)] transition-all placeholder-[#5c5c68]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ash mb-1.5 tracking-wide">Confirm Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-[#14141e] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] focus:ring-4 focus:ring-[rgba(82,102,235,0.12)] transition-all placeholder-[#5c5c68]"
          />
        </div>
        <PillButton type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? 'Resetting…' : 'Reset Password'}
        </PillButton>
      </form>
    </AuthLayout>
  )
}
