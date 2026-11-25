import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import { hasPermission, visibleTasks, taskStats, employeeStats } from '../../services/taskService.js'
import { STATUS } from '../../data/mockData.js'
import { getStaffInsights } from '../../services/aiService.js'
import StatCard from '../../components/StatCard.jsx'
import DonutChart from '../../components/DonutChart.jsx'
import ProgressBar from '../../components/ProgressTracker/ProgressBar.jsx'
import Avatar from '../../components/Avatar.jsx'
import TaskCard from '../../components/TaskCard/TaskCard.jsx'
import { ManagerAIInsights, StaffAIInsights } from '../../components/AIInsights/AIInsights.jsx'
import TaskModal from '../../components/TaskModal/TaskModal.jsx'
import { useTaskModal } from '../../hooks/useTaskModal.js'
import {
  IconTasks,
  IconClock,
  IconCheck,
  IconAlert,
  IconReview,
  IconChevronRight,
  IconCalendar
} from '../../components/Icons.jsx'

export default function ManagerOverview() {
  const { user } = useAuth()
  const { tasks, users } = useTasks()
  const { openTaskId, openTask, closeTask } = useTaskModal()
  const navigate = useNavigate()

  const me = users.find((u) => u.id === user.id) || user
  const canViewTasks = hasPermission(me, 'tasks')
  const canManageTeam = hasPermission(me, 'team')
  const teamUsers = useMemo(
    () => users.filter((u) => me.team?.includes(u.id)),
    [users, me]
  )
  const teamTasks = useMemo(() => visibleTasks(tasks, me, users), [tasks, me, users])
  const myTasks = useMemo(
    () => teamTasks.filter((task) => task.assigneeId === user.id),
    [teamTasks, user.id]
  )
  const myStats = useMemo(() => taskStats(myTasks), [myTasks])
  const teamStats = useMemo(() => taskStats(teamTasks), [teamTasks])

  const goToTasks = (qs = '') => navigate(`/manager/tasks?employee=${user.id}${qs}`)
  const goToTeamTasks = (employeeId) => navigate(`/manager/tasks?employee=${employeeId}`)

  const topTasks = useMemo(
    () => getStaffInsights(myTasks).map((recommendation) => recommendation.task).slice(0, 4),
    [myTasks]
  )

  const donut = [
    { label: 'Completed', value: teamStats.completed, color: '#a4d9ba' },
    { label: 'In progress', value: teamStats.inProgress, color: '#78a4cb' },
    { label: 'To do', value: teamStats.todo, color: '#b4e1eb' },
    { label: 'Overdue', value: teamStats.overdue, color: '#efa3a3' }
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
        <StatCard label="Total tasks" value={myStats.total} icon={IconTasks} tone="navy" onClick={() => goToTasks()} />
        <StatCard label="In progress" value={myStats.inProgress} icon={IconClock} tone="blue" onClick={() => goToTasks(`&status=${encodeURIComponent(STATUS.IN_PROGRESS)}`)} />
        <StatCard label="Completed" value={myStats.completed} icon={IconCheck} tone="green" onClick={() => goToTasks(`&status=${encodeURIComponent(STATUS.COMPLETED)}`)} />
        <StatCard label="Overdue" value={myStats.overdue} icon={IconAlert} tone="red" onClick={() => goToTasks('&filter=overdue')} />
        <StatCard label="Upcoming (7d)" value={myStats.upcoming} icon={IconCalendar} tone="amber" onClick={() => goToTasks('&filter=upcoming')} />
      </div>

      <div className="two-col" style={{ marginTop: 24 }}>
        <div className="dash-col">
          <div className="dash-group">
            <div className="section-title">
              <h3>My priority tasks</h3>
              <span className="sub">{topTasks.length} needing attention</span>
            </div>
            {topTasks.length === 0 ? (
              <div className="panel empty-state">
                <IconCheck size={36} />
                <div>You're all caught up. No open tasks need attention.</div>
              </div>
            ) : (
              <div className="task-grid">
                {topTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onOpen={openTask} />
                ))}
              </div>
            )}
          </div>

          {canManageTeam && (
            <div className="panel">
              <div className="panel-head">
                <h3>Team completion</h3>
                <span className="badge status-Completed">{teamStats.completionRate}% complete</span>
              </div>
              <DonutChart segments={donut} centerLabel={teamStats.total} />
            </div>
          )}

          {canManageTeam && (
            <div className="panel">
              <div className="panel-head"><h3>Employee workload</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {teamUsers.map((emp) => {
                  const es = employeeStats(teamTasks, emp)
                  return (
                    <button
                      key={emp.id}
                      className="workload-row"
                      onClick={() => goToTeamTasks(emp.id)}
                      title={`View ${emp.name}'s tasks`}
                    >
                      <Avatar name={emp.name} color={emp.color} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row between" style={{ marginBottom: 5 }}>
                          <span className="text-sm strong">{emp.name}</span>
                          <span className="text-xs muted">{es.active} active · {es.overdue} overdue</span>
                        </div>
                        <ProgressBar value={es.progress} showLabel />
                      </div>
                      <IconChevronRight size={16} className="muted" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="dash-col">
          <div className="panel">
            <div className="panel-head"><h3>My task breakdown</h3></div>
            <DonutChart
              segments={[
                { label: 'Completed', value: myStats.completed, color: '#a4d9ba' },
                { label: 'In progress', value: myStats.inProgress, color: '#78a4cb' },
                { label: 'To do', value: myStats.todo, color: '#b4e1eb' }
              ]}
              centerLabel={`${myStats.completionRate}%`}
            />
            <p className="text-xs muted" style={{ marginTop: 10, marginBottom: 0 }}>
              {myStats.completionRate}% of your tasks are completed.
            </p>
          </div>
          <StaffAIInsights tasks={myTasks} onOpen={openTask} limit={4} />
          {canManageTeam && <ManagerAIInsights tasks={teamTasks} teamUsers={teamUsers} onOpen={openTask} />}
        </div>
      </div>

      {openTaskId && <TaskModal taskId={openTaskId} onClose={closeTask} />}
    </div>
  )
}
