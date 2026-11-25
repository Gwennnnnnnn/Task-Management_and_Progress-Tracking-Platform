import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import { visibleTasks } from '../../services/taskService.js'
import Calendar from '../../components/Calendar/Calendar.jsx'
import TaskModal from '../../components/TaskModal/TaskModal.jsx'
import { useTaskModal } from '../../hooks/useTaskModal.js'

export default function ManagerCalendar() {
  const { user } = useAuth()
  const { tasks, users } = useTasks()
  const { openTaskId, openTask, closeTask } = useTaskModal()

  const me = users.find((u) => u.id === user.id)
  const teamUsers = useMemo(
    () => users.filter((u) => u.id === user.id || me?.team?.includes(u.id)),
    [users, me, user.id]
  )

  const [employee, setEmployee] = useState('all')

  const teamTasks = useMemo(() => visibleTasks(tasks, user, users), [tasks, user, users])
  const filtered = useMemo(() => {
    let list = teamTasks
    if (employee !== 'all') list = list.filter((t) => t.assigneeId === employee)
    return list
  }, [teamTasks, employee])

  return (
    <div className="fade-in">
      <div className="toolbar">
        <select value={employee} onChange={(e) => setEmployee(e.target.value)} aria-label="Filter by employee">
          <option value="all">All employees</option>
          {teamUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.name}{u.id === user.id ? ' (me)' : ''}</option>
          ))}
        </select>
      </div>

      <Calendar tasks={filtered} onOpen={openTask} />
      {openTaskId && <TaskModal taskId={openTaskId} onClose={closeTask} />}
    </div>
  )
}
