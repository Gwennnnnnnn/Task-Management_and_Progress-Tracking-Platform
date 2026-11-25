import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import { visibleTasks, employeeStats } from '../../services/taskService.js'
import Avatar from '../../components/Avatar.jsx'
import ProgressBar from '../../components/ProgressTracker/ProgressBar.jsx'
import { IconChevronRight } from '../../components/Icons.jsx'
import './ManagerTeam.css'

export default function ManagerTeam() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tasks, users } = useTasks()

  const me = users.find((u) => u.id === user.id)
  const teamUsers = useMemo(
    () => users.filter((u) => me?.team?.includes(u.id)),
    [users, me]
  )
  const teamTasks = useMemo(() => visibleTasks(tasks, user, users), [tasks, user, users])

  return (
    <div className="fade-in">
      <div className="team-grid">
        {teamUsers.map((emp) => {
          const es = employeeStats(teamTasks, emp)
          return (
            <button
              key={emp.id}
              className="team-card"
              onClick={() => navigate(`/manager/tasks?employee=${emp.id}`)}
            >
              <div className="team-card-head">
                <Avatar name={emp.name} color={emp.color} size={46} />
                <div className="tc-info">
                  <div className="tc-name">{emp.name}</div>
                  <div className="tc-title">{emp.title}</div>
                </div>
                <IconChevronRight size={18} className="muted" />
              </div>

              <div className="team-card-stats">
                <div><span className="n">{es.assigned}</span><span className="l">Assigned</span></div>
                <div><span className="n">{es.active}</span><span className="l">Active</span></div>
                <div><span className="n team-stat-completed">{es.completed}</span><span className="l">Done</span></div>
                <div><span className={`n ${es.overdue ? 'team-stat-overdue' : ''}`}>{es.overdue}</span><span className="l">Overdue</span></div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="row between" style={{ marginBottom: 5 }}>
                  <span className="text-xs muted">Avg. progress</span>
                  <span className="text-xs strong">{es.progress}%</span>
                </div>
                <ProgressBar value={es.progress} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
