// "New task" button that opens a small dialog to manually create a task. The
// task is added to the shared TaskContext with status To Do and the drawer for
// it is opened so the user can continue editing.

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTasks } from '../context/TaskContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from './Toast/ToastContext.jsx'
import { PRIORITY, STATUS, PLATFORMS, PLATFORM_OTHER, relativeDay } from '../data/mockData.js'
import { IconPlus, IconClose } from './Icons.jsx'

// All selectable platform options (the fixed list plus the "Others" entry).
const PLATFORM_OPTIONS = [...PLATFORMS, PLATFORM_OTHER]

const INITIAL_FORM = {
  title: '',
  description: '',
  priority: PRIORITY.MEDIUM,
  platform: PLATFORMS[0],
  customPlatform: '',
  dueDate: relativeDay(7)
}

export default function NewTaskButton({ assigneeId, projectName, onCreated }) {
  const { addTask } = useTasks()
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [platformOpen, setPlatformOpen] = useState(false)
  const platformRef = useRef(null)

  function reset() {
    setForm(INITIAL_FORM)
    setPlatformOpen(false)
  }

  // Close the platform dropdown on outside click or Escape.
  useEffect(() => {
    if (!platformOpen) return undefined
    function onPointerDown(e) {
      if (platformRef.current && !platformRef.current.contains(e.target)) {
        setPlatformOpen(false)
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setPlatformOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [platformOpen])

  function choosePlatform(value) {
    setForm((f) => ({ ...f, platform: value }))
    setPlatformOpen(false)
  }

  // Resolve the platform the task came from: the custom text when "Others" is
  // selected, otherwise the chosen dropdown value.
  const isOtherPlatform = form.platform === PLATFORM_OTHER
  const resolvedPlatform = isOtherPlatform ? form.customPlatform.trim() : form.platform

  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    // If "Others" is chosen a custom platform name is required.
    if (isOtherPlatform && !resolvedPlatform) return
    const platform = resolvedPlatform || PLATFORMS[0]
    const created = addTask(
      {
        title: form.title.trim(),
        description: form.description.trim() || 'No description provided.',
        assigneeId,
        ...(projectName ? { engagement: projectName } : {}),
        priority: form.priority,
        status: STATUS.TODO,
        progress: 0,
        source: platform,
        sourceMessage: `Added from ${platform}.`,
        dueDate: new Date(form.dueDate).toISOString()
      },
      user.name
    )
    setOpen(false)
    reset()
    toast('Task added to To Do.', { tone: 'success' })
    if (created) onCreated?.(created.id)
  }

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        <IconPlus size={16} /> New Task
      </button>

      {open &&
        createPortal(
          <div className="modal-overlay center" onClick={() => setOpen(false)} role="presentation">
            <div
              className="dialog-panel"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Create task"
            >
              <div className="dialog-head">
                <h3>Create task</h3>
                <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close">
                  <IconClose size={18} />
                </button>
              </div>
              <form onSubmit={submit} className="dialog-body">
                <div className="field">
                  <label>Title</label>
                  <input
                    className="input"
                    autoFocus
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Prepare audit working papers"
                  />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    className="textarea"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional details..."
                  />
                </div>
                <div className="field">
                  <label id="platform-label">Platform</label>
                  {/* Custom dropdown so the options always open downward and are
                      fully styled in both light and dark mode (the native
                      option list could open upward and ignored dark styling). */}
                  <div className="platform-select" ref={platformRef}>
                    <button
                      type="button"
                      className="platform-trigger"
                      aria-haspopup="listbox"
                      aria-expanded={platformOpen}
                      aria-labelledby="platform-label"
                      onClick={() => setPlatformOpen((o) => !o)}
                    >
                      <span>{form.platform}</span>
                      <svg
                        className={`platform-caret ${platformOpen ? 'up' : ''}`}
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {platformOpen && (
                      <ul className="platform-menu" role="listbox" aria-labelledby="platform-label">
                        {PLATFORM_OPTIONS.map((p) => (
                          <li key={p} role="option" aria-selected={form.platform === p}>
                            <button
                              type="button"
                              className={`platform-option ${form.platform === p ? 'selected' : ''}`}
                              onClick={() => choosePlatform(p)}
                            >
                              {p}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {isOtherPlatform && (
                    <input
                      className="input"
                      style={{ marginTop: 8 }}
                      autoFocus
                      value={form.customPlatform}
                      onChange={(e) => setForm({ ...form, customPlatform: e.target.value })}
                      placeholder="Type the platform you got this task from"
                      aria-label="Custom platform name"
                    />
                  )}
                </div>
                <div className="detail-grid">
                  <div className="field">
                    <label>Priority</label>
                    <select
                      className="select"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      {Object.values(PRIORITY).map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Due date</label>
                    <input
                      type="date"
                      className="input"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="dialog-foot">
                  <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!form.title.trim() || (isOtherPlatform && !resolvedPlatform)}
                  >
                    <IconPlus size={16} /> Add to To Do
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
