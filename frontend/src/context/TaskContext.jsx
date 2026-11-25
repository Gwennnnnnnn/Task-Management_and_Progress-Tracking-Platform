import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react'
import { buildInitialState, USERS, TASKS, STATUS, SOURCE, APPROVAL, migrateTasks, progressForStatus } from '../data/mockData.js'
import { load, save, KEYS } from '../services/storage.js'
import { extractTaskFromMessage } from '../services/aiService.js'
import { getProfileImage } from '../services/authService.js'

const TaskContext = createContext(null)
export const MAX_TASK_ATTACHMENT_SIZE = 1_000_000
const defaultProjectByTaskId = new Map(
  TASKS.map((task) => [task.id, task.engagement])
)

function auditEntriesFromTasks(tasks) {
  return tasks.flatMap((task) =>
    (task.history || []).map((entry) => ({
      id: entry.id,
      actor: entry.by || 'User',
      action: entry.action,
      taskId: task.id,
      taskTitle: task.title,
      assigneeId: task.assigneeId,
      at: entry.at
    }))
  ).sort((a, b) => new Date(b.at) - new Date(a.at))
}

function restoreUsers(storedUsers) {
  const savedUsers = new Map(
    (Array.isArray(storedUsers) ? storedUsers : []).map((user) => [user.id, user])
  )
  const defaultUsers = new Map(USERS.map((user) => [user.id, user]))
  const normalizeUser = (user) => {
    const permissions = user.permissions || {}
    return {
      ...user,
      team: Array.isArray(user.team) ? user.team : [],
      permissions: {
        tasks: permissions.tasks !== false,
        calendar: permissions.calendar !== false,
        team: user.role === 'manager' && permissions.team !== false
      }
    }
  }

  const knownUsers = USERS.map((defaultUser) =>
    normalizeUser({ ...defaultUser, ...savedUsers.get(defaultUser.id) })
  )
  const additionalUsers = [...savedUsers.values()]
    .filter((user) => !defaultUsers.has(user.id))
    .map(normalizeUser)

  return [...knownUsers, ...additionalUsers]
}

// Load persisted demo data, falling back to the baseline dataset.
function loadData() {
  const stored = load(KEYS.DATA, null)
  if (!stored || !stored.tasks || !stored.users) {
    const initial = buildInitialState()
    initial.auditLogs = auditEntriesFromTasks(initial.tasks)
    return initial
  }
  // Migrate persisted tasks onto the three-column workflow so older demo data
  // (saved before this change) is folded in safely: legacy statuses map to the
  // three columns, progress realigns to the status mapping, and review states
  // are preserved as notes without duplication.
  const restoredTasks = stored.tasks.map((task) => {
    if (task.engagement) return task
    const engagement = defaultProjectByTaskId.get(task.id)
    return engagement ? { ...task, engagement } : task
  })
  const migratedTasks = migrateTasks(restoredTasks)
  return {
    ...stored,
    users: restoreUsers(stored.users),
    tasks: migratedTasks,
    auditLogs: Array.isArray(stored.auditLogs)
      ? stored.auditLogs
      : auditEntriesFromTasks(migratedTasks)
  }
}

let idSeq = 0
function newId(prefix) {
  idSeq += 1
  return `${prefix}-${Date.now()}-${idSeq}`
}

function adminAuditNotifications(users, message, createdAt) {
  return users
    .filter((candidate) => candidate.role === 'administrator' && !candidate.deletedAt)
    .map((admin) => ({
      id: newId('n'),
      userId: admin.id,
      type: 'audit-alert',
      title: 'Potentially risky audit activity',
      message,
      createdAt,
      read: false
    }))
}

export function TaskProvider({ children }) {
  const [data, setData] = useState(loadData)

  // Persist on every change so edits survive a refresh.
  useEffect(() => {
    save(KEYS.DATA, data)
  }, [data])

  const { tasks, notifications, engagements, auditLogs } = data
  const users = data.users.filter((candidate) => !candidate.deletedAt)
  const deletedUsers = data.users.filter((candidate) => candidate.deletedAt)

  // ---- Notifications -------------------------------------------------------

  const addNotification = useCallback((notif) => {
    setData((prev) => ({
      ...prev,
      notifications: [
        {
          id: newId('n'),
          read: false,
          createdAt: new Date().toISOString(),
          ...notif
        },
        ...prev.notifications
      ]
    }))
  }, [])

  const markNotificationRead = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    }))
  }, [])

  const markAllNotificationsRead = useCallback((userId) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.userId === userId ? { ...n, read: true } : n
      )
    }))
  }, [])

  const addAuditLog = useCallback((entry) => {
    setData((prev) => ({
      ...prev,
      auditLogs: [
        {
          id: newId('audit'),
          at: new Date().toISOString(),
          ...entry
        },
        ...(prev.auditLogs || [])
      ]
    }))
  }, [])

  // ---- Task operations -----------------------------------------------------

  const updateTask = useCallback(
    (taskId, changes, actorName) => {
      let targetTask = null
      setData((prev) => {
        const newAuditEntries = []
        const nextTasks = prev.tasks.map((t) => {
          if (t.id !== taskId) return t
          const at = new Date().toISOString()
          const effectiveChanges = { ...changes }
          // Progress is derived from the Kanban status. Whenever the status
          // changes, realign progress to the mapping unless an explicit
          // progress value was provided with the change.
          if (changes.status && changes.status !== t.status && changes.progress == null) {
            effectiveChanges.progress = progressForStatus(changes.status)
          }
          const updated = { ...t, ...effectiveChanges, updatedAt: at }
          // Once a user edits an AI-detected task, it's no longer "needs review".
          if (t.aiDetected) updated.needsReview = false

          // Build a readable history entry describing what changed.
          const parts = []
          if (changes.status && changes.status !== t.status)
            parts.push(`status changed to ${changes.status}`)
          if (effectiveChanges.progress != null && effectiveChanges.progress !== t.progress)
            parts.push(`progress updated to ${effectiveChanges.progress}%`)
          if (changes.priority && changes.priority !== t.priority)
            parts.push(`priority set to ${changes.priority}`)
          if (changes.dueDate && changes.dueDate !== t.dueDate)
            parts.push('deadline updated')
          if (changes.assigneeId && changes.assigneeId !== t.assigneeId)
            parts.push('assignee changed')
          if (changes.engagement && changes.engagement !== t.engagement)
            parts.push('engagement changed')
          if (changes.title && changes.title !== t.title)
            parts.push('title changed')
          if (changes.description != null && changes.description !== t.description)
            parts.push('description updated')
          if (changes.progressNotes != null && changes.progressNotes !== t.progressNotes)
            parts.push('progress notes updated')
          if (parts.length) {
            updated.history = [
              ...(updated.history || []),
              {
                id: newId('h'),
                by: actorName || 'User',
                action: parts.join(', '),
                at
              }
            ]
            newAuditEntries.push({
              id: newId('audit'),
              actor: actorName || 'User',
              action: parts.join(', '),
              taskId: t.id,
              taskTitle: updated.title,
              assigneeId: updated.assigneeId,
              at
            })
          }
          targetTask = updated
          return updated
        })
        return {
          ...prev,
          tasks: nextTasks,
          auditLogs: [...newAuditEntries, ...(prev.auditLogs || [])]
        }
      })

      // Fire a progress notification to the assignee when progress is changed
      // explicitly (not when it is merely derived from a status/Kanban move).
      if (changes.progress != null && targetTask) {
        addNotification({
          userId: targetTask.assigneeId,
          type: 'progress',
          title: 'Task progress updated',
          message: `${targetTask.title} progress is now ${changes.progress}%.`,
          taskId
        })
      }
    },
    [addNotification]
  )

  const addTaskNote = useCallback((taskId, text, author) => {
    const noteText = text.trim()
    if (!noteText) return

    setData((prev) => {
      const task = prev.tasks.find((candidate) => candidate.id === taskId)
      if (!task) return prev

      const at = new Date().toISOString()
      const note = {
        id: newId('note'),
        text: noteText,
        authorId: author.id,
        by: author.name || 'User',
        at
      }
      const actor = author.name || 'User'
      const historyEntry = {
        id: newId('h'),
        by: actor,
        action: 'Added a note',
        at
      }
      const auditEntry = {
        id: newId('audit'),
        actor,
        action: 'Added a note',
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: task.assigneeId,
        at
      }

      return {
        ...prev,
        tasks: prev.tasks.map((candidate) =>
          candidate.id === taskId
            ? {
                ...candidate,
                notes: [...(candidate.notes || []), note],
                progressNotes: [candidate.progressNotes, noteText].filter(Boolean).join('\n'),
                updatedAt: at,
                history: [...(candidate.history || []), historyEntry]
              }
            : candidate
        ),
        auditLogs: [auditEntry, ...(prev.auditLogs || [])]
      }
    })
  }, [])

  const addTaskAttachment = useCallback((taskId, attachment, actor) => {
    if (!actor || !['manager', 'staff'].includes(actor.role)) {
      throw new Error('Only managers and employees can attach files to tasks.')
    }
    const task = tasks.find((candidate) => candidate.id === taskId)
    if (!task) throw new Error('This task is no longer available.')
    if (actor.role === 'staff' && task.assigneeId !== actor.id) {
      throw new Error('Employees can only attach files to their own tasks.')
    }

    const name = typeof attachment?.name === 'string' ? attachment.name.trim() : ''
    const mimeType = typeof attachment?.mimeType === 'string'
      ? attachment.mimeType
      : 'application/octet-stream'
    if (
      !name ||
      !Number.isFinite(attachment?.size) ||
      attachment.size < 0 ||
      attachment.size > MAX_TASK_ATTACHMENT_SIZE ||
      typeof attachment?.dataUrl !== 'string' ||
      !/^data:[^,]*;base64,/i.test(attachment.dataUrl)
    ) {
      throw new Error('The selected file is invalid or exceeds the 1 MB limit.')
    }

    const at = new Date().toISOString()
    const actorName = actor.name || 'User'
    const savedAttachment = {
      id: newId('attachment'),
      name,
      mimeType,
      size: attachment.size,
      dataUrl: attachment.dataUrl,
      isImage: attachment.isImage === true,
      addedBy: actorName,
      addedAt: at
    }
    const action = `Attached file: ${name}`
    const historyEntry = { id: newId('h'), by: actorName, action, at }
    const auditEntry = {
      id: newId('audit'),
      actor: actorName,
      action,
      taskId: task.id,
      taskTitle: task.title,
      assigneeId: task.assigneeId,
      at
    }

    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((candidate) =>
        candidate.id === taskId
          ? {
              ...candidate,
              attachments: [...(candidate.attachments || []), savedAttachment],
              updatedAt: at,
              history: [...(candidate.history || []), historyEntry]
            }
          : candidate
      ),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }))
  }, [tasks])

  const removeTaskAttachment = useCallback((taskId, attachmentId, actor) => {
    if (!actor || !['manager', 'staff'].includes(actor.role)) {
      throw new Error('Only managers and employees can remove task files.')
    }
    const task = tasks.find((candidate) => candidate.id === taskId)
    if (!task) throw new Error('This task is no longer available.')
    if (actor.role === 'staff' && task.assigneeId !== actor.id) {
      throw new Error('Employees can only remove files from their own tasks.')
    }

    const attachment = (task.attachments || []).find((candidate) => candidate.id === attachmentId)
    if (!attachment || attachment.removedAt) throw new Error('This file is no longer attached.')

    const at = new Date().toISOString()
    const actorName = actor.name || 'User'
    const action = `Removed attachment (recoverable): ${attachment.name}`
    const historyEntry = { id: newId('h'), by: actorName, action, at }
    const auditEntry = {
      id: newId('audit'),
      actor: actorName,
      action,
      taskId: task.id,
      taskTitle: task.title,
      assigneeId: task.assigneeId,
      at
    }

    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((candidate) =>
        candidate.id === taskId
          ? {
              ...candidate,
              attachments: (candidate.attachments || []).map((file) =>
                file.id === attachmentId
                  ? { ...file, removedAt: at, removedBy: actorName }
                  : file
              ),
              updatedAt: at,
              history: [...(candidate.history || []), historyEntry]
            }
          : candidate
      ),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }))
  }, [tasks])

  const restoreTaskAttachment = useCallback((taskId, attachmentId, actor) => {
    if (!actor || !['manager', 'staff'].includes(actor.role)) {
      throw new Error('Only managers and employees can restore task files.')
    }
    const task = tasks.find((candidate) => candidate.id === taskId)
    if (!task) throw new Error('This task is no longer available.')
    if (actor.role === 'staff' && task.assigneeId !== actor.id) {
      throw new Error('Employees can only restore files on their own tasks.')
    }

    const attachment = (task.attachments || []).find((candidate) => candidate.id === attachmentId)
    if (!attachment || !attachment.removedAt) throw new Error('This removed file is no longer available.')

    const at = new Date().toISOString()
    const actorName = actor.name || 'User'
    const action = `Restored attachment: ${attachment.name}`
    const historyEntry = { id: newId('h'), by: actorName, action, at }
    const auditEntry = {
      id: newId('audit'),
      actor: actorName,
      action,
      taskId: task.id,
      taskTitle: task.title,
      assigneeId: task.assigneeId,
      at
    }

    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((candidate) =>
        candidate.id === taskId
          ? {
              ...candidate,
              attachments: (candidate.attachments || []).map((file) =>
                file.id === attachmentId
                  ? { ...file, removedAt: null, removedBy: null, restoredAt: at, restoredBy: actorName }
                  : file
              ),
              updatedAt: at,
              history: [...(candidate.history || []), historyEntry]
            }
          : candidate
      ),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])]
    }))
  }, [tasks])

  const updateUserPermissions = useCallback((userId, permission, enabled, actor) => {
    if (actor?.role !== 'administrator') {
      throw new Error('Only administrators can change user permissions.')
    }
    if (!['tasks', 'calendar', 'team'].includes(permission) || typeof enabled !== 'boolean') {
      throw new Error('Invalid user permission update.')
    }
    const target = users.find((candidate) => candidate.id === userId)
    if (!target || target.role === 'administrator' || (permission === 'team' && target.role !== 'manager')) {
      throw new Error('This user permission cannot be changed.')
    }
    if (target.permissions?.[permission] === enabled) return

    const at = new Date().toISOString()
    const actorName = actor.name || 'Administrator'
    const action = `${permission} access ${enabled ? 'enabled' : 'disabled'} for ${target.name}`
    setData((prev) => ({
      ...prev,
      users: prev.users.map((candidate) =>
        candidate.id === userId
          ? { ...candidate, permissions: { ...candidate.permissions, [permission]: enabled } }
          : candidate
      ),
      notifications: enabled
        ? prev.notifications
        : [
            ...adminAuditNotifications(
              prev.users,
              `${actorName} disabled ${permission} access for ${target.name}.`,
              at
            ),
            ...(prev.notifications || [])
          ],
      auditLogs: [
        {
          id: newId('audit'),
          actor: actorName,
          action,
          item: `User access — ${target.name}`,
          at
        },
        ...(prev.auditLogs || [])
      ]
    }))
  }, [users])

  const updateManagerAssignment = useCallback((managerId, employeeId, assigned, actor) => {
    if (actor?.role !== 'administrator') {
      throw new Error('Only administrators can assign employees to managers.')
    }
    if (typeof assigned !== 'boolean') {
      throw new Error('Invalid manager assignment update.')
    }
    const manager = users.find((candidate) => candidate.id === managerId)
    const employee = users.find((candidate) => candidate.id === employeeId)
    if (manager?.role !== 'manager' || employee?.role !== 'staff') {
      throw new Error('Select a valid manager and employee.')
    }
    const isAssigned = (manager.team || []).includes(employeeId)
    if (isAssigned === assigned) return

    const at = new Date().toISOString()
    const actorName = actor.name || 'Administrator'
    const action = `${assigned ? 'Assigned' : 'Unassigned'} ${employee.name} ${assigned ? 'to' : 'from'} ${manager.name}`
    setData((prev) => ({
      ...prev,
      users: prev.users.map((candidate) =>
        candidate.id === managerId
          ? {
              ...candidate,
              team: assigned
                ? [...new Set([...(candidate.team || []), employeeId])]
                : (candidate.team || []).filter((id) => id !== employeeId)
            }
          : candidate
      ),
      notifications: assigned
        ? prev.notifications
        : [
            ...adminAuditNotifications(
              prev.users,
              `${actorName} unassigned ${employee.name} from ${manager.name}.`,
              at
            ),
            ...(prev.notifications || [])
          ],
      auditLogs: [
        {
          id: newId('audit'),
          actor: actorName,
          action,
          item: `Team assignment — ${employee.name}`,
          at
        },
        ...(prev.auditLogs || [])
      ]
    }))
  }, [users])

  const addUser = useCallback((details, actor) => {
    if (actor?.role !== 'administrator') {
      throw new Error('Only administrators can add users.')
    }
    let name = String(details.name || '').trim()
    name = name.replace(/(^|[\s'’–-])(\p{L})/gu, (match, separator, letter) =>
      separator + letter.toLocaleUpperCase()
    )
    const email = String(details.email || '').trim().toLowerCase()
    const title = String(details.title || '').trim()
    const role = details.role
    if (!name || !email || !title || !details.password) {
      throw new Error('Complete all required user fields.')
    }
    if (typeof details.password !== 'string' || details.password.length < 8) {
      throw new Error('Temporary passwords must be at least 8 characters.')
    }
    if (!['administrator', 'manager', 'staff'].includes(role)) {
      throw new Error('Select a valid user role.')
    }
    if (data.users.some((candidate) => candidate.email.toLowerCase() === email)) {
      throw new Error('A user with this email address already exists.')
    }
    const user = {
      id: newId('u'),
      name,
      email,
      password: details.password,
      role,
      title,
      color: role === 'administrator' ? '#596f8a' : role === 'manager' ? '#3f6690' : '#78a4cb',
      team: [],
      permissions: {
        tasks: true,
        calendar: true,
        team: role === 'manager'
      }
    }
    const managerIds = role === 'staff'
      ? [...new Set(details.managerIds || [])].filter((id) =>
          users.some((candidate) => candidate.id === id && candidate.role === 'manager')
        )
      : []
    const at = new Date().toISOString()
    setData((prev) => ({
      ...prev,
      users: [
        ...prev.users.map((candidate) =>
          managerIds.includes(candidate.id)
            ? { ...candidate, team: [...new Set([...(candidate.team || []), user.id])] }
            : candidate
        ),
        user
      ],
      auditLogs: [
        {
          id: newId('audit'),
          actor: actor.name || 'Administrator',
          action: `Added ${role} account for ${name}`,
          item: `User management — ${name}`,
          at
        },
        ...(prev.auditLogs || [])
      ]
    }))
    return user
  }, [data.users, users, setData])

  const updateUser = useCallback((userId, changes, actor) => {
    if (actor?.role !== 'administrator') {
      throw new Error('Only administrators can edit users.')
    }
    const target = users.find((candidate) => candidate.id === userId)
    if (!target) throw new Error('This active user could not be found.')

    const name = String(changes.name || '').trim()
    const email = String(changes.email || '').trim().toLowerCase()
    const title = String(changes.title || '').trim()
    const role = changes.role
    if (!name || !email || !title) throw new Error('Complete all required user fields.')
    if (!['administrator', 'manager', 'staff'].includes(role)) {
      throw new Error('Select a valid user role.')
    }
    if (target.id === actor.id && role !== target.role) {
      throw new Error('You cannot change your own administrator role.')
    }
    if (data.users.some((candidate) => candidate.id !== userId && candidate.email.toLowerCase() === email)) {
      throw new Error('A user with this email address already exists.')
    }

    const activeStaffIds = new Set(users.filter((candidate) => candidate.role === 'staff').map((candidate) => candidate.id))
    const managerIds = [...new Set(changes.managerIds || [])].filter((id) =>
      id !== userId && users.some((candidate) => candidate.id === id && candidate.role === 'manager')
    )
    const teamIds = [...new Set(changes.teamIds || [])].filter((id) => activeStaffIds.has(id))
    const nextTarget = {
      ...target,
      name,
      email,
      title,
      role,
      permissions: {
        tasks: changes.permissions?.tasks !== false,
        calendar: changes.permissions?.calendar !== false,
        team: role === 'manager' && changes.permissions?.team !== false
      },
      team: role === 'manager' ? teamIds : []
    }
    const disabledPermissions = ['tasks', 'calendar', 'team'].filter((permission) =>
      target.permissions?.[permission] !== false && nextTarget.permissions[permission] === false
    )
    const previousManagerIds = users
      .filter((manager) => manager.role === 'manager' && (manager.team || []).includes(userId))
      .map((manager) => manager.id)
      .sort()
    const nextManagerIds = [...managerIds].sort()
    const managerAssignmentsChanged = target.role === 'staff' && role === 'staff' &&
      previousManagerIds.join(',') !== nextManagerIds.join(',')
    const auditAlert = target.role !== role
      ? `${actor.name || 'Administrator'} changed ${name}'s role from ${target.role} to ${role}.`
      : disabledPermissions.length
        ? `${actor.name || 'Administrator'} disabled ${disabledPermissions.join(', ')} access for ${name}.`
        : managerAssignmentsChanged
          ? `${actor.name || 'Administrator'} changed the manager assignment for ${name}${managerIds.length ? '.' : ', leaving the employee unassigned.'}`
          : null
    const at = new Date().toISOString()
    const updatedUsers = data.users.map((candidate) => {
      if (candidate.id === userId) return nextTarget
      if (candidate.role !== 'manager') return candidate

      let team = (candidate.team || []).filter((id) => id !== userId || role === 'staff')
      if (role === 'staff' && changes.managerIds) {
        team = managerIds.includes(candidate.id)
          ? [...new Set([...team, userId])]
          : team.filter((id) => id !== userId)
      }
      return { ...candidate, team }
    })
    const actorName = actor.name || 'Administrator'
    setData((prev) => ({
      ...prev,
      users: updatedUsers,
      notifications: auditAlert
        ? [
            ...adminAuditNotifications(updatedUsers, auditAlert, at),
            ...(prev.notifications || [])
          ]
        : prev.notifications,
      auditLogs: [
        {
          id: newId('audit'),
          actor: actorName,
          action: `Updated user details for ${name}`,
          item: `User management — ${name}`,
          at
        },
        ...(prev.auditLogs || [])
      ]
    }))
  }, [data.users, users, setData])

  const archiveUser = useCallback((userId, actor) => {
    if (actor?.role !== 'administrator') {
      throw new Error('Only administrators can delete users.')
    }
    const target = users.find((candidate) => candidate.id === userId)
    if (!target) throw new Error('This active user could not be found.')
    if (target.id === actor.id) throw new Error('You cannot delete your own account.')

    const at = new Date().toISOString()
    const actorName = actor.name || 'Administrator'
    setData((prev) => ({
      ...prev,
      users: prev.users.map((candidate) =>
        candidate.id === userId ? { ...candidate, deletedAt: at } : candidate
      ),
      notifications: [
        ...adminAuditNotifications(
          prev.users.filter((candidate) => candidate.id !== userId),
          `${actorName} moved ${target.name} to deleted users.`,
          at
        ),
        ...(prev.notifications || [])
      ],
      auditLogs: [
        {
          id: newId('audit'),
          actor: actorName,
          action: `Moved ${target.name} to deleted users`,
          item: `User management — ${target.name}`,
          at
        },
        ...(prev.auditLogs || [])
      ]
    }))
  }, [users])

  const restoreUser = useCallback((userId, actor) => {
    if (actor?.role !== 'administrator') {
      throw new Error('Only administrators can restore users.')
    }
    const target = deletedUsers.find((candidate) => candidate.id === userId)
    if (!target) throw new Error('This deleted user could not be found.')
    if (users.some((candidate) => candidate.email.toLowerCase() === target.email.toLowerCase())) {
      throw new Error('An active user already uses this email address.')
    }

    const at = new Date().toISOString()
    setData((prev) => ({
      ...prev,
      users: prev.users.map((candidate) =>
        candidate.id === userId ? { ...candidate, deletedAt: null } : candidate
      ),
      auditLogs: [
        {
          id: newId('audit'),
          actor: actor.name || 'Administrator',
          action: `Restored ${target.name}`,
          item: `User management — ${target.name}`,
          at
        },
        ...(prev.auditLogs || [])
      ]
    }))
  }, [deletedUsers, users])

  const addTask = useCallback(
    (task, actorName) => {
      const id = newId('t')
      const full = {
        id,
        progress: 0,
        status: STATUS.TODO,
        source: SOURCE.MANUAL,
        sourceMessage: 'Added manually.',
        approval: APPROVAL.NOT_REQUIRED,
        aiDetected: false,
        needsReview: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progressNotes: '',
        notes: [],
        holderId: task.assigneeId,
        history: [
          {
            id: newId('h'),
            by: actorName || 'User',
            action: 'Task created',
            at: new Date().toISOString()
          }
        ],
        ...task
      }
      const event = {
        id: newId('audit'),
        actor: actorName || 'User',
        action: 'Task created',
        taskId: id,
        taskTitle: full.title,
        assigneeId: full.assigneeId,
        at: full.createdAt
      }
      setData((prev) => ({
        ...prev,
        tasks: [full, ...prev.tasks],
        auditLogs: [event, ...(prev.auditLogs || [])]
      }))
      addNotification({
        userId: full.assigneeId,
        type: 'assigned',
        title: 'New task assigned',
        message: `${full.title} has been added to your tasks.`,
        taskId: id
      })
      return full
    },
    [addNotification]
  )

  // Remove a task entirely (used to dismiss incorrectly detected tasks).
  const dismissTask = useCallback((taskId, actorName) => {
    setData((prev) => {
      const task = prev.tasks.find((candidate) => candidate.id === taskId)
      if (!task) return prev
      const at = new Date().toISOString()
      return {
        ...prev,
        tasks: prev.tasks.filter((candidate) => candidate.id !== taskId),
        // Clean up notifications that point at the removed task.
        notifications: prev.notifications.filter((n) => n.taskId !== taskId),
        auditLogs: [
          {
            id: newId('audit'),
            actor: actorName || 'User',
            action: 'Task dismissed',
            taskId: task.id,
            taskTitle: task.title,
            assigneeId: task.assigneeId,
            at
          },
          ...(prev.auditLogs || [])
        ]
      }
    })
  }, [])

  // Explicitly clear the "New" indicator once the user has reviewed the task.
  // This is independent of notification read-state: reading a notification does
  // NOT mark its task reviewed.
  const markTaskReviewed = useCallback((taskId, actorName) => {
    setData((prev) => {
      const task = prev.tasks.find((candidate) => candidate.id === taskId && candidate.needsReview)
      if (!task) return prev
      const at = new Date().toISOString()
      const actor = actorName || 'User'
      const event = {
        id: newId('audit'),
        actor,
        action: 'Marked as reviewed',
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: task.assigneeId,
        at
      }
      return {
        ...prev,
        tasks: prev.tasks.map((candidate) =>
          candidate.id === taskId
            ? {
                ...candidate,
                needsReview: false,
                updatedAt: at,
                history: [
                  ...(candidate.history || []),
                  { id: newId('h'), by: actor, action: event.action, at }
                ]
              }
            : candidate
        ),
        auditLogs: [event, ...(prev.auditLogs || [])]
      }
    })
  }, [])

  // ---- AI auto-detection workflow ------------------------------------------
  // Simulated incoming message -> task is created AUTOMATICALLY (status To Do),
  // flagged as AI-detected, and the assignee is notified. No approval queue.

  // When an `assigneeId` is supplied (e.g. the logged-in user), the simulated
  // task is created against that account — this gives managers the SAME
  // personal-task flow as staff (the task lands on their own board). Without an
  // id it falls back to a random staff member (legacy behaviour).
  const simulateIncomingTask = useCallback((assigneeId) => {
    const staffIds = users.filter((u) => u.role === 'staff').map((u) => u.id)
    const suggestion = extractTaskFromMessage(staffIds)
    const e = suggestion.extracted
    // Prefer the explicit target (personal flow) over AI's random pick.
    if (assigneeId) e.assigneeId = assigneeId
    const id = newId('t')

    // Mark fields that AI was uncertain about so the UI can highlight them.
    const missing = []
    if (!e.dueDate || e.dueDateMissing) missing.push('dueDate')
    if (!e.assigneeId) missing.push('assigneeId')
    const lowConfidence = suggestion.confidence < 0.8

    const task = {
      id,
      title: e.title,
      description: e.description,
      assigneeId: e.assigneeId,
      dueDate: e.dueDate,
      priority: e.priority,
      status: STATUS.TODO,
      progress: 0,
      source: suggestion.source,
      sourceMessage: suggestion.sourceMessage,
      approval: APPROVAL.NOT_REQUIRED,
      aiDetected: true,
      needsReview: true, // prompts the user to verify the auto-filled details
      confidence: suggestion.confidence,
      missingFields: missing,
      lowConfidence,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      holderId: e.assigneeId,
      progressNotes: '',
      notes: [],
      history: [
        {
          id: newId('h'),
          by: 'AI Assistant',
          action: `Task auto-detected from a ${suggestion.source} message`,
          at: new Date().toISOString()
        }
      ]
    }

    const event = {
      id: newId('audit'),
      actor: 'AI Assistant',
      action: `Task auto-detected from ${suggestion.source}`,
      taskId: task.id,
      taskTitle: task.title,
      assigneeId: task.assigneeId,
      at: task.createdAt
    }
    setData((prev) => ({
      ...prev,
      tasks: [task, ...prev.tasks],
      auditLogs: [event, ...(prev.auditLogs || [])]
    }))

    addNotification({
      userId: e.assigneeId,
      type: suggestion.source === SOURCE.TEAMS ? 'ai-task-teams' : 'ai-task',
      title: `New task from ${suggestion.source}`,
      message: `"${e.title}" has been added to your tasks. Open it to review the details.`,
      taskId: id
    })

    return task
  }, [users, addNotification])

  // ---- Reset ---------------------------------------------------------------

  const resetDemoData = useCallback(() => {
    const fresh = buildInitialState()
    fresh.auditLogs = auditEntriesFromTasks(fresh.tasks)
    setData(fresh)
    save(KEYS.DATA, fresh)
  }, [])

  // ---- Lookups -------------------------------------------------------------

  const getUser = useCallback((id) => {
    const user = users.find((candidate) => candidate.id === id)
    return user ? { ...user, profileImage: getProfileImage(id) } : undefined
  }, [users])
  const getTask = useCallback((id) => tasks.find((t) => t.id === id), [tasks])

  const value = useMemo(
    () => ({
      tasks,
      users,
      deletedUsers,
      notifications,
      engagements,
      auditLogs,
      addAuditLog,
      updateTask,
      addTaskNote,
      addTaskAttachment,
      removeTaskAttachment,
      restoreTaskAttachment,
      updateUserPermissions,
      updateManagerAssignment,
      addUser,
      updateUser,
      archiveUser,
      restoreUser,
      addTask,
      dismissTask,
      markTaskReviewed,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      simulateIncomingTask,
      resetDemoData,
      getUser,
      getTask
    }),
    [
      tasks,
      users,
      deletedUsers,
      notifications,
      engagements,
      auditLogs,
      addAuditLog,
      updateTask,
      addTaskNote,
      addTaskAttachment,
      removeTaskAttachment,
      restoreTaskAttachment,
      updateUserPermissions,
      updateManagerAssignment,
      addUser,
      updateUser,
      archiveUser,
      restoreUser,
      addTask,
      dismissTask,
      markTaskReviewed,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      simulateIncomingTask,
      resetDemoData,
      getUser,
      getTask
    ]
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used within a TaskProvider')
  return ctx
}
