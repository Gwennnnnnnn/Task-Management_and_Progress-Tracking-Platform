import { PriorityBadge, StatusBadge, SourceBadge } from '../Badge.jsx'
import NewBadge from '../AIDetectedBadge.jsx'
import ProgressBar from '../ProgressTracker/ProgressBar.jsx'
import Avatar from '../Avatar.jsx'
import { IconClock } from '../Icons.jsx'
import { dueLabel, isOverdue } from '../../services/taskService.js'
import './TaskCard.css'

export default function TaskCard({ task, assignee, onOpen, showAssignee = false }) {
  const overdue = isOverdue(task)
  const label = dueLabel(task.dueDate)
  const chipClass = overdue ? 'danger' : label.includes('today') || label.includes('tomorrow') ? 'warn' : ''

  return (
    <article
      className={`task-card pr-${task.priority} ${overdue ? 'overdue' : ''} fade-in`}
      onClick={() => onOpen(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' ? onOpen(task.id) : null)}
    >
      <div className="task-card-top">
        <div>
          <div className="task-card-title">{task.title}</div>
        </div>
        <PriorityBadge value={task.priority} />
      </div>

      <p className="task-card-desc">{task.description}</p>

      <div className="task-card-meta">
        {task.aiDetected && task.needsReview && <NewBadge size="xs" />}
        <StatusBadge value={task.status} />
        <SourceBadge value={task.source} />
      </div>

      <div>
        <div className="row between" style={{ marginBottom: 5 }}>
          <span className="text-xs muted">Progress</span>
          <span className="text-xs strong">{task.progress}%</span>
        </div>
        <ProgressBar value={task.progress} />
      </div>

      <div className="task-card-foot">
        <span className={`due-chip ${chipClass}`}>
          <IconClock size={14} /> {label}
        </span>
        {showAssignee && assignee && (
          <div className="row gap-8">
            <Avatar name={assignee.name} color={assignee.color} size={24} />
            <span className="text-xs strong">{assignee.name}</span>
          </div>
        )}
      </div>
    </article>
  )
}
