// Small progress bar whose fill colour reflects completion level.

export default function ProgressBar({ value = 0, height = 8, showLabel = false }) {
  const pct = Math.max(0, Math.min(100, value))
  // Progress fills use the pastel blue palette (soft/medium blue), green at 100%.
  const color = pct >= 100 ? '#a4d9ba' : pct >= 50 ? '#78a4cb' : pct > 0 ? '#95bdd7' : '#d8dee7'

  return (
    <div className="row gap-8" style={{ width: '100%' }}>
      <div className="progress-track" style={{ height }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {showLabel && (
        <span className="text-xs strong" style={{ minWidth: 34, textAlign: 'right' }}>
          {pct}%
        </span>
      )}
    </div>
  )
}
