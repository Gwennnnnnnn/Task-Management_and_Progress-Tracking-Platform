// Visual progress tracker for a single task: current status stepper, progress
// bar, current holder, last update and an activity timeline (task history).

import { STATUS_ORDER } from '../../data/mockData.js'
import { StatusBadge } from '../Badge.jsx'
import ProgressBar from './ProgressBar.jsx'
import Avatar from '../Avatar.jsx'
import { formatDate } from '../../services/taskService.js'
import './ProgressTracker.css'

export default function ProgressTracker({ task, holder }) {
  const currentIndex = STATUS_ORDER.indexOf(task.status)

  return (
    <div className="progress-tracker">
      <div className="pt-row">
        <span className="muted text-sm">Current status</span>
        <StatusBadge value={task.status} />
      </div>

      <div className="pt-stepper">
        {STATUS_ORDER.map((s, i) => (
          <div
            key={s}
            className={`pt-step ${i <= currentIndex ? 'done' : ''} ${i === currentIndex ? 'active' : ''}`}
            title={s}
          >
            <span className="pt-dot" />
            <span className="pt-step-label">{s}</span>
          </div>
        ))}
      </div>

      <div className="pt-row" style={{ marginTop: 16 }}>
        <span className="muted text-sm">Progress</span>
        <span className="strong">{task.progress}%</span>
      </div>
      <ProgressBar value={task.progress} height={10} />

      <div className="pt-meta">
        <div>
          <span className="muted text-xs">Current holder</span>
          <div className="row gap-8" style={{ marginTop: 4 }}>
            {holder && <Avatar name={holder.name} color={holder.color} size={26} />}
            <span className="strong text-sm">{holder ? holder.name : 'Unassigned'}</span>
          </div>
        </div>
        <div>
          <span className="muted text-xs">Last progress update</span>
          <div className="strong text-sm" style={{ marginTop: 4 }}>
            {formatDate(task.updatedAt)}
          </div>
        </div>
      </div>

      <div className="pt-timeline">
        <span className="muted text-xs" style={{ fontWeight: 600 }}>Activity timeline</span>
        <ul>
          {[...(task.history || [])].reverse().map((h) => (
            <li key={h.id}>
              <span className="pt-time-dot" />
              <div>
                <div className="text-sm strong">{h.action}</div>
                <div className="text-xs muted">
                  {h.by} · {new Date(h.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
