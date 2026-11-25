// A single draggable task card on the Kanban board. Clicking (not dragging)
// opens the task detail drawer. Dragging is wired via @dnd-kit useSortable.

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PriorityBadge, SourceBadge } from '../Badge.jsx'
import NewBadge from '../AIDetectedBadge.jsx'
import ProgressBar from '../ProgressTracker/ProgressBar.jsx'
import Avatar from '../Avatar.jsx'
import { IconClock } from '../Icons.jsx'
import { dueLabel, isOverdue } from '../../services/taskService.js'

// Short preview for long notes; full text is shown in task details (and via the
// native title tooltip here).
function notePreview(note, max = 70) {
  const clean = note.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

// `draggable` controls whether the card can be moved between columns. A
// non-draggable card remains clickable so staff can inspect teammates' work.
export default function KanbanCard({ task, assignee, onOpen, overlay = false, draggable = true }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, data: { task }, disabled: !draggable })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  }

  const overdue = isOverdue(task)
  const label = dueLabel(task.dueDate)
  const dueClass = overdue ? 'danger' : label.includes('today') || label.includes('tomorrow') ? 'warn' : ''
  const isNew = task.aiDetected && task.needsReview

  // Distinguish a click (open drawer) from a drag. dnd-kit suppresses click
  // after a drag, but we also guard with a tiny movement check via onClick.
  function handleClick() {
    if (!isDragging) onOpen?.(task.id)
  }

  return (
    <article
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      className={`kanban-card ${isDragging ? 'dragging' : ''} ${overlay ? 'overlay' : ''} ${draggable ? '' : 'notes-only'}`}
      onClick={handleClick}
      {...(overlay || !draggable ? {} : attributes)}
      {...(overlay || !draggable ? {} : listeners)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen?.(task.id)
      }}
      aria-label={
        draggable
          ? `${task.title}. Press Enter to open details.`
          : `${task.title}. Notes only — assigned to ${assignee?.name || 'another team member'}. Press Enter to open details.`
      }
    >
      <div className="kanban-card-meta">
        {isNew && <NewBadge size="xs" />}
        <PriorityBadge value={task.priority} />
        {task.source && <SourceBadge value={task.source} />}
      </div>

      <div className="kanban-card-title">{task.title}</div>

      {task.progressNotes && (
        <div className="kanban-card-note" title={task.progressNotes}>
          {notePreview(task.progressNotes)}
        </div>
      )}

      <div className="kanban-card-progress">
        <div className="row">
          <span className="text-xs muted">Progress</span>
          <span className="text-xs strong">{task.progress}%</span>
        </div>
        <ProgressBar value={task.progress} />
      </div>

      {!draggable && (
        <div className="kanban-card-viewonly" title="You can add notes to this task.">
          Notes only
        </div>
      )}

      <div className="kanban-card-foot">
        <span className={`kanban-due ${dueClass}`}>
          <IconClock size={13} /> {label}
        </span>
        {assignee && <Avatar name={assignee.name} color={assignee.color} size={24} />}
      </div>
    </article>
  )
}
