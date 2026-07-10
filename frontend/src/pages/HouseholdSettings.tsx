import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import type { Household, HouseholdDetail } from '../types'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'
import ConfirmDialog from '../components/ConfirmDialog'
import { LoadingCard } from '../components/LoadingSkeleton'
import { useToast } from '../components/Toast'
import { useHousehold } from '../hooks/useHousehold'

export default function HouseholdSettings() {
  const { households, currentHousehold, setCurrentHouseholdId, refresh } = useHousehold()
  const [details, setDetails] = useState<HouseholdDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [shareData, setShareData] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [confirmTransfer, setConfirmTransfer] = useState<number | null>(null)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<{ memberId: number; name: string } | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  const fetchDetails = () => {
    if (!currentHousehold) return
    setLoading(true)
    api.get(`/households/${currentHousehold.household.id}`)
      .then(r => setDetails(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (currentHousehold) fetchDetails()
  }, [currentHousehold])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/households', { name, share_data: shareData })
      toast('Household created', 'success')
      setShowCreate(false)
      setName('')
      setShareData(false)
      refresh()
    } catch {
      toast('Failed to create household', 'error')
    }
  }

  const handleGenerateInvite = async () => {
    if (!details) return
    try {
      const res = await api.post(`/households/${details.household.id}/invite`)
      setInviteCode(res.data.invite_code)
      setDetails(prev => prev ? {
        ...prev,
        household: { ...prev.household, invite_code: res.data.invite_code },
      } : null)
      toast('Invite link generated', 'success')
    } catch {
      toast('Failed to generate invite', 'error')
    }
  }

  const handleTransfer = async (userId: number) => {
    if (!details) return
    try {
      await api.post(`/households/${details.household.id}/transfer`, { user_id: userId })
      toast('Ownership transferred', 'success')
      setConfirmTransfer(null)
      fetchDetails()
      refresh()
    } catch {
      toast('Failed to transfer', 'error')
    }
  }

  const handleLeave = async () => {
    if (!details) return
    try {
      await api.post(`/households/${details.household.id}/leave`)
      toast('Left household', 'success')
      setConfirmLeave(false)
      setDetails(null)
      setCurrentHouseholdId(null)
      refresh()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to leave'
      toast(detail, 'error')
    }
  }

  const handleRemove = async () => {
    if (!details || !confirmRemove) return
    try {
      await api.delete(`/households/${details.household.id}/members/${confirmRemove.memberId}`)
      toast('Member removed', 'success')
      setConfirmRemove(null)
      fetchDetails()
    } catch {
      toast('Failed to remove member', 'error')
    }
  }

  const switchHousehold = (id: number) => {
    setCurrentHouseholdId(id)
    setInviteCode('')
  }

  const joinLink = inviteCode || details?.household.invite_code
    ? `${window.location.origin}/join?code=${inviteCode || details?.household.invite_code}`
    : null

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirmTransfer !== null}
        title="Transfer Ownership?"
        message="This will make another member the owner. You will become an admin."
        onConfirm={() => handleTransfer(confirmTransfer!)}
        onCancel={() => setConfirmTransfer(null)}
      />
      <ConfirmDialog
        open={confirmLeave}
        title="Leave Household?"
        message="You will lose access to shared accounts and budgets."
        onConfirm={handleLeave}
        onCancel={() => setConfirmLeave(false)}
      />
      <ConfirmDialog
        open={confirmRemove !== null}
        title="Remove Member?"
        message={`Remove ${confirmRemove?.name || 'this member'} from the household?`}
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(null)}
      />

      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Household</h1>
        <p className="text-ash text-sm mt-1">Manage shared finances with family or partners</p>
      </div>

      {/* Create Household */}
      {showCreate && (
        <GlassCard className="p-5" hover={false}>
          <form onSubmit={handleCreate} className="space-y-3">
            <input type="text" placeholder="Household name" value={name}
              onChange={e => setName(e.target.value)} required autoFocus
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]" />
            <div className="space-y-2">
              <p className="text-xs text-ash font-medium">Data sharing</p>
              <label className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(237,237,243,0.02)] cursor-pointer">
                <input type="radio" name="shareData" checked={!shareData} onChange={() => setShareData(false)} className="mt-0.5 accent-[#5266eb]" />
                <div>
                  <p className="text-sm text-ivory">Start fresh</p>
                  <p className="text-xs text-ash">Begin with an empty expense tracker for this household.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(237,237,243,0.02)] cursor-pointer">
                <input type="radio" name="shareData" checked={shareData} onChange={() => setShareData(true)} className="mt-0.5 accent-[#5266eb]" />
                <div>
                  <p className="text-sm text-ivory">Share my existing data</p>
                  <p className="text-xs text-ash">Copy all your expenses, income, budgets, goals, rules, and recurring transactions to this household.</p>
                </div>
              </label>
            </div>
            <div className="flex gap-2">
              <PillButton type="submit">Create</PillButton>
              <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-ash hover:text-ivory transition-colors">Cancel</button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Household Selector */}
      {households.length === 0 && !showCreate && (
        <GlassCard className="p-8 text-center" hover={false}>
          <p className="text-ash text-sm mb-3">No household yet.</p>
          <PillButton onClick={() => setShowCreate(true)}>Create Household</PillButton>
        </GlassCard>
      )}

      {households.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {households.map(h => (
              <button
                key={h.id}
                onClick={() => switchHousehold(h.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentHousehold?.household.id === h.id
                    ? 'bg-[#5266eb] text-white'
                    : 'bg-[#272735] text-ash hover:text-ivory'
                }`}
              >
                {h.name}
              </button>
            ))}
            <PillButton variant="outline" onClick={() => setShowCreate(true)}>+ New</PillButton>
          </div>

          {/* Active Household Details */}
          {loading ? (
            <LoadingCard />
          ) : details && (
            <>
              {/* Invite Link */}
              <GlassCard className="p-5" hover={false}>
                <h2 className="text-sm font-medium text-ivory mb-3">Invite Members</h2>
                {details.is_admin && (
                  <PillButton onClick={handleGenerateInvite} className="mb-3">
                    {inviteCode || details.household.invite_code ? 'Regenerate Invite Link' : 'Generate Invite Link'}
                  </PillButton>
                )}
                {joinLink && (
                  <div className="bg-[#272735] rounded-lg p-3 flex items-center gap-2">
                    <input type="text" readOnly value={joinLink}
                      className="flex-1 bg-transparent text-sm text-ivory outline-none" />
                    <button
                      onClick={() => { navigator.clipboard.writeText(joinLink); toast('Copied!', 'success') }}
                      className="text-xs text-[#9cb4e8] hover:text-ivory transition-colors shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </GlassCard>

              {/* Members */}
              <GlassCard className="p-5" hover={false}>
                <h2 className="text-sm font-medium text-ivory mb-3">Members ({details.members.length})</h2>
                <div className="space-y-2">
                  {details.members.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[rgba(237,237,243,0.02)]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5266eb]/20 flex items-center justify-center text-xs text-[#9cb4e8] font-medium">
                          {m.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-ivory">{m.user_name}</p>
                          <p className="text-xs text-ash">{m.user_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          m.role === 'owner' ? 'bg-amber-400/10 text-amber-400' :
                          m.role === 'admin' ? 'bg-[#5266eb]/10 text-[#9cb4e8]' :
                          'bg-ash/10 text-ash'
                        }`}>
                          {m.role}
                        </span>
                        {details.is_owner && m.role !== 'owner' && (
                          <>
                            <button onClick={() => setConfirmTransfer(m.user_id)}
                              className="text-xs text-ash hover:text-[#9cb4e8] transition-colors">Transfer</button>
                            <button onClick={() => setConfirmRemove({ memberId: m.id, name: m.user_name })}
                              className="text-xs text-ash hover:text-red-400 transition-colors">Remove</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Leave Household */}
              <div className="flex gap-3">
                <PillButton variant="outline" onClick={() => setConfirmLeave(true)}>
                  Leave Household
                </PillButton>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
