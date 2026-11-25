import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import { hasPermission, visibleTasks, taskStats } from '../../services/taskService.js'
import { STATUS } from '../../data/mockData.js'
import StatCard from '../../components/StatCard.jsx'
import TaskCard from '../../components/TaskCard/TaskCard.jsx'
import TaskModal from '../../components/TaskModal/TaskModal.jsx'
import DonutChart from '../../components/DonutChart.jsx'
import { StaffAIInsights } from '../../components/AIInsights/AIInsights.jsx'
import { useTaskModal } from '../../hooks/useTaskModal.js'
import {
  IconTasks,
  IconClock,
  IconCheck,
  IconAlert,
  IconCalendar
} from '../../components/Icons.jsx'
import { getStaffInsights } from '../../services/aiService.js'

export default function StaffOverview() {
  const { user } = useAuth()
  const { tasks, users } = useTasks()
  const { openTaskId, openTask, closeTask } = useTaskModal()
  const navigate = useNavigate()
  const currentUser = users.find((candidate) => candidate.id === user.id) || user
  const canViewTasks = hasPermission(currentUser, 'tasks')

  // Clicking a summary card jumps to the task list pre-filtered.
  const goToTasks = (params = '') => navigate(`/staff/tasks${params}`)

  const myTasks = useMemo(() => visibleTasks(tasks, currentUser, users), [tasks, currentUser, users])
  const stats = useMemo(() => taskStats(myTasks), [myTasks])

  // Tasks most in need of attention first.
  const topTasks = useMemo(
    () => getStaffInsights(myTasks).map((r) => r.task).slice(0, 4),
    [myTasks]
  )

  // Breakdown by the three Kanban statuses (non-overlapping, sums to total).
  const donut = [
    { label: 'Completed', value: stats.completed, color: '#a4d9ba' },
    { label: 'In progress', value: stats.inProgress, color: '#78a4cb' },
    { label: 'To do', value: stats.todo, color: '#b4e1eb' }
  ]

  if (!canViewTasks) {
    return (
      <div className="panel empty-state">
        <div>Your administrator has disabled task access for your account.</div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="stat-grid">
        <StatCard label="Total tasks" value={stats.total} icon={IconTasks} tone="navy" onClick={() => goToTasks()} />
        <StatCard label="In progress" value={stats.inProgress} icon={IconClock} tone="blue" onClick={() => goToTasks(`?status=${encodeURIComponent(STATUS.IN_PROGRESS)}`)} />
        <StatCard label="Completed" value={stats.completed} icon={IconCheck} tone="green" onClick={() => goToTasks(`?status=${encodeURIComponent(STATUS.COMPLETED)}`)} />
        <StatCard label="Overdue" value={stats.overdue} icon={IconAlert} tone="red" onClick={() => goToTasks('?filter=overdue')} />
        <StatCard label="Upcoming (7d)" value={stats.upcoming} icon={IconCalendar} tone="amber" onClick={() => goToTasks('?filter=upcoming')} />
      </div>

      <div className="two-col" style={{ marginTop: 24 }}>
        <div className="dash-col">
          <div className="dash-group">
            <div className="section-title">
              <h3>Priority tasks</h3>
              <span className="sub">{topTasks.length} needing attention</span>
            </div>
            {topTasks.length === 0 ? (
              <div className="panel empty-state">
                <IconCheck size={36} />
                <div>You're all caught up. No open tasks need attention.</div>
              </div>
            ) : (
              <div className="task-grid">
                {topTasks.map((t) => (
                  <TaskCard key={t.id} task={t} onOpen={openTask} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dash-col">
          <div className="panel">
            <div className="panel-head"><h3>My task breakdown</h3></div>
            <DonutChart segments={donut} centerLabel={`${stats.completionRate}%`} />
            <p className="text-xs muted" style={{ marginTop: 10, marginBottom: 0 }}>
              {stats.completionRate}% of your tasks are completed.
            </p>
          </div>
          <StaffAIInsights tasks={myTasks} onOpen={openTask} limit={3} />
        </div>
      </div>

      {openTaskId && <TaskModal taskId={openTaskId} onClose={closeTask} />}
    </div>
  )
}
