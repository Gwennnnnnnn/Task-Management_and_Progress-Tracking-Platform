import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import Avatar from '../Avatar.jsx'
import { LogoMark } from '../Logo.jsx'
import {
  IconDashboard,
  IconCalendar,
  IconTeam,
  IconHistory,
  IconLogout,
  IconCheck,
  IconReset
} from '../Icons.jsx'
import { hasPermission, visibleTasks } from '../../services/taskService.js'
import './Sidebar.css'

export default function Sidebar({ open, onClose, collapsed, sidebarWidth, darkMode, onResizeStart, onResizeBy }) {
  const { user, logout } = useAuth()
  const { tasks, users, resetDemoData } = useTasks()

  function handleReset() {
    if (window.confirm('Reset all demo data back to the original sample dataset? Your changes will be cleared.')) {
      resetDemoData()
    }
  }

  if (!user) return null

  const currentUser = users.find((candidate) => candidate.id === user.id) || user
  const isManager = currentUser.role === 'manager'
  const isAdministrator = currentUser.role === 'administrator'
  const dashboardPath = isAdministrator ? '/administrator' : isManager ? '/manager' : '/staff'

  // Badge on the Projects link: newly added tasks that still need attention.
  const myTasks = visibleTasks(tasks, currentUser, users)
  const newCount = myTasks.filter((t) => t.aiDetected && t.needsReview).length

  const links = [
    { to: dashboardPath, label: 'Dashboard', icon: IconDashboard, end: true },
    ...(!isAdministrator && hasPermission(currentUser, 'tasks')
      ? [{ to: `${dashboardPath}/tasks`, label: 'Projects', icon: IconCheck, count: newCount }]
      : []),
    ...(!isAdministrator && hasPermission(currentUser, 'calendar')
      ? [{ to: `${dashboardPath}/calendar`, label: 'Calendar', icon: IconCalendar }]
      : []),
    ...(isAdministrator
      ? [{ to: '/administrator/audit-log', label: 'Audit log', icon: IconHistory }]
      : isManager
      ? [
          ...(hasPermission(currentUser, 'team')
            ? [{ to: '/manager/team', label: 'Team', icon: IconTeam }]
            : [])
        ]
      : [])
  ]

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <LogoMark size={38} onGradient darkMode={darkMode} />
          <div className="sidebar-brand-copy">
            <h1>FlowSync</h1>
            <span>Intelligent Task Management</span>
          </div>
        </div>

        <div className="sidebar-section">
          {isAdministrator ? 'Administrator Workspace' : isManager ? 'Manager Workspace' : 'My Workspace'}
        </div>

        <nav className="sidebar-nav">
          {links.map((l) => {
            const Icon = l.icon
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
                title={collapsed ? l.label : undefined}
              >
                <Icon size={18} />
                <span className="sidebar-link-label">{l.label}</span>
                {l.count > 0 && <span className="count">{l.count}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar name={user.name} color={user.color} image={user.profileImage} size={38} />
            <div className="info">
              <div className="nm">{user.name}</div>
              <div className="rl">{user.title}</div>
            </div>
          </div>
          <button
            className="sidebar-reset"
            onClick={handleReset}
            title="Restore the original sample dataset"
            aria-label="Reset demo data"
          >
            <IconReset size={14} /><span className="sidebar-action-label">Reset Demo Data</span>
          </button>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            aria-label="Log out"
            title="Log out"
            style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
            onClick={logout}
          >
            <IconLogout size={16} /><span className="sidebar-action-label">Log out</span>
          </button>
        </div>
      </aside>
      <div
        className="sidebar-resize"
        role="separator"
        aria-label="Resize sidebar"
        aria-orientation="vertical"
        aria-valuemin={76}
        aria-valuemax={256}
        aria-valuenow={Math.round(sidebarWidth)}
        tabIndex={0}
        onPointerDown={onResizeStart}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') onResizeBy(-16)
          if (event.key === 'ArrowRight') onResizeBy(16)
        }}
      />
    </>
  )
}
