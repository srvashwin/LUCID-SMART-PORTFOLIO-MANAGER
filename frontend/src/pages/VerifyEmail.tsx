import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuthLayout from '../components/AuthLayout'
import PillButton from '../components/PillButton'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { verifyEmail } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Missing verification token.')
      return
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: any) => {
        setStatus('error')
        setErrorMsg(err.response?.data?.detail || 'Verification failed.')
      })
  }, [token, verifyEmail])

  if (status === 'loading') {
    return (
      <AuthLayout title="Verifying your email" subtitle="Please wait...">
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#5266eb] border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Email verified!" subtitle="Your email has been verified successfully.">
        <div className="text-center space-y-4">
          <svg className="w-12 h-12 text-emerald-400 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="text-sm text-ash">You're being signed in automatically...</p>
          <PillButton onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</PillButton>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Verification failed" subtitle="We couldn't verify your email.">
      <div className="text-center space-y-4">
        <p className="text-sm text-red-400">{errorMsg}</p>
        <Link to="/login" className="text-sm text-[#9cb4e8] hover:text-ivory transition-colors font-medium block">
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  )
}
