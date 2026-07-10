interface PaginationProps {
  page: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  onGoTo: (page: number) => void
}

export default function Pagination({ page, totalPages, hasPrev, hasNext, onPrev, onNext, onGoTo }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: number[] = []
  const start = Math.max(0, page - 2)
  const end = Math.min(totalPages - 1, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className="px-3 py-1.5 rounded-lg text-sm text-ash hover:text-ivory hover:bg-[rgba(237,237,243,0.05)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        Prev
      </button>
      {start > 0 && (
        <>
          <button onClick={() => onGoTo(0)} className="w-8 h-8 rounded-lg text-sm text-ash hover:text-ivory hover:bg-[rgba(237,237,243,0.05)] transition-all">1</button>
          {start > 1 && <span className="text-ash text-sm px-1">...</span>}
        </>
      )}
      {pages.map(i => (
        <button
          key={i}
          onClick={() => onGoTo(i)}
          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
            i === page
              ? 'bg-[#5266eb] text-white'
              : 'text-ash hover:text-ivory hover:bg-[rgba(237,237,243,0.05)]'
          }`}
        >
          {i + 1}
        </button>
      ))}
      {end < totalPages - 1 && (
        <>
          {end < totalPages - 2 && <span className="text-ash text-sm px-1">...</span>}
          <button onClick={() => onGoTo(totalPages - 1)} className="w-8 h-8 rounded-lg text-sm text-ash hover:text-ivory hover:bg-[rgba(237,237,243,0.05)] transition-all">{totalPages}</button>
        </>
      )}
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="px-3 py-1.5 rounded-lg text-sm text-ash hover:text-ivory hover:bg-[rgba(237,237,243,0.05)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        Next
      </button>
    </div>
  )
}
