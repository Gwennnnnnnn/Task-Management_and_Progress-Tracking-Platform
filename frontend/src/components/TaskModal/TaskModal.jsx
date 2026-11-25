// Reusable task detail + edit modal. Opened from dashboards, the task list,
// calendar and notifications. All edits flow through TaskContext so the change
// is reflected everywhere (cards, stats, tracker, calendar).
//
// Presented as a CENTRED modal with a dimmed backdrop, responsive width and an
// internally scrolling body so the header and footer buttons stay accessible.
//
// Status and progress are driven by the Kanban board (drag between columns),
// so there is no manual progress slider or status dropdown here. Progress is
// derived from status via the shared mapping.
//
// Rendered through a React Portal to document.body so the fixed-position modal
// is never clipped or mis-positioned by an ancestor that establishes a new
// containing block (e.g. a transformed/animated dashboard container).

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { MAX_TASK_ATTACHMENT_SIZE, useTasks } from '../../context/TaskContext.jsx'
import { PRIORITY, PLATFORMS, PLATFORM_OTHER } from '../../data/mockData.js'
import { PriorityBadge, StatusBadge, SourceBadge } from '../Badge.jsx'
import NewBadge from '../AIDetectedBadge.jsx'
import ProgressTracker from '../ProgressTracker/ProgressTracker.jsx'
import Avatar from '../Avatar.jsx'
import {
  IconClose,
  IconCheck,
  IconEdit,
  IconMail,
  IconChat,
  IconAlert,
  IconTrash,
  IconFile,
  IconImage,
  IconUpload,
  IconReset
} from '../Icons.jsx'
import { formatDate } from '../../services/taskService.js'
import './TaskModal.css'

let stagedAttachmentSequence = 0

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error(`Unable to read "${file.name}".`))
    }
    reader.onerror = () => {
      reject(new Error(`Unable to read "${file.name}": ${reader.error?.message || 'file read failed'}`))
    }
    reader.readAsDataURL(file)
  })
}

function formatFileSize(size) {
  if (size < 1024) return `${size} B`
  return `${(size / 1024).toFixed(1)} KB`
}

export default function TaskModal({ taskId, onClose }) {
  const { user } = useAuth()
  const {
    getTask,
    getUser,
    updateTask,
    addTaskNote,
    addTaskAttachment,
    removeTaskAttachment,
    restoreTaskAttachment,
    dismissTask,
    markTaskReviewed
  } = useTasks()
  const task = getTask(taskId)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [attachmentError, setAttachmentError] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState([])
  const [stagingAttachments, setStagingAttachments] = useState(false)
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const [draggingFiles, setDraggingFiles] = useState(false)
  const [platformOpen, setPlatformOpen] = useState(false)
  const platformRef = useRef(null)
  const attachmentInputRef = useRef(null)

  useEffect(() => {
    if (task) {
      // Map the stored source onto the dropdown: if it's one of the known
      // platforms use it directly, otherwise treat it as a custom "Others" value.
      const known = PLATFORMS.includes(task.source)
      setForm({
        priority: task.priority,
        description: task.description,
        dueDate: task.dueDate.slice(0, 10),
        platform: known ? task.source : task.source ? PLATFORM_OTHER : PLATFORMS[0],
        customPlatform: known ? '' : task.source || ''
      })
    }
    setNoteDraft('')
    setPendingAttachments([])
    setAttachmentError('')
    setEditing(false)
    setPlatformOpen(false)
  }, [taskId]) // reset when a different task opens

  // Close the platform dropdown on outside click or Escape.
  useEffect(() => {
    if (!platformOpen) return undefined
    function onPointerDown(e) {
      if (platformRef.current && !platformRef.current.contains(e.target)) {
        setPlatformOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [platformOpen])

  // Lock the page behind the modal from scrolling + close on Escape.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (!task || !form) return null

  const assignee = getUser(task.assigneeId)
  const holder = getUser(task.holderId)
  const canEditTask = user.role === 'manager' || task.assigneeId === user.id
  const canAddNote = user.role === 'manager' || user.role === 'staff'
  const canAttachFiles =
    user.role === 'manager' || (user.role === 'staff' && task.assigneeId === user.id)
  const activeAttachments = (task.attachments || []).filter((attachment) => !attachment.removedAt)
  const removedAttachments = (task.attachments || []).filter((attachment) => attachment.removedAt)

  // Resolve the platform (task source): the custom text when "Others" is
  // selected, otherwise the chosen option.
  const isOtherPlatform = form.platform === PLATFORM_OTHER
  const resolvedPlatform = isOtherPlatform ? form.customPlatform.trim() : form.platform
  const platformInvalid = isOtherPlatform && !resolvedPlatform

  function choosePlatform(value) {
    setForm((f) => ({ ...f, platform: value }))
    setPlatformOpen(false)
  }

  function save() {
    // Don't save an empty custom platform.
    if (platformInvalid) return
    // Status and progress are intentionally NOT editable here — they are driven
    // by the Kanban board. Saving edits preserves the task's current Kanban
    // status (and derived progress). The platform is stored as the task source.
    updateTask(
      task.id,
      {
        priority: form.priority,
        description: form.description,
        dueDate: new Date(form.dueDate).toISOString(),
        source: resolvedPlatform || task.source
      },
      user.name
    )
    setEditing(false)
  }

  function addNote() {
    const text = noteDraft.trim()
    if (!text) return
    addTaskNote(task.id, text, user)
    setNoteDraft('')
  }

  async function stageAttachments(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return

    setAttachmentError('')
    setStagingAttachments(true)
    const errors = []
    const staged = []
    for (const file of files) {
      if (file.size > MAX_TASK_ATTACHMENT_SIZE) {
        errors.push(`"${file.name}" is larger than the 1 MB limit.`)
        continue
      }

      try {
        const dataUrl = await readFileAsDataUrl(file)
        const isImage =
          file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(file.name)
        staged.push({
          id: `pending-${Date.now()}-${stagedAttachmentSequence++}`,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          isImage
        })
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `Unable to attach "${file.name}".`)
      }
    }
    setPendingAttachments((current) => [...current, ...staged])
    setAttachmentError(errors.join(' '))
    setStagingAttachments(false)
  }

  function handleAttachmentSelection(event) {
    const input = event.currentTarget
    const files = Array.from(input.files || [])
    input.value = ''
    stageAttachments(files)
  }

  function handleAttachmentDrop(event) {
    event.preventDefault()
    setDraggingFiles(false)
    if (stagingAttachments || uploadingAttachments) return
    stageAttachments(event.dataTransfer.files)
  }

  function removePendingAttachment(attachmentId) {
    setPendingAttachments((current) => current.filter((file) => file.id !== attachmentId))
  }

  function savePendingAttachments() {
    if (!pendingAttachments.length || uploadingAttachments) return
    setUploadingAttachments(true)
    setAttachmentError('')
    const savedIds = []
    const errors = []

    pendingAttachments.forEach((attachment) => {
      try {
        addTaskAttachment(task.id, attachment, user)
        savedIds.push(attachment.id)
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `Unable to save "${attachment.name}".`)
      }
    })

    setPendingAttachments((current) => current.filter((file) => !savedIds.includes(file.id)))
    setAttachmentError(errors.join(' '))
    setUploadingAttachments(false)
  }

  function handleRemoveAttachment(attachment) {
    const confirmed = window.confirm(
      `Remove "${attachment.name}" from active attachments?\n\nThe file will be kept in Removed files and can be restored.`
    )
    if (!confirmed) return
    try {
      removeTaskAttachment(task.id, attachment.id, user)
      setAttachmentError('')
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : 'Unable to remove this file.')
    }
  }

  function handleRestoreAttachment(attachment) {
    try {
      restoreTaskAttachment(task.id, attachment.id, user)
      setAttachmentError('')
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : 'Unable to restore this file.')
    }
  }

  function handleDismiss() {
    const ok = window.confirm(
      `Dismiss "${task.title}"?\n\nThis removes the task from the register. This cannot be undone (except via Reset Demo Data).`
    )
    if (ok) {
      dismissTask(task.id, user.name)
      onClose?.()
    }
  }

  const isNew = task.aiDetected && task.needsReview

  const modal = (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Task details: ${task.title}`}
      >
        <div className="modal-head">
          <div style={{ minWidth: 0 }}>
            {isNew && (
              <div className="row gap-8 wrap" style={{ marginBottom: 6 }}>
                <NewBadge />
              </div>
            )}
            <h3>{task.title}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* New-task verification prompt */}
          {isNew && !editing && (
            <div className="needs-review-banner">
              <IconAlert size={16} />
              <div className="row between gap-12" style={{ flex: 1, flexWrap: 'wrap' }}>
                <span>
                  This is a newly added task.{' '}
                  {(task.missingFields || []).length
                    ? 'Some details may be missing — '
                    : task.lowConfidence
                    ? 'Some details may need checking — '
                    : ''}
                  please review and edit if needed.
                </span>
                {canEditTask && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => markTaskReviewed(task.id, user.name)}
                  >
                    <IconCheck size={14} /> Mark reviewed
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Overview / edit form */}
          <div className="modal-section">
            <h4 style={{ marginBottom: 12 }}>Task details</h4>

            {!editing ? (
              <>
                <p className="text-sm" style={{ marginTop: 0 }}>{task.description}</p>
                <div className="detail-grid" style={{ marginTop: 14 }}>
                  <div className="detail-item">
                    <div className="lbl">Assignee</div>
                    <div className="val row gap-8" style={{ marginTop: 4 }}>
                      {assignee && <Avatar name={assignee.name} color={assignee.color} size={24} />}
                      {assignee?.name}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="lbl">Due date</div>
                    <div className="val">{formatDate(task.dueDate)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="lbl">Priority</div>
                    <div className="val"><PriorityBadge value={task.priority} /></div>
                  </div>
                  <div className="detail-item">
                    <div className="lbl">Status</div>
                    <div className="val"><StatusBadge value={task.status} /></div>
                  </div>
                  <div className="detail-item">
                    <div className="lbl">Source</div>
                    <div className="val"><SourceBadge value={task.source} /></div>
                  </div>
                  <div className="detail-item">
                    <div className="lbl">Last updated</div>
                    <div className="val">{formatDate(task.updatedAt)}</div>
                  </div>
                </div>

              </>
            ) : (
              <div>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    className="textarea"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="detail-grid">
                  <div className="field">
                    <label>Priority</label>
                    <select
                      className="select"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      {Object.values(PRIORITY).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
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
                <div className="field">
                  <label id="edit-platform-label">Platform</label>
                  {/* Custom dropdown (opens downward, themed) to change where
                      the task came from. Mirrors the New Task dialog. */}
                  <div className="platform-select" ref={platformRef}>
                    <button
                      type="button"
                      className="platform-trigger"
                      aria-haspopup="listbox"
                      aria-expanded={platformOpen}
                      aria-labelledby="edit-platform-label"
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
                      <ul className="platform-menu" role="listbox" aria-labelledby="edit-platform-label">
                        {[...PLATFORMS, PLATFORM_OTHER].map((p) => (
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
                      value={form.customPlatform}
                      onChange={(e) => setForm({ ...form, customPlatform: e.target.value })}
                      placeholder="Type the platform you got this task from"
                      aria-label="Custom platform name"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-section task-attachments-section">
            <div className="task-attachments-heading">
              <h4>Attachments</h4>
            </div>
            {canAttachFiles && (
              <>
                <input
                  ref={attachmentInputRef}
                  id="task-attachment-input"
                  className="task-attachment-input"
                  type="file"
                  multiple
                  onChange={handleAttachmentSelection}
                  aria-label="Choose task attachments"
                  disabled={stagingAttachments || uploadingAttachments}
                />
                <button
                  type="button"
                  className={`task-upload-dropzone${draggingFiles ? ' is-dragging' : ''}`}
                  onClick={() => attachmentInputRef.current?.click()}
                  onDragEnter={(event) => {
                    event.preventDefault()
                    setDraggingFiles(true)
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setDraggingFiles(false)}
                  onDrop={handleAttachmentDrop}
                  disabled={stagingAttachments || uploadingAttachments}
                >
                  <IconUpload className="task-upload-icon" size={25} aria-hidden="true" />
                  <span className="task-upload-title">
                    {stagingAttachments ? 'Preparing file previews...' : 'Drag files here or browse'}
                  </span>
                  <span className="task-upload-hint">Files up to 1 MB each</span>
                </button>
                {pendingAttachments.length > 0 && (
                  <div className="task-pending-attachments">
                    <p className="task-pending-heading">Ready to upload ({pendingAttachments.length})</p>
                    <ul className="task-attachments-list">
                      {pendingAttachments.map((attachment) => {
                        const AttachmentIcon = attachment.isImage ? IconImage : IconFile
                        return (
                          <li className="task-pending-attachment" key={attachment.id}>
                            {attachment.isImage ? (
                              <img
                                className="task-attachment-preview"
                                src={attachment.dataUrl}
                                alt={`Preview of ${attachment.name}`}
                              />
                            ) : (
                              <AttachmentIcon className="task-attachment-icon" size={17} aria-hidden="true" />
                            )}
                            <span className="task-attachment-name">{attachment.name}</span>
                            <span className="task-attachment-meta">{formatFileSize(attachment.size)}</span>
                            <button
                              type="button"
                              className="btn btn-icon btn-ghost task-attachment-remove"
                              onClick={() => removePendingAttachment(attachment.id)}
                              aria-label={`Remove ${attachment.name} from upload queue`}
                              disabled={uploadingAttachments}
                            >
                              <IconClose size={15} />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm task-attachment-save"
                      onClick={savePendingAttachments}
                      disabled={uploadingAttachments || stagingAttachments}
                    >
                      <IconUpload size={15} />
                      {uploadingAttachments ? 'Saving files...' : `Save & upload ${pendingAttachments.length} file${pendingAttachments.length === 1 ? '' : 's'}`}
                    </button>
                  </div>
                )}
              </>
            )}
            <p className="task-attachments-hint">
              {canAttachFiles
                ? 'Files are not attached until you choose Save & upload.'
                : 'Files attached to this task.'}
            </p>
            {attachmentError && (
              <p className="task-attachment-error" role="alert">{attachmentError}</p>
            )}
            {activeAttachments.length ? (
              <ul className="task-attachments-list">
                {activeAttachments.map((attachment) => {
                  const isImage =
                    attachment.isImage === true ||
                    attachment.mimeType?.startsWith('image/') ||
                    /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(attachment.name)
                  const AttachmentIcon = isImage ? IconImage : IconFile
                  return (
                    <li key={attachment.id}>
                      <AttachmentIcon className="task-attachment-icon" size={17} aria-hidden="true" />
                      <a
                        href={attachment.dataUrl}
                        download={attachment.name}
                        className="task-attachment-link"
                      >
                        <span className="task-attachment-name">{attachment.name}</span>
                        <span className="task-attachment-meta">
                          {formatFileSize(attachment.size)}
                          {attachment.addedBy ? ` · Added by ${attachment.addedBy}` : ''}
                        </span>
                      </a>
                      {canAttachFiles && (
                        <button
                          type="button"
                          className="btn btn-icon btn-ghost task-attachment-remove"
                          onClick={() => handleRemoveAttachment(attachment)}
                          aria-label={`Remove ${attachment.name}`}
                        >
                          <IconTrash size={15} />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="task-attachments-empty">No files attached.</p>
            )}
            {removedAttachments.length > 0 && (
              <div className="task-removed-attachments">
                <h5>Removed files</h5>
                <p className="task-attachments-hint">
                  Removed files are retained with this task and can be restored.
                </p>
                <ul className="task-attachments-list">
                  {removedAttachments.map((attachment) => (
                    <li className="task-removed-attachment" key={attachment.id}>
                      <IconFile className="task-attachment-icon" size={17} aria-hidden="true" />
                      <a
                        href={attachment.dataUrl}
                        download={attachment.name}
                        className="task-attachment-link"
                      >
                        <span className="task-attachment-name">{attachment.name}</span>
                        <span className="task-attachment-meta">
                          Removed {formatDate(attachment.removedAt)}
                          {attachment.removedBy ? ` · by ${attachment.removedBy}` : ''}
                        </span>
                      </a>
                      {canAttachFiles && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm task-attachment-restore"
                          onClick={() => handleRestoreAttachment(attachment)}
                          aria-label={`Restore ${attachment.name}`}
                        >
                          <IconReset size={14} />
                          Restore
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="modal-section task-notes-section">
            <h4>Notes</h4>
            {task.notes?.length ? (
              <div className="task-notes-list">
                {task.notes.map((note) => {
                  const author = getUser(note.authorId)
                  const authorName = author?.name || note.by || 'Former team member'
                  return (
                    <article className="task-note" key={note.id}>
                      <Avatar
                        name={authorName}
                        color={author?.color}
                        image={author?.profileImage}
                        size={32}
                      />
                      <div className="task-note-content">
                        <div className="task-note-meta">
                          <strong>{authorName}</strong>
                          <time dateTime={note.at || task.updatedAt}>
                            {new Date(note.at || task.updatedAt).toLocaleString('en-GB', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </time>
                        </div>
                        <p>{note.text}</p>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <p className="task-notes-empty">No notes yet.</p>
            )}
            {canAddNote && (
              <div className="task-note-composer">
                <textarea
                  className="textarea"
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Add a note..."
                  aria-label="Add a task note"
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={addNote}
                  disabled={!noteDraft.trim()}
                >
                  Add note
                </button>
              </div>
            )}
          </div>

          {/* Progress tracker */}
          {!editing && (
            <div className="modal-section">
              <h4>Progress tracking</h4>
              <ProgressTracker task={task} holder={holder} />
            </div>
          )}

          {/* Source message */}
          <div className="modal-section">
            <h4 className="row gap-8">
              {task.source === 'Teams' ? <IconChat size={15} /> : <IconMail size={15} />} Source message
            </h4>
            <div className="source-box">{task.sourceMessage}</div>
          </div>
        </div>

        {canEditTask && (
          <div className="modal-foot">
            {editing ? (
              <div className="btn-group end" style={{ width: '100%' }}>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={platformInvalid}>
                  <IconCheck size={16} /> Save changes
                </button>
              </div>
            ) : (
              <div className="btn-group end" style={{ width: '100%' }}>
                {/* Destructive action and edit grouped together on the right */}
                <button
                  className="btn btn-danger btn-icon"
                  onClick={handleDismiss}
                  title="Dismiss task"
                  aria-label="Dismiss task"
                >
                  <IconTrash size={16} />
                </button>
                <button className="btn btn-primary" onClick={() => setEditing(true)}>
                  <IconEdit size={16} /> Edit task
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
