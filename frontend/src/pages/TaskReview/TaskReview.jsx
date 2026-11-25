// Task Management & Review
// New tasks are added automatically in the background, so this page is for
// reviewing and managing existing tasks (edit, update progress/status, verify
// auto-filled details, dismiss incorrect ones) — not for approving creation.

import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import { visibleTasks, filterTasks } from '../../services/taskService.js'
import ReviewTaskCard from './ReviewTaskCard.jsx'
import TaskModal from '../../components/TaskModal/TaskModal.jsx'
import TaskToolbar from '../../components/TaskToolbar.jsx'
import { useTaskModal } from '../../hooks/useTaskModal.js'
import { IconSparkle, IconReview } from '../../components/Icons.jsx'
import './TaskReview.css'

export default function TaskReview() {
  const { user } = useAuth()
  const { tasks, users, simulateIncomingTask } = useTasks()
  const { openTaskId, openTask, closeTask } = useTaskModal()
  const [tab, setTab] = useState('new')
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    sortBy: 'dueDate'
  })

  const myTasks = useMemo(() => visibleTasks(tasks, user, users), [tasks, user, users])

  const groups = useMemo(() => {
    const neu = myTasks.filter((t) => t.aiDetected)
    const needsAttention = neu.filter(
      (t) => t.needsReview || t.lowConfidence || (t.missingFields || []).length
    )
    return { neu, needsAttention, all: myTasks }
  }, [myTasks])

  const tabs = [
    { key: 'new', label: 'New tasks', list: groups.neu },
    { key: 'attention', label: 'Needs attention', list: groups.needsAttention },
    { key: 'all', label: 'All tasks', list: groups.all }
  ]

  const activeTab = tabs.find((t) => t.key === tab) || tabs[0]
  const filtered = useMemo(() => filterTasks(activeTab.list, filters), [activeTab, filters])

  return (
    <div className="fade-in review-page">
      <div className="section-title">
        <div>
          <h3>Task Management &amp; Review</h3>
          <span className="sub">
            Review and manage your tasks. New tasks are added automatically — just verify the details and edit if needed.
          </span>
        </div>
        <button className="btn btn-navy" onClick={() => simulateIncomingTask(user.id)}>
          <IconSparkle size={16} /> Simulate Incoming Task
        </button>
      </div>

      <div className="review-tabs">
        {tabs.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}<span className="pill">{t.list.length}</span>
          </button>
        ))}
      </div>

      <TaskToolbar value={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <div className="panel empty-state">
          <IconReview size={38} />
          <div style={{ marginBottom: 12 }}>
            {tab === 'new'
              ? 'No new tasks right now.'
              : tab === 'attention'
              ? 'Nothing needs your attention right now.'
              : 'No tasks match your filters.'}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => simulateIncomingTask(user.id)}>
            <IconSparkle size={14} /> Simulate an incoming task
          </button>
        </div>
      ) : (
        <div className="review-layout">
          {filtered.map((t) => (
            <ReviewTaskCard key={t.id} task={t} onOpen={openTask} currentUser={user} />
          ))}
        </div>
      )}

      {openTaskId && <TaskModal taskId={openTaskId} onClose={closeTask} />}
    </div>
  )
}
