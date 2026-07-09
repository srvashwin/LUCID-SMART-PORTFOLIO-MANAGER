export function LoadingCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-[rgba(30,30,42,0.6)] border border-[rgba(237,237,243,0.06)] p-5 ${className}`}>
      <div className="animate-pulse space-y-3">
        <div className="h-3 bg-[rgba(237,237,243,0.08)] rounded w-1/3" />
        <div className="h-6 bg-[rgba(237,237,243,0.08)] rounded w-2/3" />
        <div className="h-3 bg-[rgba(237,237,243,0.08)] rounded w-1/2" />
      </div>
    </div>
  )
}

export function LoadingList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="animate-pulse rounded-xl bg-[rgba(30,30,42,0.6)] border border-[rgba(237,237,243,0.06)] p-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-[rgba(237,237,243,0.08)] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[rgba(237,237,243,0.08)] rounded w-1/3" />
            <div className="h-3 bg-[rgba(237,237,243,0.08)] rounded w-1/2" />
          </div>
          <div className="h-4 bg-[rgba(237,237,243,0.08)] rounded w-16" />
        </div>
      ))}
    </div>
  )
}

export function LoadingGrid({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: cards }, (_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  )
}
