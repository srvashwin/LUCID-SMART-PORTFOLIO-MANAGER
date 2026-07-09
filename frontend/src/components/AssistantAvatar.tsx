export default function AssistantAvatar({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="halo" cx="50%" cy="45%" r="50%">
          <stop offset="0" stopColor="#5266eb" stopOpacity="0.12" />
          <stop offset="1" stopColor="#5266eb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3d2266" />
          <stop offset="1" stopColor="#1f0f3a" />
        </linearGradient>
        <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fce4d6" />
          <stop offset="1" stopColor="#f0c9b8" />
        </linearGradient>
      </defs>

      {/* Halo */}
      <circle cx="60" cy="50" r="52" fill="url(#halo)" />

      {/* Hair back */}
      <path d="M38 52 Q35 30 45 20 Q55 14 60 14 Q65 14 75 20 Q85 30 82 52 L80 72 Q78 78 75 80 Q70 82 66 78 Q64 74 64 70 L64 52 Q62 50 60 50 Q58 50 56 52 L56 70 Q56 74 54 78 Q50 82 45 80 Q42 78 40 72 Z" fill="url(#hairGrad)" />

      {/* Hair side strands */}
      <path d="M38 52 Q36 48 34 55 Q32 62 34 70 Q36 76 38 72" fill="url(#hairGrad)" opacity="0.85" />
      <path d="M82 52 Q84 48 86 55 Q88 62 86 70 Q84 76 82 72" fill="url(#hairGrad)" opacity="0.85" />

      {/* Face */}
      <ellipse cx="60" cy="50" rx="19" ry="22" fill="url(#skinGrad)" />

      {/* Eyebrows */}
      <path d="M48 41 Q52 38 56 39" stroke="#2d1b4e" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M64 39 Q68 38 72 41" stroke="#2d1b4e" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />

      {/* Eyes */}
      <ellipse cx="52" cy="44" rx="3.5" ry="2.5" fill="#1a1a2e" />
      <ellipse cx="68" cy="44" rx="3.5" ry="2.5" fill="#1a1a2e" />
      {/* Eye highlights */}
      <circle cx="53.5" cy="43" r="1.2" fill="white" opacity="0.8" />
      <circle cx="69.5" cy="43" r="1.2" fill="white" opacity="0.8" />
      {/* Lower lashes */}
      <path d="M49 46 Q52 48 55 46" stroke="#2d1b4e" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M65 46 Q68 48 71 46" stroke="#2d1b4e" strokeWidth="0.5" fill="none" opacity="0.3" />

      {/* Nose */}
      <path d="M58 47 Q60 51 60 53" stroke="#d4a89a" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />

      {/* Smile */}
      <path d="M55 55 Q60 60 65 55" stroke="#c4877a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Upper lip */}
      <path d="M56 55 Q58 54 60 55 Q62 54 64 55" stroke="#c4877a" strokeWidth="0.6" fill="#e8a090" opacity="0.6" />

      {/* Cheek blush */}
      <ellipse cx="47" cy="50" rx="3" ry="2" fill="#f0b0a0" opacity="0.25" />
      <ellipse cx="73" cy="50" rx="3" ry="2" fill="#f0b0a0" opacity="0.25" />

      {/* Neck */}
      <rect x="56" y="67" width="8" height="8" rx="3" fill="#f0c9b8" />
      {/* Neck shadow */}
      <rect x="56" y="72" width="8" height="3" rx="1.5" fill="#d4a89a" opacity="0.4" />

      {/* Shoulders / upper body */}
      <path d="M28 84 Q30 78 36 78 Q42 78 44 82 Q48 88 50 94 Q52 100 52 108 L52 118 L68 118 L68 108 Q68 100 70 94 Q72 88 76 82 Q78 78 84 78 Q90 78 92 84 L92 106 Q86 104 80 100 Q76 96 72 94 Q68 92 64 92 Q60 92 56 94 Q52 96 48 100 Q44 104 38 106 Q32 108 28 106 Z" fill="url(#shirtGrad)" />

      {/* Collar / V-neck */}
      <path d="M54 68 Q60 76 66 68" stroke="#5b21b6" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* Shirt fold lines */}
      <path d="M45 84 Q50 86 55 84" stroke="#5b21b6" strokeWidth="0.5" fill="none" opacity="0.2" />
      <path d="M65 84 Q70 86 75 84" stroke="#5b21b6" strokeWidth="0.5" fill="none" opacity="0.2" />

      {/* Collar detail */}
      <path d="M54 68 Q52 66 50 68" stroke="#6d28d9" strokeWidth="0.8" fill="none" opacity="0.4" />
      <path d="M66 68 Q68 66 70 68" stroke="#6d28d9" strokeWidth="0.8" fill="none" opacity="0.4" />

      {/* Lucid logo on shirt */}
      <rect x="56" y="86" width="2.5" height="7" rx="1" fill="#aebbff" opacity="0.6" />
      <rect x="59.5" y="82" width="2.5" height="11" rx="1" fill="#aebbff" opacity="0.8" />
      <rect x="63" y="77" width="2.5" height="16" rx="1" fill="#aebbff" />
      <circle cx="64.25" cy="75" r="1.2" fill="#dfe4ff" />

      {/* Left arm */}
      <path d="M32 86 Q26 92 24 100 Q22 106 24 108" stroke="#f0c9b8" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Left hand */}
      <ellipse cx="24" cy="109" rx="3.5" ry="2.5" fill="#f0c9b8" />

      {/* Right arm */}
      <path d="M88 86 Q94 92 96 100 Q98 106 96 108" stroke="#f0c9b8" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Right hand */}
      <ellipse cx="96" cy="109" rx="3.5" ry="2.5" fill="#f0c9b8" />
    </svg>
  )
}
