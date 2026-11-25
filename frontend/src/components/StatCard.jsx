// Summary stat card for dashboard overviews. Optionally clickable (e.g. to
// filter the task list by a status).

export default function StatCard({ label, value, icon: Icon, tone = 'blue', hint, onClick, active }) {
  // Light pastel icon tiles with readable darker "ink" foregrounds.
  const tones = {
    blue: { bg: '#e7f0f8', fg: '#3f6690' },
    cyan: { bg: '#e4f1f5', fg: '#2f5a86' },
    green: { bg: '#e4f4ec', fg: '#3f8560' },
    amber: { bg: '#fdf6e0', fg: '#a76b2e' },
    red: { bg: '#fbe9e9', fg: '#b4595a' },
    navy: { bg: '#e7f0f8', fg: '#2f5a86' },
    purple: { bg: '#f1ecfa', fg: '#6b549e' }
  }
  const t = tones[tone] || tones.blue
  const clickable = typeof onClick === 'function'

  return (
    <div
      className={`stat-card fade-in ${clickable ? 'clickable' : ''} ${active ? 'active' : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => (e.key === 'Enter' ? onClick() : null) : undefined}
      title={clickable ? `Show ${label.toLowerCase()}` : undefined}
    >
      <div className="stat-icon" style={{ background: t.bg, color: t.fg }}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  )
}
