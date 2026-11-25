import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import NotificationCenter from '../NotificationCenter/NotificationCenter.jsx'
import { IconBell, IconMoon, IconSettings, IconSparkle, IconSun } from '../Icons.jsx'
import './Header.css'

export default function Header({ title, subtitle, onMenu, darkMode, onToggleDarkMode }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifications, simulateIncomingTask } = useTasks()
  const [panelOpen, setPanelOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [flash, setFlash] = useState(false)

  const unread = notifications.filter((n) => n.userId === user?.id && !n.read).length

  function handleSimulate() {
    // Create the simulated task for the logged-in user's own account so that
    // managers (e.g. Cheryl) get the same personal-task flow as staff: it lands
    // on their own board in To Do, with the New badge and a notification.
    simulateIncomingTask(user?.id)
    setFlash(true)
    setTimeout(() => setFlash(false), 1200)
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenu} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="header-right">
        {user.role !== 'administrator' && (
          <button
            className={`btn btn-navy btn-sm ${flash ? 'flash' : ''}`}
            onClick={handleSimulate}
            title="Simulate an incoming Outlook/Teams task"
          >
            <IconSparkle size={16} /> Simulate Incoming Task
          </button>
        )}

        <div className="bell-wrap">
          <button
            className="icon-btn"
            onClick={() => setPanelOpen((o) => !o)}
            aria-label="Notifications"
            aria-expanded={panelOpen}
            title="Notifications"
          >
            <IconBell size={20} />
            {unread > 0 && <span className="bell-count">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {panelOpen && (
            <NotificationCenter onClose={() => setPanelOpen(false)} />
          )}
        </div>

        <div className="settings-wrap">
          <button
            type="button"
            className={`icon-btn ${settingsOpen ? 'active' : ''}`}
            onClick={() => setSettingsOpen((open) => !open)}
            aria-label="Settings"
            aria-expanded={settingsOpen}
            aria-haspopup="dialog"
            title="Settings"
          >
            <IconSettings size={20} />
          </button>
          {settingsOpen && (
            <div className="settings-panel" role="dialog" aria-label="Settings">
              <div className="settings-head">
                <strong>Settings</strong>
              </div>
              <button
                type="button"
                className="settings-profile-button"
                onClick={() => {
                  setSettingsOpen(false)
                  navigate('/profile')
                }}
              >
                View profile
              </button>
              <div className="settings-theme">
                <div className="settings-theme-label">
                  <strong>Dark mode</strong>
                  <span>{darkMode ? 'On' : 'Off'}</span>
                </div>
                <button
                  type="button"
                  className={`theme-switch ${darkMode ? 'is-dark' : ''}`}
                  role="switch"
                  aria-label="Dark mode"
                  aria-checked={darkMode}
                  onClick={onToggleDarkMode}
                >
                  <IconSun size={16} />
                  <IconMoon size={16} />
                  <span className="theme-switch-thumb" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
