// Priority / status / source badges. Class names strip spaces so they match
// the CSS rules in global.css (e.g. "In Progress" -> status-InProgress).

// Soft pastel status/priority colours (used for the small dots).
const STATUS_COLORS = {
  'To Do': '#95a7bd',
  'In Progress': '#78a4cb',
  'Pending Internal Review': '#f6c58c',
  'Pending Client': '#c7b5e9',
  'Pending Clarification': '#f6c58c',
  Completed: '#a4d9ba'
}

const PRIORITY_COLORS = {
  High: '#efa3a3',
  Medium: '#f6c58c',
  Low: '#b7c0cd'
}

function cls(value) {
  return value.replace(/\s+/g, '')
}

export function PriorityBadge({ value }) {
  return (
    <span className={`badge priority-${value}`}>
      <span className="badge-dot" style={{ background: PRIORITY_COLORS[value] }} />
      {value}
    </span>
  )
}

export function StatusBadge({ value }) {
  return (
    <span className={`badge status-${cls(value)}`}>
      <span className="badge-dot" style={{ background: STATUS_COLORS[value] }} />
      {value}
    </span>
  )
}

export function SourceBadge({ value }) {
  return <span className="badge source">{value}</span>
}

export { STATUS_COLORS, PRIORITY_COLORS }
