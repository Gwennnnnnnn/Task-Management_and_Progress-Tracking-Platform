import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import {
  IconSparkle,
  IconBell,
  IconClock,
  IconAlert,
  IconCheck,
  IconReview,
  IconMail,
  IconChat
} from '../Icons.jsx'
import './NotificationCenter.css'

const TYPE_META = {
  'ai-task': { icon: IconMail, color: '#3f6690', bg: '#e7f0f8' },
  'ai-task-teams': { icon: IconChat, color: '#2f5a86', bg: '#e4eef6' },
  'audit-alert': { icon: IconAlert, color: '#b4595a', bg: '#fbe9e9' },
  assigned: { icon: IconCheck, color: '#3f8560', bg: '#e4f4ec' },
  deadline: { icon: IconClock, color: '#a76b2e', bg: '#fdefdf' },
  overdue: { icon: IconAlert, color: '#b4595a', bg: '#fbe9e9' },
  review: { icon: IconReview, color: '#6b549e', bg: '#f1ecfa' },
  approval: { icon: IconReview, color: '#6b549e', bg: '#f1ecfa' },
  progress: { icon: IconCheck, color: '#3f6690', bg: '#e7f0f8' },
  clarification: { icon: IconAlert, color: '#a76b2e', bg: '#fdefdf' }
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export default function NotificationCenter({ onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifications, markNotificationRead, markAllNotificationsRead } = useTasks()

  const mine = notifications
    .filter((n) => n.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const unread = mine.filter((n) => !n.read).length

  function handleClick(n) {
    // Reading a notification only marks the notification read — it never
    // changes the task's own "New"/reviewed state.
    markNotificationRead(n.id)
    if (n.taskId) {
      // Deep-link to the Tasks page with ?task=<id> so the shared task drawer
      // opens that exact task. No new task is created.
      const base = user.role === 'manager' ? '/manager' : '/staff'
      navigate(`${base}/tasks?task=${n.taskId}`)
    }
    onClose?.()
  }

  return (
    <div className="notif-panel fade-in" role="dialog" aria-label="Notifications">
      <div className="notif-head">
        <div className="row gap-8">
          <IconBell size={18} />
          <strong>Notifications</strong>
          {unread > 0 && <span className="notif-unread-pill">{unread} new</span>}
        </div>
        {unread > 0 && (
          <button
            className="notif-mark-all"
            onClick={() => markAllNotificationsRead(user.id)}
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="notif-list">
        {mine.length === 0 && (
          <div className="notif-empty">You have no notifications yet.</div>
        )}
        {mine.map((n) => {
          const meta = TYPE_META[n.type] || TYPE_META.progress
          const Icon = meta.icon
          return (
            <button
              key={n.id}
              className={`notif-item ${n.read ? '' : 'unread'}`}
              onClick={() => handleClick(n)}
            >
              <span className="notif-icon" style={{ background: meta.bg, color: meta.color }}>
                <Icon size={16} />
              </span>
              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">{timeAgo(n.createdAt)}</div>
              </div>
              {!n.read && <span className="notif-dot" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
