// Pure helper functions for deriving statistics and filtered views from the
// shared task list. Kept free of React so they can be unit-reasoned about and
// reused by any component.

import { STATUS, PRIORITY } from '../data/mockData.js'
import { isOverdue } from './aiService.js'

export { isOverdue }

export function hasPermission(user, permission) {
  if (!user) return false
  if (user.role === 'administrator') return true
  return user.permissions?.[permission] !== false
}

/** Tasks visible to a user based on role + team permissions. */
export function visibleTasks(tasks, user, users) {
  if (!user || !hasPermission(user, 'tasks') || user.role === 'administrator') return []
  if (user.role === 'manager') {
    const me = users.find((u) => u.id === user.id)
    const teamIds = new Set([user.id, ...(me?.team || [])])
    return tasks.filter((t) => teamIds.has(t.assigneeId))
  }
  // Staff only see their own tasks.
  return tasks.filter((t) => t.assigneeId === user.id)
}

/** Summary counts used by the dashboard overview cards. */
export function taskStats(tasks) {
  const total = tasks.length
  const inProgress = tasks.filter((t) => t.status === STATUS.IN_PROGRESS).length
  const completed = tasks.filter((t) => t.status === STATUS.COMPLETED).length
  const overdue = tasks.filter(isOverdue).length
  const todo = tasks.filter((t) => t.status === STATUS.TODO).length

  const upcoming = tasks.filter((t) => {
    if (t.status === STATUS.COMPLETED) return false
    const days = (new Date(t.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    return days >= 0 && days <= 7
  }).length

  const completionRate = total ? Math.round((completed / total) * 100) : 0

  return {
    total,
    todo,
    inProgress,
    completed,
    overdue,
    upcoming,
    completionRate
  }
}

/** Apply search + filters + sort to a list of tasks. */
export function filterTasks(tasks, { search, status, priority, sortBy, special } = {}) {
  let result = [...tasks]

  if (search) {
    const q = search.toLowerCase()
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    )
  }

  if (status && status !== 'all') {
    result = result.filter((t) => t.status === status)
  }

  if (priority && priority !== 'all') {
    result = result.filter((t) => t.priority === priority)
  }

  // Special quick filters driven from clickable dashboard summary cards.
  if (special === 'overdue') {
    result = result.filter(isOverdue)
  } else if (special === 'upcoming') {
    result = result.filter((t) => {
      if (t.status === STATUS.COMPLETED) return false
      const days = (new Date(t.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      return days >= 0 && days <= 7
    })
  } else if (special === 'new') {
    // "New" = recently added tasks still awaiting the user's first review.
    result = result.filter((t) => t.aiDetected && t.needsReview)
  }

  const priorityWeight = { [PRIORITY.HIGH]: 3, [PRIORITY.MEDIUM]: 2, [PRIORITY.LOW]: 1 }

  if (sortBy === 'priority') {
    result.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])
  } else if (sortBy === 'dueDate') {
    result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  } else if (sortBy === 'progress') {
    result.sort((a, b) => b.progress - a.progress)
  }

  return result
}

/** Per-employee statistics for the manager team overview. */
export function employeeStats(tasks, employee) {
  const own = tasks.filter((t) => t.assigneeId === employee.id)
  return {
    assigned: own.length,
    completed: own.filter((t) => t.status === STATUS.COMPLETED).length,
    active: own.filter((t) => t.status !== STATUS.COMPLETED).length,
    overdue: own.filter(isOverdue).length,
    progress: own.length
      ? Math.round(own.reduce((sum, t) => sum + t.progress, 0) / own.length)
      : 0
  }
}

/** Project cards for the selected project names, including task and member summaries. */
export function projectSummaries(tasks, projectNames, users) {
  return projectNames.map((name) => {
    const projectTasks = tasks.filter((task) => (task.engagement || 'Unassigned') === name)
    const memberIds = new Set(projectTasks.map((task) => task.assigneeId))
    const completed = projectTasks.filter((task) => task.status === STATUS.COMPLETED).length
    return {
      name,
      tasks: projectTasks,
      members: users.filter((user) => memberIds.has(user.id)),
      todo: projectTasks.filter((task) => task.status === STATUS.TODO).length,
      inProgress: projectTasks.filter((task) => task.status === STATUS.IN_PROGRESS).length,
      completed,
      progress: projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0
    }
  })
}

/** Format an ISO date as a short, readable label. */
export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

/** Relative "x days" label for due dates. */
export function dueLabel(iso) {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days}d`
}
