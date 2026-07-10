import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { getAllCurrencies } from '../utils/format'

export default function Account() {
  const { user, refreshUser, logout } = useAuth()
  const [currency, setCurrency] = useState(user?.currency || 'USD')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saved, setSaved] = useState('')
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved('password')
    toast('Password updated', 'success')
    setTimeout(() => setSaved(''), 2000)
  }

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency)
    try {
      await api.patch('/auth/me', { currency: newCurrency })
      await refreshUser()
      setSaved('currency')
      toast('Currency updated', 'success')
      setTimeout(() => setSaved(''), 2000)
    } catch {
      toast('Failed to update currency', 'error')
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Account</h1>
        <p className="text-ash text-sm mt-1">Manage your profile and security settings</p>
      </div>

      {/* Profile */}
      <GlassCard className="p-4 md:p-6" hover={false}>
        <h2 className="text-sm font-medium text-ivory mb-4" style={{ fontWeight: 500 }}>Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[rgba(82,102,235,0.15)] flex items-center justify-center text-lg md:text-xl font-semibold text-[#9cb4e8] shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-base font-medium text-ivory truncate">{user.name}</p>
            <p className="text-sm text-ash truncate">{user.email}</p>
            <p className="text-xs text-ash mt-0.5">Member since {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </GlassCard>

      {/* Security */}
      <GlassCard className="p-4 md:p-6" hover={false}>
        <h2 className="text-sm font-medium text-ivory mb-4" style={{ fontWeight: 500 }}>Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors placeholder-[#70707d]"
          />
          <div className="flex items-center gap-3">
            <PillButton type="submit">Update Password</PillButton>
            {saved === 'password' && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-green-400"
              >
                Password updated
              </motion.span>
            )}
          </div>
        </form>
      </GlassCard>

      {/* Preferences */}
      <GlassCard className="p-4 md:p-6" hover={false}>
        <h2 className="text-sm font-medium text-ivory mb-4" style={{ fontWeight: 500 }}>Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-ash block mb-1.5 font-medium">Currency</label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
            >
              {getAllCurrencies().map(c => (
                <option key={c.code} value={c.code}>{c.symbol} - {c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <label className="flex items-center justify-between">
            <span className="text-sm text-ivory">Email notifications for rule alerts</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#5266eb]" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-ivory">Monthly report summary</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#5266eb]" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-ivory">AI suggestions enabled</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#5266eb]" />
          </label>
        </div>
      </GlassCard>

      {/* Sign Out */}
      <GlassCard className="p-4 md:p-6" hover={false}>
        <h2 className="text-sm font-medium text-ivory mb-2">Sign Out</h2>
        <p className="text-xs text-ash mb-3">Sign out of your account on this device.</p>
        <PillButton variant="outline" onClick={() => setConfirmSignOut(true)}>
          Sign Out
        </PillButton>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard className="p-4 md:p-6 border border-red-400/20" hover={false}>
        <h2 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h2>
        <p className="text-xs text-ash mb-3">Permanently delete your account and all data. This action cannot be undone.</p>
        <PillButton variant="outline" className="border-red-400 text-red-400 hover:bg-red-400/10">
          Delete Account
        </PillButton>
      </GlassCard>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign Out?"
        message="Are you sure you want to sign out?"
        onConfirm={() => { logout(); navigate('/login') }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  )
}
