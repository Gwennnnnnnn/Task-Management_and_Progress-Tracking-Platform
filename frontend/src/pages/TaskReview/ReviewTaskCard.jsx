// A task card for the Task Management & Review page. Shows the original source
// message, a "New" badge for newly added tasks, missing/uncertain-info warnings,
// and actions to open/edit or dismiss (remove) an incorrect task.

import { useTasks } from '../../context/TaskContext.jsx'
import { PriorityBadge, StatusBadge } from '../../components/Badge.jsx'
import NewBadge from '../../components/AIDetectedBadge.jsx'
import ProgressBar from '../../components/ProgressTracker/ProgressBar.jsx'
import Avatar from '../../components/Avatar.jsx'
import {
  IconEdit,
  IconTrash,
  IconAlert,
  IconMail,
  IconChat
} from '../../components/Icons.jsx'
import { formatDate, dueLabel, isOverdue } from '../../services/taskService.js'

const FIELD_LABELS = { dueDate: 'deadline', assigneeId: 'assignee', title: 'title' }

export default function ReviewTaskCard({ task, onOpen, currentUser }) {
  const { getUser, dismissTask } = useTasks()
  const assignee = getUser(task.assigneeId)
  const missing = (task.missingFields || []).map((f) => FIELD_LABELS[f] || f)
  const needsCheck = missing.length > 0 || task.lowConfidence

  function handleDismiss() {
    const ok = window.confirm(
      `Dismiss "${task.title}"?\n\nThis removes the task from the register. This cannot be undone (except via Reset Demo Data).`
    )
    if (ok) dismissTask(task.id, currentUser?.name)
  }

  return (
    <div className="review-card fade-in">
      <div className="review-card-head">
        <span className="src-icon">
          {task.source === 'Teams' ? <IconChat size={16} /> : <IconMail size={16} />}
        </span>
        <div className="rch-title">
          <strong>{task.title}</strong>
        </div>
        {task.aiDetected && <NewBadge />}
      </div>

      <div className="review-body">
        <div className="row gap-8 wrap">
          <StatusBadge value={task.status} />
          <PriorityBadge value={task.priority} />
          <span className="badge source">{task.source}</span>
        </div>

        {needsCheck && (
          <div className="missing-warn">
            <IconAlert size={15} />
            {missing.length > 0
              ? `Please check the ${missing.join(' and ')} for this task.`
              : 'Some details may need checking — please review before you start.'}
          </div>
        )}

        <div>
          <div className="extracted-title row gap-8">
            {task.source === 'Teams' ? <IconChat size={14} /> : <IconMail size={14} />}
            Original message
          </div>
          <div className="msg-preview">{task.sourceMessage}</div>
        </div>

        <p className="text-sm review-desc">{task.description}</p>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="lbl">Assignee</div>
            <div className="val row gap-8" style={{ marginTop: 4 }}>
              {assignee && <Avatar name={assignee.name} color={assignee.color} size={22} />}
              <span className="text-sm">{assignee?.name || '—'}</span>
            </div>
          </div>
          <div className="detail-item">
            <div className="lbl">Deadline</div>
            <div className="val text-sm">
              {formatDate(task.dueDate)}{' '}
              <span className={isOverdue(task) ? 'due-overdue' : 'muted'}>
                ({dueLabel(task.dueDate)})
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="row between" style={{ marginBottom: 5 }}>
            <span className="text-xs muted">Progress</span>
            <span className="text-xs strong">{task.progress}%</span>
          </div>
          <ProgressBar value={task.progress} />
        </div>
      </div>

      <div className="review-foot btn-group">
        <button className="btn btn-primary btn-sm" onClick={() => onOpen(task.id)}>
          <IconEdit size={14} /> Review &amp; edit
        </button>
        <div className="spacer" />
        <button
          className="btn btn-danger btn-sm btn-icon"
          onClick={handleDismiss}
          title="Dismiss task"
          aria-label="Dismiss task"
        >
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  )
}
