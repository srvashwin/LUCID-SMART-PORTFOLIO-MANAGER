import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import AuthLayout from '../components/AuthLayout'
import PillButton from '../components/PillButton'
import { useHousehold } from '../hooks/useHousehold'

export default function JoinHousehold() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || ''
  const navigate = useNavigate()
  const { setCurrentHouseholdId, refresh } = useHousehold()
  const [joining, setJoining] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) {
      setError('No invite code provided')
    }
  }, [code])

  const handleJoin = async () => {
    setJoining(true)
    setError('')
    try {
      const res = await api.post('/households/join', { invite_code: code })
      setCurrentHouseholdId(res.data.household.id)
      refresh()
      setDone(true)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to join'
      setError(detail)
    } finally {
      setJoining(false)
    }
  }

  if (done) {
    return (
      <AuthLayout title="Joined!" subtitle="You are now a member of this household.">
        <div className="text-center space-y-4">
          <svg className="w-12 h-12 text-emerald-400 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <PillButton onClick={() => navigate('/dashboard')}>Go to Dashboard</PillButton>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Join Household" subtitle={code ? 'You\'ve been invited to join a household.' : ''}>
      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 px-3.5 py-2.5 rounded-lg">
          {error}
        </p>
      )}
      {code && (
        <div className="text-center space-y-4">
          <div className="bg-[#14141e] rounded-lg p-4">
            <p className="text-xs text-ash mb-1">Invite Code</p>
            <p className="text-sm text-ivory font-mono">{code}</p>
          </div>
          <PillButton onClick={handleJoin} disabled={joining}>
            {joining ? 'Joining…' : 'Accept Invitation'}
          </PillButton>
        </div>
      )}
    </AuthLayout>
  )
}
