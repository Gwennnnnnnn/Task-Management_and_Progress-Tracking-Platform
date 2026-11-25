// FlowSync logo — two interlocking "sync" arrows forming a circular flow with a
// central node, suggesting continuous task flow and synchronisation.
// Muted green strokes complement the pastel-blue brand surfaces.

export function LogoMark({ size = 40, rounded = true, onGradient = false, darkMode = false }) {
  // Use the same muted green for both arrows against the blue theme.
  const gid = `fs-grad-${onGradient ? 'w' : 'c'}`
  const stroke = darkMode ? '#b7e3a8' : onGradient || rounded ? '#527b67' : `url(#${gid})`
  const accent = stroke

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {!onGradient && (
        <defs>
          <linearGradient id={gid} x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#95BDD7" />
            <stop offset="1" stopColor="#78A4CB" />
          </linearGradient>
        </defs>
      )}
      {rounded && (
        <rect
          width="48"
          height="48"
          rx="12"
          fill={onGradient ? 'rgba(255,255,255,0.28)' : `url(#${gid})`}
        />
      )}

      {/* Circular "sync" flow: two arcs with arrowheads chasing each other. */}
      <path
        d="M34 18 A12 12 0 0 0 13 20"
        stroke={stroke}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <path d="M34 12 L35 18 L29 18.5" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      <path
        d="M14 30 A12 12 0 0 0 35 28"
        stroke={accent}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M14 36 L13 30 L19 29.5" stroke={accent} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Central node */}
      <circle cx="24" cy="24" r="3.4" fill={stroke} />
    </svg>
  )
}

export default function Logo({ size = 40, showText = true, onDark = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <LogoMark size={size} onGradient={onDark} />
      {showText && (
        <div style={{ lineHeight: 1.15 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: size * 0.4,
              color: onDark ? '#fff' : 'var(--text-strong)',
              letterSpacing: '-0.01em'
            }}
          >
            FlowSync
          </div>
          <div
            style={{
              fontSize: size * 0.26,
              color: onDark ? 'rgba(255,255,255,0.75)' : 'var(--muted)',
              fontWeight: 500
            }}
          >
            Intelligent Task Management
          </div>
        </div>
      )}
    </div>
  )
}
