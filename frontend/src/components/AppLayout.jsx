// Shared authenticated shell: fixed sidebar + sticky header + routed content.

import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTasks } from '../context/TaskContext.jsx'
import Sidebar from './Sidebar/Sidebar.jsx'
import Header from './Header/Header.jsx'

export default function AppLayout() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { users } = useTasks()
  const [menuOpen, setMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('flowsync-theme') === 'dark')
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('flowsync-sidebar-width')
    const parsedWidth = savedWidth === null ? 256 : Number(savedWidth)
    return Number.isFinite(parsedWidth) ? Math.min(256, Math.max(76, parsedWidth)) : 256
  })
  const [resizeStart, setResizeStart] = useState(null)

  useEffect(() => {
    localStorage.setItem('flowsync-theme', darkMode ? 'dark' : 'light')
    document.body.dataset.theme = darkMode ? 'dark' : 'light'
  }, [darkMode])

  useEffect(() => () => {
    delete document.body.dataset.theme
  }, [])

  useEffect(() => {
    localStorage.setItem('flowsync-sidebar-width', String(sidebarWidth))
  }, [sidebarWidth])

  useEffect(() => {
    if (!resizeStart) return undefined

    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect

    function handlePointerMove(event) {
      const nextWidth = resizeStart.width + event.clientX - resizeStart.x
      setSidebarWidth(Math.min(256, Math.max(76, nextWidth)))
    }

    function stopResize() {
      setResizeStart(null)
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResize)
    window.addEventListener('pointercancel', stopResize)

    return () => {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopResize)
      window.removeEventListener('pointercancel', stopResize)
    }
  }, [resizeStart])

  function toggleDarkMode() {
    setDarkMode((current) => !current)
  }

  function startSidebarResize(event) {
    if (window.innerWidth <= 900) return
    event.preventDefault()
    setResizeStart({ x: event.clientX, width: sidebarWidth })
  }

  function resizeSidebarBy(amount) {
    setSidebarWidth((width) => Math.min(256, Math.max(76, width + amount)))
  }

  const [workspace, tab] = pathname.split('/').filter(Boolean)
  const me = users.find((candidate) => candidate.id === user?.id)
  const teamSize = users.filter((candidate) => me?.team?.includes(candidate.id)).length
  const pageHeader = workspace === 'profile'
    ? { title: 'My profile', subtitle: 'View your account details and manage your password.' }
    : workspace === 'administrator'
      ? tab === 'audit-log'
        ? { title: 'Audit log', subtitle: 'A complete record of task and access activity.' }
        : { title: 'Administrator dashboard', subtitle: 'Manage user access and employee-to-manager assignments.' }
    : workspace === 'manager'
    ? tab === 'tasks'
      ? { title: 'Projects', subtitle: 'Browse your team’s projects and track their task progress.' }
      : tab === 'calendar'
        ? { title: 'Team Calendar', subtitle: 'Team deadlines, pending reviews and overdue assignments.' }
        : tab === 'team'
          ? { title: 'Team', subtitle: 'Click an employee to view their tasks.' }
          : {
              title: `Welcome back, ${user?.name?.split(' ')[0] ?? ''} 👋`,
              subtitle: `Team overview — monitoring ${teamSize} team members across active engagements.`
            }
    : tab === 'tasks'
      ? { title: 'My Tasks', subtitle: 'Drag a card between columns to update its status.' }
      : tab === 'calendar'
        ? { title: 'My Calendar', subtitle: 'Task deadlines across the month. Overdue tasks are marked in red.' }
        : {
            title: `Welcome back, ${user?.name?.split(' ')[0] ?? ''} 👋`,
            subtitle: "Here's an overview of your tasks and priorities."
          }

  return (
    <div
      className="app-shell"
      data-theme={darkMode ? 'dark' : 'light'}
      style={{ '--sidebar-w': `${sidebarWidth}px` }}
    >
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={sidebarWidth <= 140}
        sidebarWidth={sidebarWidth}
        darkMode={darkMode}
        onResizeStart={startSidebarResize}
        onResizeBy={resizeSidebarBy}
      />
      <div className="app-main">
        <Header
          title={pageHeader.title}
          subtitle={pageHeader.subtitle}
          onMenu={() => setMenuOpen((o) => !o)}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
