// A droppable status column. Uses useDroppable so a card can be dropped on an
// empty column too (SortableContext handles reordering within a column).

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { STATUS_COLORS } from '../Badge.jsx'
import KanbanCard from './KanbanCard.jsx'

export default function KanbanColumn({ status, tasks, getUser, onOpen, currentUserId, canEditAllTasks }) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } })

  return (
    <div className={`kanban-col ${isOver ? 'over' : ''}`}>
      <div className="kanban-col-head">
        <span className="kanban-col-dot" style={{ background: STATUS_COLORS[status] }} />
        <span className="kanban-col-title">{status}</span>
        <span className="kanban-col-count">{tasks.length}</span>
      </div>

      <div className="kanban-col-body" ref={setNodeRef}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="kanban-col-empty">Drop tasks here</div>
          ) : (
            tasks.map((t) => (
              <KanbanCard
                key={t.id}
                task={t}
                assignee={getUser(t.assigneeId)}
                onOpen={onOpen}
                draggable={canEditAllTasks || t.assigneeId === currentUserId}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
