import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import AuthLayout from '../components/AuthLayout'
import PillButton from '../components/PillButton'

export default function VerificationPending() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleResend = async () => {
    if (!email) return
    setLoading(true)
    try {
      await api.post('/auth/resend-verification', { email })
      setResent(true)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Check your email" subtitle="Verify your email address to get started.">
      <div className="text-center space-y-5">
        <svg className="w-12 h-12 text-[#5266eb] mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        {email ? (
          <p className="text-sm text-ash">
            We sent a verification email to<br />
            <span className="text-ivory font-medium">{email}</span>
          </p>
        ) : (
          <p className="text-sm text-ash">
            We sent a verification email to your registered address.
          </p>
        )}
        <p className="text-xs text-ash">Click the link in the email to verify your account and sign in automatically.</p>
        <div className="pt-2 space-y-2">
          <PillButton onClick={handleResend} disabled={loading || resent} variant="outline" className="w-full">
            {loading ? 'Sending…' : resent ? 'Verification email sent!' : 'Resend verification email'}
          </PillButton>
          <Link to="/login" className="text-sm text-[#9cb4e8] hover:text-ivory transition-colors font-medium block mt-3">
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
