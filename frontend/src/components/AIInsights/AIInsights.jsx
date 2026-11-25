// AI Insights component used on both dashboards. All content is simulated from
// mock task data (see aiService.js) and clearly labelled as such.

import { getStaffInsights, getManagerInsights } from '../../services/aiService.js'
import { PriorityBadge } from '../Badge.jsx'
import { IconSparkle, IconClock, IconAlert, IconInsights } from '../Icons.jsx'
import { dueLabel } from '../../services/taskService.js'
import './AIInsights.css'

const TONE_ICON = { danger: IconAlert, warning: IconClock, info: IconInsights }

// ---- Staff: ranked task recommendations ------------------------------------

export function StaffAIInsights({ tasks, onOpen, limit = 5 }) {
  const recs = getStaffInsights(tasks).slice(0, limit)

  return (
    <div className="ai-panel">
      <div className="ai-panel-head">
        <span className="spark"><IconSparkle size={18} /></span>
        <h3>AI Task Prioritisation</h3>
        <span className="ai-sim-note">Simulated recommendations</span>
      </div>
      <p className="text-sm muted" style={{ margin: '2px 0 0' }}>
        Suggested order of work based on deadlines, urgency, priority and blockers.
      </p>

      <div className="ai-rec-list">
        {recs.length === 0 && (
          <div className="ai-rec"><div className="ai-rec-body text-sm muted">No open tasks to prioritise. Nice work.</div></div>
        )}
        {recs.map((r, i) => (
          <div className="ai-rec" key={r.task.id}>
            <span className="rank">{i + 1}</span>
            <div className="ai-rec-body">
              <div className="ai-rec-title">{r.task.title}</div>
              <div className="ai-rec-expl">{r.explanation}</div>
              <div className="ai-rec-foot">
                <span className="text-xs muted">Suggested priority:</span>
                <PriorityBadge value={r.suggestedPriority} />
                <span className="text-xs muted">· {dueLabel(r.task.dueDate)}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => onOpen(r.task.id)}
                >
                  View task
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Manager: team-level summaries -----------------------------------------

export function ManagerAIInsights({ tasks, teamUsers, onOpen }) {
  const insights = getManagerInsights(tasks, teamUsers)

  return (
    <div className="ai-panel manager-ai-panel">
      <div className="ai-panel-head">
        <span className="spark"><IconSparkle size={18} /></span>
        <h3>AI Team Insights</h3>
        <span className="ai-sim-note">Simulated recommendations</span>
      </div>
      <p className="text-sm muted" style={{ margin: '2px 0 0' }}>
        Summaries computed from your team's live task data.
      </p>

      <div className="ai-rec-list">
        {insights.length === 0 && (
          <div className="ai-insight-card info">
            <div className="ai-insight-detail">Your team is on track — no issues detected.</div>
          </div>
        )}
        {insights.map((ins) => {
          const Icon = TONE_ICON[ins.tone] || IconInsights
          return (
            <div
              className={`ai-insight-card ${ins.tone}`}
              key={ins.id}
              style={{ cursor: ins.taskId ? 'pointer' : 'default' }}
              onClick={() => ins.taskId && onOpen(ins.taskId)}
            >
              <span className="ic"><Icon size={16} /></span>
              <div>
                <div className="ai-insight-title">{ins.title}</div>
                {ins.detail && <div className="ai-insight-detail">{ins.detail}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
