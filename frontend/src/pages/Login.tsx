import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../hooks/useAuth'
import { GOOGLE_CLIENT_ID } from '../App'
import AuthLayout from '../components/AuthLayout'
import PillButton from '../components/PillButton'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (detail === 'Email not verified') {
        navigate(`/verify-email-pending?email=${encodeURIComponent(email)}`)
        return
      }
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Lucid account">
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
        <div>
          <label className="block text-xs font-medium text-ash mb-1.5 tracking-wide">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-[#14141e] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] focus:ring-4 focus:ring-[rgba(82,102,235,0.12)] transition-all placeholder-[#5c5c68]"
          />
        </div>
        <div className="flex items-center justify-end mt-1">
          <Link to="/forgot-password" className="text-xs text-ash hover:text-[#9cb4e8] transition-colors">
            Forgot password?
          </Link>
        </div>
        <PillButton type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </PillButton>
      </form>
      {GOOGLE_CLIENT_ID && (
        <>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(237,237,243,0.08)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#08080f] px-3 text-ash">or</span>
            </div>
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              theme="filled_black"
              size="large"
              shape="pill"
              width="400"
              text="signin_with"
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  try {
                    await googleLogin(credentialResponse.credential)
                    navigate('/dashboard')
                  } catch {
                    setError('Google sign-in failed. Please try again.')
                  }
                }
              }}
              onError={() => setError('Google sign-in failed. Please try again.')}
            />
          </div>
        </>
      )}
      <p className="text-sm text-ash text-center mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="text-[#9cb4e8] hover:text-ivory transition-colors font-medium">Sign up</Link>
      </p>
    </AuthLayout>
  )
}
