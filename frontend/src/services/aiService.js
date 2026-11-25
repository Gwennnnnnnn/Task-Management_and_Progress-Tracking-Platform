// Simulated "AI" service. There is NO real AI model here — every output is
// produced by deterministic frontend logic over the mock task data. All
// results should be labelled as simulated recommendations in the UI.

import { STATUS, PRIORITY, SOURCE, relativeDay } from '../data/mockData.js'

const DAY = 24 * 60 * 60 * 1000

function daysUntil(dueDate) {
  const diff = new Date(dueDate).getTime() - Date.now()
  return Math.ceil(diff / DAY)
}

export function isOverdue(task) {
  return (
    task.status !== STATUS.COMPLETED &&
    new Date(task.dueDate).getTime() < Date.now()
  )
}

// ---- Staff prioritisation --------------------------------------------------
// Scores each open task and returns ranked recommendations with an explanation.

export function getStaffInsights(tasks) {
  const open = tasks.filter((t) => t.status !== STATUS.COMPLETED)

  const scored = open.map((task) => {
    const days = daysUntil(task.dueDate)
    let score = 0
    const reasons = []

    if (isOverdue(task)) {
      score += 100
      reasons.push('it is overdue')
    } else if (days <= 1) {
      score += 80
      reasons.push('it is due today or tomorrow')
    } else if (days <= 3) {
      score += 50
      reasons.push(`it is due in ${days} days`)
    } else if (days <= 7) {
      score += 25
      reasons.push(`it is due in ${days} days`)
    }

    if (task.priority === PRIORITY.HIGH) {
      score += 40
      reasons.push('it is high priority')
    } else if (task.priority === PRIORITY.MEDIUM) {
      score += 20
    }

    // Review/blocked context is now captured in the task's notes rather than a
    // dedicated status. Surface it so prioritisation still reflects blockers.
    const notes = (task.progressNotes || '').toLowerCase()
    if (notes.includes('pending client review')) {
      reasons.push('it is blocked waiting on the client')
      score += 10
    }
    if (notes.includes('pending internal review')) {
      reasons.push('it is awaiting internal review')
      score += 10
    }

    const suggestedPriority = isOverdue(task) || days <= 1
      ? PRIORITY.HIGH
      : days <= 7
      ? PRIORITY.MEDIUM
      : PRIORITY.LOW

    const explanation = reasons.length
      ? `Prioritise "${task.title}" because ${joinReasons(reasons)}.`
      : `"${task.title}" can be scheduled after more urgent work.`

    return { task, score, suggestedPriority, explanation }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, 5)
}

function joinReasons(reasons) {
  if (reasons.length === 1) return reasons[0]
  return reasons.slice(0, -1).join(', ') + ' and ' + reasons[reasons.length - 1]
}

// ---- Manager insights ------------------------------------------------------
// Produces human-readable summaries computed from the team's task data.

export function getManagerInsights(tasks, teamUsers) {
  const insights = []

  const overdue = tasks.filter(isOverdue)
  if (overdue.length) {
    insights.push({
      id: 'ins-overdue',
      tone: 'danger',
      title: `${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} overdue across your team`,
      detail: overdue
        .slice(0, 3)
        .map((t) => t.title)
        .join(', '),
      taskId: overdue[0].id
    })
  }

  const awaitingReview = tasks.filter(
    (t) =>
      t.status !== STATUS.COMPLETED &&
      (t.progressNotes || '').toLowerCase().includes('pending internal review')
  )
  if (awaitingReview.length) {
    insights.push({
      id: 'ins-review',
      tone: 'warning',
      title: `${awaitingReview.length} task${awaitingReview.length > 1 ? 's are' : ' is'} awaiting internal review`,
      detail: awaitingReview.map((t) => t.title).join(', '),
      taskId: awaitingReview[0].id
    })
  }

  // Workload imbalance — flag the staff member with the most active tasks.
  const workload = teamUsers
    .map((u) => {
      const active = tasks.filter(
        (t) => t.assigneeId === u.id && t.status !== STATUS.COMPLETED
      ).length
      return { user: u, active }
    })
    .sort((a, b) => b.active - a.active)

  if (workload.length && workload[0].active >= 3) {
    insights.push({
      id: 'ins-workload',
      tone: 'info',
      title: `${workload[0].user.name} has ${workload[0].active} active tasks and may need support`,
      detail: 'Consider redistributing work to balance team capacity.',
      taskId: null
    })
  }

  const dueSoon = tasks.filter((t) => {
    const d = daysUntil(t.dueDate)
    return t.status !== STATUS.COMPLETED && d >= 0 && d <= 3
  })
  if (dueSoon.length) {
    insights.push({
      id: 'ins-duesoon',
      tone: 'info',
      title: `${dueSoon.length} task${dueSoon.length > 1 ? 's have' : ' has'} deadlines in the next 3 days`,
      detail: dueSoon.map((t) => t.title).slice(0, 3).join(', '),
      taskId: dueSoon[0].id
    })
  }

  return insights
}

// ---- AI task extraction from a mock message --------------------------------
// Picks from a small bank of realistic audit messages and "extracts" a task.

const MESSAGE_BANK = [
  {
    source: SOURCE.OUTLOOK,
    sourceMessage:
      'From: manager@horizon-mfg.com\nSubject: Fixed asset verification\n\n"Please carry out the fixed asset verification for the Horizon plant and have the results ready by the end of next week."',
    extracted: {
      title: 'Carry Out Fixed Asset Verification',
      description: 'Perform fixed asset verification for the Horizon plant and prepare the results.',
      engagement: 'Horizon Manufacturing Audit',
      priority: PRIORITY.MEDIUM,
      dueOffset: 9
    }
  },
  {
    source: SOURCE.TEAMS,
    sourceMessage:
      'Teams — Daniel Lim:\n"Hey, can you pull together the revenue analytics for Crestwood? Need it before the client call on Friday, quite urgent."',
    extracted: {
      title: 'Prepare Revenue Analytics for Crestwood',
      description: 'Prepare revenue analytics for Crestwood Logistics ahead of the client call.',
      engagement: 'Crestwood Logistics Review',
      priority: PRIORITY.HIGH,
      dueOffset: 3
    }
  },
  {
    source: SOURCE.OUTLOOK,
    sourceMessage:
      'From: finance@meridian.com\nSubject: Loan covenant schedule\n\n"Could you prepare the loan covenant compliance schedule for our review? No rush, sometime in the next couple of weeks is fine."',
    extracted: {
      title: 'Prepare Loan Covenant Compliance Schedule',
      description: 'Prepare the loan covenant compliance schedule for Meridian Bank review.',
      engagement: 'Meridian Bank Statutory Audit',
      priority: PRIORITY.LOW,
      dueOffset: 12
    }
  },
  {
    source: SOURCE.TEAMS,
    sourceMessage:
      'Teams — Cheryl Tan:\n"We need the going concern assessment updated for Summit Retail by Wednesday please."',
    extracted: {
      title: 'Update Going Concern Assessment',
      description: 'Update the going concern assessment for Summit Retail Group.',
      engagement: 'Summit Retail Group FY25',
      priority: PRIORITY.HIGH,
      dueOffset: 2
    }
  },
  {
    // Deliberately ambiguous: no clear deadline and lower confidence so the UI
    // can demonstrate "missing / uncertain information" highlighting.
    source: SOURCE.OUTLOOK,
    sourceMessage:
      'From: client@summit-retail.com\nSubject: Quick favour\n\n"Hi, when you get a chance could you take a look at the stock count variances? Not sure of the exact timing yet, we will confirm."',
    extracted: {
      title: 'Review Stock Count Variances',
      description: 'Review the stock count variances raised by the Summit Retail finance team.',
      engagement: 'Summit Retail Group FY25',
      priority: PRIORITY.MEDIUM,
      dueOffset: null, // AI could not determine a deadline
      lowConfidence: true
    }
  }
]

let msgIndex = 0

/**
 * Simulate an incoming message and AI extraction. Returns a suggestion object
 * whose `extracted` fields feed an auto-created task. `dueDate` may be null if
 * AI could not confidently determine a deadline (flagged as missing).
 */
export function extractTaskFromMessage(staffIds) {
  const pick = MESSAGE_BANK[msgIndex % MESSAGE_BANK.length]
  msgIndex += 1

  const assigneeId = staffIds[Math.floor(Math.random() * staffIds.length)]
  const hasDue = pick.extracted.dueOffset != null

  return {
    id: `s-${Date.now()}`,
    source: pick.source,
    sourceMessage: pick.sourceMessage,
    isActionable: true,
    confidence: pick.extracted.lowConfidence
      ? 0.6 + Math.random() * 0.1
      : 0.85 + Math.random() * 0.12,
    extracted: {
      title: pick.extracted.title,
      description: pick.extracted.description,
      assigneeId,
      engagement: pick.extracted.engagement,
      // When no deadline is detected, default to +7 days but still flag it as
      // missing so the user is prompted to confirm.
      dueDate: hasDue ? relativeDay(pick.extracted.dueOffset) : relativeDay(7),
      dueDateMissing: !hasDue,
      priority: pick.extracted.priority
    },
    status: 'pending',
    createdAt: new Date().toISOString()
  }
}
