interface MetricCardProps {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  delay?: number
}

export default function MetricCard({ label, value, trend, trendUp, delay = 0 }: MetricCardProps) {
  return (
    <div
      className="glass rounded-xl p-5 card-hover animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <p className="text-sm text-ash font-medium tracking-wide uppercase mb-1">{label}</p>
      <p className="text-3xl font-semibold text-ivory" style={{ fontWeight: 600 }}>{value}</p>
      {trend && (
        <p className={`text-xs mt-1.5 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          {trendUp ? '\u2191' : '\u2193'} {trend}
        </p>
      )}
    </div>
  )
}
