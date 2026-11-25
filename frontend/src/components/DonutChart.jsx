// Lightweight SVG donut chart (no chart library). `segments` is an array of
// { label, value, color }. Renders proportional arcs.

export default function DonutChart({ segments = [], size = 150, thickness = 18, centerLabel }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="row gap-16" style={{ alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#eef2f7"
            strokeWidth={thickness}
          />
          {segments.map((seg, i) => {
            const frac = seg.value / total
            const dash = frac * circumference
            const circle = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += dash
            return circle
          })}
        </g>
        {centerLabel != null && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={size * 0.22}
            fontWeight="700"
            fill="#1f2d40"
          >
            {centerLabel}
          </text>
        )}
      </svg>
      <div className="donut-legend">
        {segments.map((seg, i) => (
          <div className="row gap-8" key={i} style={{ marginBottom: 6 }}>
            <span className="badge-dot" style={{ background: seg.color, width: 10, height: 10 }} />
            <span className="text-sm">{seg.label}</span>
            <span className="text-sm strong" style={{ marginLeft: 'auto' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
