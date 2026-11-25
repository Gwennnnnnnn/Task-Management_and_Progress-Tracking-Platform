// Reusable search + filter + sort toolbar for task lists.

import { STATUS_ORDER, PRIORITY } from '../data/mockData.js'
import { IconSearch } from './Icons.jsx'

const SPECIAL_FILTER_LABELS = {
  new: 'New tasks',
  overdue: 'Overdue tasks',
  upcoming: 'Upcoming deadlines (7 days)'
}

export default function TaskToolbar({ value, onChange, extra, hideStatus = false }) {
  function set(patch) {
    onChange({ ...value, ...patch })
  }

  return (
    <div className="toolbar">
      <div className="search-box">
        <span className="search-icon"><IconSearch size={16} /></span>
        <input
          type="text"
          placeholder="Search tasks or descriptions..."
          value={value.search}
          onChange={(e) => set({ search: e.target.value })}
        />
      </div>

      {extra}

      {!hideStatus && (
        <select value={value.status} onChange={(e) => set({ status: e.target.value })} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}

      <select value={value.priority} onChange={(e) => set({ priority: e.target.value })} aria-label="Filter by priority">
        <option value="all">All priorities</option>
        {Object.values(PRIORITY).map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <select value={value.sortBy} onChange={(e) => set({ sortBy: e.target.value })} aria-label="Sort by">
        <option value="dueDate">Sort: Due date</option>
        <option value="priority">Sort: Priority</option>
        <option value="progress">Sort: Progress</option>
      </select>
    </div>
  )
}

export function ActiveFilterSummary({
  filters = {},
  myTasksOnly = false,
  employeeLabel,
  additionalLabels = [],
  onClear
}) {
  const labels = [
    SPECIAL_FILTER_LABELS[filters.special],
    myTasksOnly ? 'My tasks' : null,
    employeeLabel ? `Employee: ${employeeLabel}` : null,
    filters.priority && filters.priority !== 'all' ? `Priority: ${filters.priority}` : null,
    filters.status && filters.status !== 'all' ? `Status: ${filters.status}` : null,
    filters.search?.trim() ? `Search: ${filters.search.trim()}` : null,
    ...additionalLabels
  ].filter(Boolean)

  if (!labels.length) return null

  return (
    <div className="active-filter-chip" role="status" aria-live="polite">
      <span>Showing: <strong>{labels.join(', ')}</strong></span>
      {onClear && (
        <button type="button" onClick={onClear} aria-label="Clear filters">
          ×
        </button>
      )}
    </div>
  )
}
