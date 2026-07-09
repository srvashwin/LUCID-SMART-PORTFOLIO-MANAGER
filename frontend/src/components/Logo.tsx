export default function Logo({ size = 28, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5266eb" />
            <stop offset="1" stopColor="#3b4fd9" />
          </linearGradient>
        </defs>
        <path d="M16 2L30 10v12L16 30 2 22V10L16 2z" fill="url(#logo-grad)" opacity="0.15" />
        <path d="M16 6L26 12v8L16 26 6 20V12L16 6z" fill="url(#logo-grad)" opacity="0.3" />
        <path d="M16 10L22 13.5v7L16 24l-6-3.5v-7L16 10z" fill="url(#logo-grad)" />
        <path d="M16 10L22 13.5v7L16 24l-6-3.5v-7L16 10z" fill="white" fillOpacity="0.2" />
      </svg>
      {showText && (
        <span className="text-lg font-semibold tracking-[0.08em] text-ivory" style={{ fontWeight: 600 }}>
          LUCID
        </span>
      )}
    </div>
  )
}
