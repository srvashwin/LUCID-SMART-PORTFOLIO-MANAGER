interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
  sublabel?: string
}

export default function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 4,
  className = '',
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference
  const center = size / 2

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(237,237,243,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#5266eb"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      {label && <span className="text-sm font-medium text-ivory">{label}</span>}
      {sublabel && <span className="text-xs text-ash">{sublabel}</span>}
    </div>
  )
}
