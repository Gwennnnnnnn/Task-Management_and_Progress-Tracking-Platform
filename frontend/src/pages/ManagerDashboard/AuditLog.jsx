import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import './AuditLog.css'

function formatTimestamp(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function formatActivity(action = '') {
  return action
    .split(',')
    .map((part) => {
      const trimmed = part.trim()
      return trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : trimmed
    })
    .join(', ')
}

export default function AuditLog() {
  const { user } = useAuth()
  const { auditLogs, users } = useTasks()
  const [search, setSearch] = useState('')
  const [actorFilter, setActorFilter] = useState('all')

  const allLogs = useMemo(
    () => user.role === 'administrator' ? auditLogs : [],
    [auditLogs, user.role]
  )

  const actors = useMemo(
    () => [...new Set(allLogs.map((entry) => entry.actor))].sort((a, b) => a.localeCompare(b)),
    [allLogs]
  )

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allLogs.filter((entry) => {
      if (actorFilter !== 'all' && entry.actor !== actorFilter) return false
      if (!query) return true
      return [entry.actor, entry.action, entry.item, entry.taskTitle]
        .some((value) => value?.toLowerCase().includes(query))
    })
  }, [allLogs, search, actorFilter])

  return (
    <div className="audit-log-page fade-in">
      <div className="audit-log-heading">
        <span className="audit-log-count">{filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}</span>
      </div>

      <section className="card audit-log-card" aria-label="Administrator audit log">
        <div className="audit-log-filters">
          <label className="audit-search">
            <span>Search activity</span>
            <input
              className="input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search task, action or person"
            />
          </label>
          <label className="audit-actor-filter">
            <span>Person</span>
            <select
              className="select"
              value={actorFilter}
              onChange={(event) => setActorFilter(event.target.value)}
            >
              <option value="all">Everyone</option>
              {actors.map((actor) => <option key={actor} value={actor}>{actor}</option>)}
            </select>
          </label>
        </div>

        {filteredLogs.length ? (
          <div className="audit-log-table-wrap">
            <table className="audit-log-table">
              <thead>
                <tr>
                  <th scope="col">Date and time</th>
                  <th scope="col">Person</th>
                  <th scope="col">Activity</th>
                  <th scope="col">Task / item</th>
                  <th scope="col">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((entry) => {
                  const assignee = users.find((candidate) => candidate.id === entry.assigneeId)
                  return (
                    <tr key={entry.id}>
                      <td data-label="Date and time">
                        <time dateTime={entry.at}>{formatTimestamp(entry.at)}</time>
                      </td>
                      <td data-label="Person">{entry.actor}</td>
                      <td data-label="Activity">{formatActivity(entry.action)}</td>
                      <td data-label="Task / item">{entry.item || entry.taskTitle || '—'}</td>
                      <td data-label="Assignee">
                        {entry.assigneeId ? assignee?.name || 'Former assignee' : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="audit-log-empty">
            <strong>{allLogs.length ? 'No matching activity' : 'No activity recorded yet'}</strong>
            <p>
              {allLogs.length
                ? 'Try changing your search or person filter.'
                : 'Task changes and access administration will appear here.'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
