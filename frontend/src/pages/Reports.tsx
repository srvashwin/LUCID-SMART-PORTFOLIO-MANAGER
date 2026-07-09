import { useState } from 'react'
import GlassCard from '../components/GlassCard'
import PillButton from '../components/PillButton'

function DownloadCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <GlassCard className="p-6 flex flex-col items-center text-center" hover={true}>
      <div className="w-14 h-14 rounded-full bg-[rgba(82,102,235,0.1)] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-ivory mb-1">{title}</h3>
      <p className="text-xs text-ash mb-4">{description}</p>
      <PillButton onClick={onClick}>Download</PillButton>
    </GlassCard>
  )
}

export default function Reports() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const downloadExcel = () => {
    const link = document.createElement('a')
    link.href = `/api/reports/excel?month=${month}&year=${year}`
    link.setAttribute('download', `expenses_${year}_${String(month).padStart(2, '0')}.xlsx`)
    link.click()
  }

  const downloadTrendChart = () => {
    const link = document.createElement('a')
    link.href = '/api/reports/charts/trend'
    link.setAttribute('download', 'spending_trend.png')
    link.click()
  }

  const downloadCategoryChart = () => {
    const link = document.createElement('a')
    link.href = `/api/reports/charts/category?month=${month}&year=${year}`
    link.setAttribute('download', `category_breakdown_${year}_${String(month).padStart(2, '0')}.png`)
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Reports</h1>
        <p className="text-ash text-sm mt-1">Download your financial data and visualizations</p>
      </div>

      {/* Period selector */}
      <GlassCard className="p-5 flex gap-3 items-center" hover={false}>
        <div>
          <label className="text-xs text-ash block mb-1.5 font-medium">Month</label>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="px-4 py-2 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-ash block mb-1.5 font-medium">Year</label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-4 py-2 bg-[#272735] text-ivory rounded-lg text-sm border border-[rgba(237,237,243,0.08)] outline-none focus:border-[#5266eb] transition-colors"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </GlassCard>

      {/* Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DownloadCard
          icon={<svg className="w-6 h-6 text-[#5266eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
          title="Excel Report"
          description="Full expense breakdown, monthly summary, and category analysis in .xlsx format"
          onClick={downloadExcel}
        />
        <DownloadCard
          icon={<svg className="w-6 h-6 text-[#5266eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
          title="Trend Chart"
          description="12-month spending trend line chart as a high-resolution PNG image"
          onClick={downloadTrendChart}
        />
        <DownloadCard
          icon={<svg className="w-6 h-6 text-[#5266eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z" /></svg>}
          title="Category Chart"
          description="Monthly spending distribution pie chart as a high-resolution PNG image"
          onClick={downloadCategoryChart}
        />
      </div>
    </div>
  )
}
