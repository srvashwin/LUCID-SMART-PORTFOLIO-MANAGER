import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'
import PillButton from '../components/PillButton'
import { getAllCurrencies } from '../utils/format'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [error, setError] = useState('')
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await signup(email, name, password, currency)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={40} />
          </div>
          <h1 className="text-xl font-semibold text-ivory" style={{ fontWeight: 600 }}>Create your account</h1>
          <p className="text-sm text-ash mt-1">Start tracking your finances with Lucid</p>
        </div>

        <div className="glass rounded-xl p-6">
          {error && <p className="text-red-400 text-sm mb-3 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]"
            />
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
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
            >
              {getAllCurrencies().map(c => (
                <option key={c.code} value={c.code}>{c.symbol} - {c.name} ({c.code})</option>
              ))}
            </select>
            <PillButton type="submit" className="w-full">Create Account</PillButton>
          </form>
          <p className="text-sm text-ash text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-[#9cb4e8] hover:text-ivory transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
