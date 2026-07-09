export default function Logo({ size = 28, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lucid-bar-1" x1="0" y1="32" x2="0" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3b4fd9" />
            <stop offset="1" stopColor="#5266eb" />
          </linearGradient>
          <linearGradient id="lucid-bar-2" x1="0" y1="32" x2="0" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#4256dd" />
            <stop offset="1" stopColor="#7c8bf0" />
          </linearGradient>
          <linearGradient id="lucid-bar-3" x1="0" y1="32" x2="0" y2="1" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#4a5be0" />
            <stop offset="1" stopColor="#aebbff" />
          </linearGradient>
        </defs>
        <rect x="3" y="19" width="5" height="10" rx="2.2" fill="url(#lucid-bar-1)" opacity="0.55" />
        <rect x="10.5" y="13" width="5" height="16" rx="2.2" fill="url(#lucid-bar-2)" opacity="0.8" />
        <rect x="18" y="6" width="5" height="23" rx="2.2" fill="url(#lucid-bar-3)" />
        <circle cx="20.5" cy="4.4" r="2.1" fill="#dfe4ff" />
      </svg>
      {showText && (
        <span
          className="text-lg text-ivory"
          style={{ fontWeight: 700, letterSpacing: '-0.01em' }}
        >
          Lucid
        </span>
      )}
    </div>
  )
}
