import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import GlassCard from '../components/GlassCard'
import { useToast } from '../components/Toast'
import { formatAmount } from '../utils/format'
import { useCurrency } from '../hooks/useCurrency'
import PillBadge from '../components/PillBadge'
import { LoadingList } from '../components/LoadingSkeleton'
import type { ImportPreviewRow, ImportPreviewResponse } from '../types'

const categories = [
  'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities',
  'Entertainment', 'Health & Fitness', 'Education', 'Housing',
  'Travel', 'Groceries', 'Subscription', 'Personal Care', 'Other',
]

export default function ImportStatement() {
  const { currency } = useCurrency()
  const { toast } = useToast()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null)
  const [rows, setRows] = useState<ImportPreviewRow[]>([])

  const handleUpload = async (f: File) => {
    setFile(f)
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', f)
      const res = await api.post('/imports/upload', form)
      const data: ImportPreviewResponse = res.data
      setPreview(data)
      setRows(data.rows)
      setStep(2)
    } catch {
      toast('Failed to parse file. Make sure it is a valid CSV.', 'error')
    }
    setLoading(false)
  }

  const toggleRow = (idx: number) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, include: !r.include } : r))
  }

  const changeCategory = (idx: number, category: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, category_guess: category } : r))
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await api.post('/imports/confirm', { rows })
      toast(`${rows.filter(r => r.include).length} transactions imported!`, 'success')
      window.dispatchEvent(new CustomEvent('lucid-data-changed'))
      navigate('/expenses')
    } catch {
      toast('Failed to confirm import', 'error')
    }
    setLoading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) handleUpload(f)
    else toast('Please drop a CSV file', 'error')
  }

  const includeCount = rows.filter(r => r.include).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 animate-fade-in">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5266eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <div>
          <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Import Statement</h1>
          <p className="text-ash text-sm mt-1">Upload a bank statement CSV — preview, verify, then confirm</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && step === 1 && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingList rows={5} />
          </motion.div>
        )}

        {step === 1 && !loading && (
          <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <GlassCard className="p-10">
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[rgba(237,237,243,0.15)] rounded-2xl p-12 text-center cursor-pointer hover:border-[#5266eb] hover:bg-[rgba(82,102,235,0.04)] transition-all"
              >
                <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5266eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-ivory text-lg font-medium mb-1">Drop your CSV file here</p>
                <p className="text-ash text-sm mb-4">or click to browse — max 5MB, up to 5,000 rows</p>
                <p className="text-white/40 text-xs">Compatible with SBI, HDFC, ICICI, Axis, Kotak and other bank exports</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </div>
            </GlassCard>
          </motion.div>
        )}

        {step === 2 && preview && (
          <motion.div key="preview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
            <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <PillBadge variant="accent">{preview.bank_name || 'Auto-detected'}</PillBadge>
                  <span className="text-ash text-sm">{preview.total_count} rows parsed</span>
                  {preview.duplicate_count > 0 && (
                    <PillBadge variant="warning">{preview.duplicate_count} duplicates</PillBadge>
                  )}
                </div>
                <div className="text-ivory text-sm">
                  {includeCount} will be imported
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(237,237,243,0.08)]">
                      <th className="text-left text-ash font-medium pb-2 w-8"></th>
                      <th className="text-left text-ash font-medium pb-2 whitespace-nowrap">Date</th>
                      <th className="text-left text-ash font-medium pb-2">Description</th>
                      <th className="text-right text-ash font-medium pb-2 whitespace-nowrap">Amount</th>
                      <th className="text-left text-ash font-medium pb-2 whitespace-nowrap hidden sm:table-cell">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-[rgba(237,237,243,0.04)] transition-all ${
                          !row.include ? 'opacity-40' : ''
                        }`}
                      >
                        <td className="py-2">
                          <input
                            type="checkbox"
                            checked={row.include}
                            onChange={() => toggleRow(i)}
                            className="accent-[#5266eb] w-4 h-4"
                          />
                        </td>
                        <td className="py-2 text-ivory whitespace-nowrap">{row.date}</td>
                        <td className="py-2 text-ivory max-w-[200px] truncate">
                          {row.description}
                          {row.is_duplicate && (
                            <PillBadge variant="warning" className="ml-2">Duplicate</PillBadge>
                          )}
                        </td>
                        <td className="py-2 text-right text-ivory whitespace-nowrap">
                          {row.direction === 'credit' ? (
                            <span className="text-green-400">+{formatAmount(row.amount, currency)}</span>
                          ) : (
                            <span className="text-red-400">-{formatAmount(row.amount, currency)}</span>
                          )}
                        </td>
                        <td className="py-2 hidden sm:table-cell">
                          <select
                            value={row.category_guess}
                            onChange={e => changeCategory(i, e.target.value)}
                            className="bg-[rgba(237,237,243,0.06)] border border-[rgba(237,237,243,0.1)] rounded-lg px-2 py-1 text-xs text-ivory focus:outline-none focus:border-[#5266eb] max-w-[140px]"
                          >
                            {categories.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.total_count > rows.length && (
                <p className="text-ash text-xs mt-3">Showing first {rows.length} of {preview.total_count} rows</p>
              )}
            </GlassCard>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-ash hover:text-ivory hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || includeCount === 0}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#5266eb] text-white hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? 'Importing...' : `Import ${includeCount} transactions`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
