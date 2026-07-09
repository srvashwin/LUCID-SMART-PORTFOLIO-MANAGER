import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'
import PillButton from '../components/PillButton'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={40} />
          </div>
          <h1 className="text-xl font-semibold text-ivory" style={{ fontWeight: 600 }}>Welcome back</h1>
          <p className="text-sm text-ash mt-1">Sign in to your Lucid account</p>
        </div>

        <div className="glass rounded-xl p-6">
          {error && <p className="text-red-400 text-sm mb-3 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]"
            />
            <PillButton type="submit" className="w-full">Sign In</PillButton>
          </form>
          <p className="text-sm text-ash text-center mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#9cb4e8] hover:text-ivory transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
