// =============================================================================
// Mock data for the CLA AI Task Management & Progress Tracking Platform (PoC)
// Frontend-only. No backend, no real Microsoft Graph, no real AI.
// Dates are generated RELATIVE to the current date so calendars/deadlines stay
// meaningful whenever the demo is run.
// =============================================================================

// ---- Enumerations ----------------------------------------------------------

// The workflow is now a simple three-column Kanban. Status changes only by
// dragging a card between these columns; progress is derived from the status.
export const STATUS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
}

// The three Kanban columns, in display order.
export const STATUS_ORDER = [STATUS.TODO, STATUS.IN_PROGRESS, STATUS.COMPLETED]

// Consistent status -> progress mapping used everywhere progress is shown.
export const STATUS_PROGRESS = {
  [STATUS.TODO]: 0,
  [STATUS.IN_PROGRESS]: 50,
  [STATUS.COMPLETED]: 100
}

/** Progress percentage for a given Kanban status (defaults to 0). */
export function progressForStatus(status) {
  return STATUS_PROGRESS[status] ?? 0
}

// ---- Legacy status migration ----------------------------------------------
// Older demo data (and persisted localStorage data) used extra statuses that
// have been removed. These are folded into the three-column workflow. Review
// states are moved to In Progress and their meaning is preserved as a note.

export const LEGACY_STATUS = {
  PENDING_REVIEW: 'Pending Internal Review',
  PENDING_CLIENT: 'Pending Client',
  PENDING_CLARIFICATION: 'Pending Clarification'
}

// Review note text preserved when migrating review statuses into notes.
export const REVIEW_NOTES = {
  CLIENT: 'Pending client review',
  INTERNAL: 'Pending internal review'
}

const LEGACY_STATUS_MAP = {
  'Pending Internal Review': STATUS.IN_PROGRESS,
  'Pending Client': STATUS.IN_PROGRESS,
  'Pending Client Review': STATUS.IN_PROGRESS,
  'Pending Clarification': STATUS.IN_PROGRESS
}

// Which review note (if any) a legacy status should contribute.
const LEGACY_REVIEW_NOTE = {
  'Pending Internal Review': REVIEW_NOTES.INTERNAL,
  'Pending Client': REVIEW_NOTES.CLIENT,
  'Pending Client Review': REVIEW_NOTES.CLIENT,
  'Pending Clarification': REVIEW_NOTES.INTERNAL
}

/**
 * Normalise a single task onto the three-column workflow:
 *  - map any legacy status to one of To Do / In Progress / Completed
 *  - preserve review meaning in progressNotes (without duplicating)
 *  - realign progress to the status mapping
 * Returns a NEW task object; never mutates the input.
 */
export function migrateTask(task) {
  if (!task) return task
  const next = { ...task }

  const legacyNote = LEGACY_REVIEW_NOTE[task.status]
  const mappedStatus = LEGACY_STATUS_MAP[task.status]

  if (mappedStatus) next.status = mappedStatus
  // Any status not in the three-column set falls back to To Do.
  if (!STATUS_ORDER.includes(next.status)) next.status = STATUS.TODO

  // Preserve review information in notes without creating duplicates.
  if (legacyNote) {
    const existing = next.progressNotes || ''
    const alreadyPresent = existing.toLowerCase().includes(legacyNote.toLowerCase())
    if (!alreadyPresent) {
      next.progressNotes = existing ? `${legacyNote}. ${existing}` : legacyNote
    }
  }

  if (!Array.isArray(task.notes)) {
    next.notes = next.progressNotes
      ? [{
          id: `legacy-note-${task.id}`,
          text: next.progressNotes,
          authorId: task.assigneeId,
          by: '',
          at: task.updatedAt || task.createdAt
        }]
      : []
  }

  // Progress is derived from the (possibly migrated) status.
  next.progress = progressForStatus(next.status)

  return next
}

/** Migrate a list of tasks onto the three-column workflow. */
export function migrateTasks(tasks) {
  return (tasks || []).map(migrateTask)
}

export const PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
}

export const SOURCE = {
  OUTLOOK: 'Outlook',
  TEAMS: 'Teams',
  MANUAL: 'Manual'
}

// Platforms a user can pick from when manually adding a task, to record where
// the task came from. "Others" lets them type a platform not in this list.
export const PLATFORMS = [
  'WhatsApp',
  'Gmail',
  'Outlook',
  'Microsoft Teams',
  'Telegram',
  'SMS',
  'Phone call',
  'In person'
]

export const PLATFORM_OTHER = 'Others'

export const APPROVAL = {
  NOT_REQUIRED: 'Not Required',
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
}

// ---- Relative date helpers -------------------------------------------------

const DAY = 24 * 60 * 60 * 1000

/** Returns an ISO date string offset by `days` from now (can be negative). */
export function relativeDate(days) {
  return new Date(Date.now() + days * DAY).toISOString()
}

/** Short ISO date (yyyy-mm-dd) offset by `days` from now. */
export function relativeDay(days) {
  return new Date(Date.now() + days * DAY).toISOString().slice(0, 10)
}

// ---- Engagements -----------------------------------------------------------

export const ENGAGEMENTS = [
  'Horizon Manufacturing Audit',
  'Summit Retail Group FY25',
  'Meridian Bank Statutory Audit',
  'Crestwood Logistics Review',
  'Internal Controls Programme'
]

// ---- Users -----------------------------------------------------------------
// Administrators manage access, managers oversee their assigned teams, and
// staff access their own tasks.

export const USERS = [
  {
    id: 'u-admin-1',
    name: 'Marcus Lim',
    dateOfBirth: '1985-08-14',
    email: 'marcus.lim@cla-demo.com',
    password: 'admin123',
    role: 'administrator',
    title: 'Administrator',
    color: '#596f8a',
    team: [],
    permissions: { tasks: true, calendar: true, team: true }
  },
  {
    id: 'u-manager-1',
    name: 'Cheryl Tan',
    dateOfBirth: '1987-04-12',
    email: 'cheryl.tan@cla-demo.com',
    password: 'manager123',
    role: 'manager',
    title: 'Audit Manager',
    color: '#3f6690',
    team: ['u-staff-1', 'u-staff-2', 'u-staff-3', 'u-staff-4'],
    permissions: { tasks: true, calendar: true, team: true }
  },
  {
    id: 'u-manager-2',
    name: 'Daniel Lim',
    dateOfBirth: '1984-09-23',
    email: 'daniel.lim@cla-demo.com',
    password: 'manager123',
    role: 'manager',
    title: 'Engagement Manager',
    color: '#4f8aa0',
    team: ['u-staff-2', 'u-staff-4'],
    permissions: { tasks: true, calendar: true, team: true }
  },
  {
    id: 'u-staff-1',
    name: 'Hung Nguyen',
    dateOfBirth: '1995-02-08',
    email: 'hung.nguyen@cla-demo.com',
    password: 'staff123',
    role: 'staff',
    title: 'Audit Associate',
    color: '#78a4cb',
    team: [],
    permissions: { tasks: true, calendar: true, team: false }
  },
  {
    id: 'u-staff-2',
    name: 'Rianne Koh',
    dateOfBirth: '1993-11-17',
    email: 'rianne.koh@cla-demo.com',
    password: 'staff123',
    role: 'staff',
    title: 'Audit Associate',
    color: '#8c7bbf',
    team: [],
    permissions: { tasks: true, calendar: true, team: false }
  },
  {
    id: 'u-staff-3',
    name: 'Gwen Lee',
    dateOfBirth: '1990-06-05',
    email: 'gwen.lee@cla-demo.com',
    password: 'staff123',
    role: 'staff',
    title: 'Senior Associate',
    color: '#c58aa8',
    team: [],
    permissions: { tasks: true, calendar: true, team: false }
  },
  {
    id: 'u-staff-4',
    name: 'Marcus Ong',
    dateOfBirth: '1996-01-29',
    email: 'marcus.ong@cla-demo.com',
    password: 'staff123',
    role: 'staff',
    title: 'Audit Associate',
    color: '#d49a5e',
    team: [],
    permissions: { tasks: true, calendar: true, team: false }
  }
]

// Demo accounts surfaced on the login screen for quick access.
export const DEMO_ACCOUNTS = [
  {
    id: 'u-admin-1',
    label: 'Administrator',
    name: 'Marcus Lim',
    email: 'marcus.lim@cla-demo.com',
    password: 'admin123',
    role: 'administrator'
  },
  {
    id: 'u-staff-1',
    label: 'Staff / Normal User',
    name: 'Hung Nguyen',
    email: 'hung.nguyen@cla-demo.com',
    password: 'staff123',
    role: 'staff'
  },
  {
    id: 'u-manager-1',
    label: 'Manager',
    name: 'Cheryl Tan',
    email: 'cheryl.tan@cla-demo.com',
    password: 'manager123',
    role: 'manager'
  }
]

// ---- History helper --------------------------------------------------------

let historyCounter = 0
function h(by, action, daysAgo) {
  historyCounter += 1
  return {
    id: `h-${historyCounter}`,
    by,
    action,
    at: relativeDate(-daysAgo)
  }
}

// ---- Tasks -----------------------------------------------------------------

export const TASKS = [
  {
    id: 't-1',
    title: 'Prepare September Financial Statements',
    description:
      'Compile and format the September management accounts, including P&L, balance sheet and cash flow, ready for partner review.',
    assigneeId: 'u-staff-1',
    engagement: 'Horizon Manufacturing Audit',
    dueDate: relativeDay(1),
    priority: PRIORITY.HIGH,
    status: STATUS.IN_PROGRESS,
    progress: 65,
    source: SOURCE.OUTLOOK,
    sourceMessage:
      'From: partner@horizon-mfg.com — "Please have the September financial statements ready for review by tomorrow afternoon. Client wants to discuss on Thursday."',
    approval: APPROVAL.NOT_REQUIRED,
    createdAt: relativeDate(-6),
    updatedAt: relativeDate(-1),
    holderId: 'u-staff-1',
    progressNotes: 'P&L and balance sheet drafted. Cash flow statement still in progress.',
    history: [
      h('Hung Nguyen', 'Task created from Outlook email', 6),
      h('Hung Nguyen', 'Status changed to In Progress', 4),
      h('Hung Nguyen', 'Progress updated to 65%', 1)
    ]
  },
  {
    id: 't-2',
    title: 'Review Audit Working Papers',
    description:
      'Perform a detailed review of the audit working papers for completeness and cross-referencing before internal sign-off.',
    assigneeId: 'u-staff-3',
    engagement: 'Summit Retail Group FY25',
    dueDate: relativeDay(3),
    priority: PRIORITY.MEDIUM,
    status: LEGACY_STATUS.PENDING_REVIEW,
    progress: 80,
    source: SOURCE.TEAMS,
    sourceMessage:
      'Teams — Cheryl Tan: "Can you review the working papers for Summit Retail and flag anything outstanding before we sign off?"',
    approval: APPROVAL.NOT_REQUIRED,
    createdAt: relativeDate(-9),
    updatedAt: relativeDate(-2),
    holderId: 'u-staff-3',
    progressNotes: 'Working papers reviewed. Awaiting manager internal review sign-off.',
    history: [
      h('Gwen Lee', 'Task created from Teams message', 9),
      h('Gwen Lee', 'Status changed to In Progress', 6),
      h('Gwen Lee', 'Status changed to Pending Internal Review', 2)
    ]
  },
  {
    id: 't-3',
    title: 'Follow Up on Client Bank Confirmation',
    description:
      'Chase the outstanding bank confirmation from Meridian Bank. This is blocking completion of the cash audit section.',
    assigneeId: 'u-staff-1',
    engagement: 'Meridian Bank Statutory Audit',
    dueDate: relativeDay(-2),
    priority: PRIORITY.HIGH,
    status: LEGACY_STATUS.PENDING_CLIENT,
    progress: 40,
    source: SOURCE.OUTLOOK,
    sourceMessage:
      'From: cfo@meridian.com — "We will send the bank confirmation shortly." (No response received since.)',
    approval: APPROVAL.NOT_REQUIRED,
    createdAt: relativeDate(-12),
    updatedAt: relativeDate(-5),
    holderId: 'u-staff-1',
    progressNotes: 'Second follow-up email sent. Confirmation still outstanding from client.',
    history: [
      h('Hung Nguyen', 'Task created from Outlook email', 12),
      h('Hung Nguyen', 'Status changed to Pending Client', 5),
      h('Hung Nguyen', 'Added note: second follow-up sent', 5)
    ]
  },
  {
    id: 't-4',
    title: 'Submit Internal Controls Report',
    description:
      'Finalise and submit the internal controls assessment report for the engagement leadership team.',
    assigneeId: 'u-staff-2',
    engagement: 'Internal Controls Programme',
    dueDate: relativeDay(5),
    priority: PRIORITY.MEDIUM,
    status: STATUS.TODO,
    progress: 0,
    source: SOURCE.TEAMS,
    sourceMessage:
      'Teams — Daniel Lim: "Please prepare the internal controls report for review next week."',
    approval: APPROVAL.NOT_REQUIRED,
    createdAt: relativeDate(-3),
    updatedAt: relativeDate(-3),
    holderId: 'u-staff-2',
    progressNotes: '',
    history: [h('Rianne Koh', 'Task created from Teams message', 3)]
  },
  {
    id: 't-5',
    title: 'Review Supporting Financial Documents',
    description:
      'Verify supporting documentation for key revenue transactions against the general ledger.',
    assigneeId: 'u-staff-4',
    engagement: 'Crestwood Logistics Review',
    dueDate: relativeDay(-1),
    priority: PRIORITY.HIGH,
    status: STATUS.IN_PROGRESS,
    progress: 30,
    source: SOURCE.OUTLOOK,
    sourceMessage:
      'From: senior@cla-demo.com — "Please verify the supporting docs for Crestwood revenue samples."',
    approval: APPROVAL.NOT_REQUIRED,
    createdAt: relativeDate(-7),
    updatedAt: relativeDate(-3),
    holderId: 'u-staff-4',
    progressNotes: 'Sampled 12 of 40 transactions so far.',
    history: [
      h('Marcus Ong', 'Task created from Outlook email', 7),
      h('Marcus Ong', 'Status changed to In Progress', 3)
    ]
  },
  {
    id: 't-6',
    title: 'Clarify Outstanding Audit Findings',
    description:
      'Seek clarification from the client on three outstanding audit findings relating to inventory valuation.',
    assigneeId: 'u-staff-3',
    engagement: 'Summit Retail Group FY25',
    dueDate: relativeDay(2),
    priority: PRIORITY.MEDIUM,
    status: LEGACY_STATUS.PENDING_CLARIFICATION,
    progress: 50,
    source: SOURCE.TEAMS,
    sourceMessage:
      'Teams — Gwen Lee: "Need to clarify inventory valuation findings with the client contact."',
    approval: APPROVAL.NOT_REQUIRED,
    createdAt: relativeDate(-5),
    updatedAt: relativeDate(-1),
    holderId: 'u-staff-3',
    progressNotes: 'Awaiting client response on two of three findings.',
    history: [
      h('Gwen Lee', 'Task created from Teams message', 5),
      h('Gwen Lee', 'Status changed to Pending Clarification', 1)
    ]
  },
  {
    id: 't-7',
    title: 'Finalise Client Audit Report',
    description:
      'Incorporate review comments and finalise the audit report for partner sign-off and client issue.',
    assigneeId: 'u-staff-2',
    engagement: 'Horizon Manufacturing Audit',
    dueDate: relativeDay(7),
    priority: PRIORITY.LOW,
    status: STATUS.TODO,
    progress: 0,
    source: SOURCE.MANUAL,
    sourceMessage: 'Added manually by engagement team.',
    approval: APPROVAL.NOT_REQUIRED,
    createdAt: relativeDate(-2),
    updatedAt: relativeDate(-2),
    holderId: 'u-staff-2',
    progressNotes: '',
    history: [h('Rianne Koh', 'Task created manually', 2)]
  },
  {
    id: 't-8',
    title: 'Respond to Client Financial Queries',
    description:
      'Draft responses to the five financial queries raised by the Summit Retail finance team.',
    assigneeId: 'u-staff-1',
    engagement: 'Summit Retail Group FY25',
    dueDate: relativeDay(-4),
    priority: PRIORITY.HIGH,
    status: STATUS.COMPLETED,
    progress: 100,
    source: SOURCE.OUTLOOK,
    sourceMessage:
      'From: finance@summit-retail.com — "We have a few questions on the draft figures, please advise."',
    approval: APPROVAL.NOT_REQUIRED,
    createdAt: relativeDate(-14),
    updatedAt: relativeDate(-4),
    holderId: 'u-staff-1',
    progressNotes: 'All five queries answered and client acknowledged.',
    history: [
      h('Hung Nguyen', 'Task created from Outlook email', 14),
      h('Hung Nguyen', 'Status changed to In Progress', 10),
      h('Hung Nguyen', 'Status changed to Completed', 4)
    ]
  },
  {
    id: 't-9',
    title: 'Prepare Audit Planning Memo',
    description:
      'Draft the audit planning memorandum covering scope, materiality and key risk areas for the engagement.',
    assigneeId: 'u-staff-4',
    engagement: 'Meridian Bank Statutory Audit',
    dueDate: relativeDay(4),
    priority: PRIORITY.MEDIUM,
    status: STATUS.IN_PROGRESS,
    progress: 45,
    source: SOURCE.TEAMS,
    sourceMessage:
      'Teams — Cheryl Tan: "Start on the planning memo for Meridian, risk areas are the priority."',
    approval: APPROVAL.NOT_REQUIRED,
    createdAt: relativeDate(-4),
    updatedAt: relativeDate(-1),
    holderId: 'u-staff-4',
    progressNotes: 'Scope and materiality sections drafted.',
    history: [
      h('Marcus Ong', 'Task created from Teams message', 4),
      h('Marcus Ong', 'Status changed to In Progress', 2)
    ]
  },
  {
    id: 't-10',
    title: 'Reconcile Intercompany Balances',
    description:
      'Reconcile intercompany balances across the group entities and resolve any differences before consolidation.',
    assigneeId: 'u-staff-2',
    engagement: 'Crestwood Logistics Review',
    dueDate: relativeDay(0),
    priority: PRIORITY.HIGH,
    status: STATUS.IN_PROGRESS,
    progress: 55,
    source: SOURCE.OUTLOOK,
    sourceMessage:
      'From: controller@crestwood.com — "Intercompany balances need reconciling before we consolidate."',
    approval: APPROVAL.NOT_REQUIRED,
    createdAt: relativeDate(-6),
    updatedAt: relativeDate(-1),
    holderId: 'u-staff-2',
    progressNotes: 'Three of five entities reconciled.',
    history: [
      h('Rianne Koh', 'Task created from Outlook email', 6),
      h('Rianne Koh', 'Status changed to In Progress', 3)
    ]
  },
  {
    // Seeded AI-detected task so the "Task Management & Review" page and the
    // AI-Detected badge are visible on first load.
    id: 't-11',
    title: 'Perform Revenue Cut-off Testing',
    description:
      'Perform revenue cut-off testing for the final two weeks of the financial year to support the final review.',
    assigneeId: 'u-staff-3',
    engagement: 'Summit Retail Group FY25',
    dueDate: relativeDay(8),
    priority: PRIORITY.MEDIUM,
    status: STATUS.TODO,
    progress: 0,
    source: SOURCE.OUTLOOK,
    sourceMessage:
      'From: audit.partner@summit-retail.com\nSubject: Revenue cut-off testing\n\n"Hi team, could someone please perform revenue cut-off testing for the final two weeks of the financial year? We need this completed by the end of next week as it feeds into the final review. Thanks."',
    approval: APPROVAL.NOT_REQUIRED,
    aiDetected: true,
    needsReview: true,
    confidence: 0.92,
    missingFields: [],
    lowConfidence: false,
    createdAt: relativeDate(-0.3),
    updatedAt: relativeDate(-0.3),
    holderId: 'u-staff-3',
    progressNotes: '',
    history: [h('AI Assistant', 'Task auto-detected from an Outlook message', 0)]
  }
]

// ---- Notifications ---------------------------------------------------------
// `userId` null = visible to everyone of the relevant role resolution handled
// in the service layer. We keep it explicit here for clarity.

export const NOTIFICATIONS = [
  {
    id: 'n-1',
    userId: 'u-staff-1',
    type: 'deadline',
    title: 'Deadline approaching',
    message: 'Prepare September Financial Statements is due tomorrow.',
    taskId: 't-1',
    read: false,
    createdAt: relativeDate(-0.2)
  },
  {
    id: 'n-2',
    userId: 'u-staff-1',
    type: 'overdue',
    title: 'Task overdue',
    message: 'Follow Up on Client Bank Confirmation is overdue.',
    taskId: 't-3',
    read: false,
    createdAt: relativeDate(-1)
  },
  {
    id: 'n-3',
    userId: 'u-manager-1',
    type: 'review',
    title: 'Task awaiting review',
    message: 'Review Audit Working Papers is pending internal review.',
    taskId: 't-2',
    read: false,
    createdAt: relativeDate(-0.5)
  },
  {
    id: 'n-4',
    userId: 'u-staff-4',
    type: 'overdue',
    title: 'Task overdue',
    message: 'Review Supporting Financial Documents is overdue.',
    taskId: 't-5',
    read: true,
    createdAt: relativeDate(-1)
  },
  {
    id: 'n-5',
    userId: 'u-staff-3',
    type: 'ai-task',
    title: 'New task from Outlook',
    message: '"Perform Revenue Cut-off Testing" has been added to your tasks. Open it to review the details.',
    taskId: 't-11',
    read: false,
    createdAt: relativeDate(-0.3)
  }
]

// ---- Full dataset bundle ---------------------------------------------------

export function buildInitialState() {
  // Deep clone so the baseline dataset is never mutated (used for reset).
  const state = JSON.parse(
    JSON.stringify({
      users: USERS,
      tasks: TASKS,
      notifications: NOTIFICATIONS,
      engagements: ENGAGEMENTS
    })
  )
  // Ensure every task carries the AI-workflow flags so the UI can rely on them,
  // then migrate onto the three-column workflow (status/progress/review notes).
  state.tasks = migrateTasks(
    state.tasks.map((t) => ({
      aiDetected: false,
      needsReview: false,
      missingFields: [],
      lowConfidence: false,
      ...t
    }))
  )
  return state
}
