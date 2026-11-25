import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import { visibleTasks } from '../../services/taskService.js'
import Calendar from '../../components/Calendar/Calendar.jsx'
import TaskModal from '../../components/TaskModal/TaskModal.jsx'
import { useTaskModal } from '../../hooks/useTaskModal.js'

export default function StaffCalendar() {
  const { user } = useAuth()
  const { tasks, users } = useTasks()
  const { openTaskId, openTask, closeTask } = useTaskModal()

  const myTasks = useMemo(() => visibleTasks(tasks, user, users), [tasks, user, users])

  return (
    <div className="fade-in">
      <Calendar tasks={myTasks} onOpen={openTask} />
      {openTaskId && <TaskModal taskId={openTaskId} onClose={closeTask} />}
    </div>
  )
}
