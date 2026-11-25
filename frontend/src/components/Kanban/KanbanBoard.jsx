// Drag-and-drop Kanban board. Groups the provided tasks into status columns and
// updates a task's actual status (via TaskContext.updateTask) when dropped into
// a different column. Enforces audit review rules for completion.

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import { useToast } from '../Toast/ToastContext.jsx'
import { STATUS, STATUS_ORDER } from '../../data/mockData.js'
import KanbanColumn from './KanbanColumn.jsx'
import KanbanCard from './KanbanCard.jsx'
import './Kanban.css'

export default function KanbanBoard({ tasks, onOpen }) {
  const { user } = useAuth()
  const { updateTask, getUser } = useTasks()
  const { toast } = useToast()
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    // A small activation distance lets a plain click still open the drawer.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  )

  // Group tasks into columns by status.
  const columns = useMemo(() => {
    const map = {}
    STATUS_ORDER.forEach((s) => (map[s] = []))
    tasks.forEach((t) => {
      if (map[t.status]) map[t.status].push(t)
      else map[STATUS.TODO].push(t) // safety for any unknown status
    })
    return map
  }, [tasks])

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  function statusOfDropTarget(over) {
    if (!over) return null
    // Dropped directly on a column droppable.
    if (STATUS_ORDER.includes(over.id)) return over.id
    // Dropped on another card — use that card's status.
    const overTask = tasks.find((t) => t.id === over.id)
    return overTask ? overTask.status : null
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const task = tasks.find((t) => t.id === active.id)
    if (!task) return

    // Staff may only move their own tasks. Managers can manage every task on
    // the team board. This guard also backs up the per-card drag setting.
    if (user.role !== 'manager' && task.assigneeId !== user.id) {
      toast('You can only move your own tasks. Teammates’ tasks are read only.', {
        tone: 'warning',
        duration: 3200
      })
      return
    }

    const destStatus = statusOfDropTarget(over)
    if (!destStatus || destStatus === task.status) return // no cross-column change

    // Moving a card sets the status; progress is derived from the status by
    // TaskContext (To Do -> 0%, In Progress -> 50%, Completed -> 100%).
    updateTask(task.id, { status: destStatus }, user.name)
    toast(`Task moved to ${destStatus}.`, { tone: 'success' })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-wrap">
        <div className="kanban-board">
          {STATUS_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columns[status]}
              getUser={getUser}
              onOpen={onOpen}
              currentUserId={user.id}
              canEditAllTasks={user.role === 'manager'}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180 }}>
        {activeTask ? (
          <KanbanCard task={activeTask} assignee={getUser(activeTask.assigneeId)} overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
