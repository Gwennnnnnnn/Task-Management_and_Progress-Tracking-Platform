// Interactive monthly/weekly calendar. Shows task deadline indicators, flags
// overdue tasks and lets the user select a day to see (and open) its tasks.
// Uses the same shared task data as the task lists.

import { useState, useMemo } from 'react'
import { STATUS } from '../../data/mockData.js'
import { SINGAPORE_PUBLIC_HOLIDAYS } from '../../data/singaporePublicHolidays.js'
import { isOverdue } from '../../services/taskService.js'
import { PriorityBadge, StatusBadge } from '../Badge.jsx'
import { IconChevronLeft, IconChevronRight } from '../Icons.jsx'
import './Calendar.css'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function ymd(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromYmd(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function shortTaskTitle(title) {
  const words = title.trim().split(/\s+/)
  const shortTitle = words.slice(0, 5).join(' ')
  return words.length > 5 ? `${shortTitle}…` : shortTitle
}

export default function Calendar({ tasks, onOpen }) {
  const [view, setView] = useState('month') // month | week
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState(() => ymd(new Date()))

  // Map of yyyy-mm-dd -> tasks due that day.
  const byDay = useMemo(() => {
    const map = {}
    tasks.forEach((t) => {
      const key = t.dueDate.slice(0, 10)
      ;(map[key] ||= []).push(t)
    })
    return map
  }, [tasks])

  const holidaysByDay = useMemo(() => {
    const map = {}
    SINGAPORE_PUBLIC_HOLIDAYS.forEach((holiday) => {
      ;(map[holiday.date] ||= []).push(holiday)
    })
    return map
  }, [])

  const days = useMemo(() => {
    if (view === 'week') return weekDays(cursor)
    return monthDays(cursor)
  }, [view, cursor])

  const monthLabel = cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const selectedTasks = byDay[selected] || []
  const selectedHolidays = holidaysByDay[selected] || []

  function shift(dir) {
    const next = new Date(cursor)
    if (view === 'month') next.setMonth(next.getMonth() + dir)
    else next.setDate(next.getDate() + dir * 7)
    setCursor(next)
  }

  const todayKey = ymd(new Date())

  return (
    <div className="calendar card">
      <div className="cal-head">
        <div className="row gap-8">
          <button className="cal-nav" onClick={() => shift(-1)} aria-label="Previous">
            <IconChevronLeft size={18} />
          </button>
          <strong className="cal-month">{monthLabel}</strong>
          <button className="cal-nav" onClick={() => shift(1)} aria-label="Next">
            <IconChevronRight size={18} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setCursor(new Date()); setSelected(todayKey) }}>
            Today
          </button>
        </div>
        <div className="cal-view-toggle">
          <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
        </div>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className={`cal-grid ${view}`}>
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="cal-cell empty" />
          const key = ymd(day)
          const dayTasks = byDay[key] || []
          const dayHolidays = holidaysByDay[key] || []
          const hasOverdue = dayTasks.some((t) => isOverdue(t))
          const isToday = key === todayKey
          const isSel = key === selected
          return (
            <button
              key={key}
              className={`cal-cell ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''} ${hasOverdue ? 'has-overdue' : ''} ${dayHolidays.length ? 'has-holiday' : ''}`}
              onClick={() => setSelected(key)}
              aria-label={`${day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}${dayHolidays.length ? `, ${dayHolidays.map((holiday) => holiday.name).join(', ')}` : ''}${dayTasks.length ? `, ${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'}` : ''}`}
              title={dayHolidays.map((holiday) => holiday.name).join(', ')}
            >
              <span className="cal-date">{day.getDate()}</span>
              {dayHolidays.length > 0 && (
                <span className="cal-holiday-label">{dayHolidays[0].name}</span>
              )}
              {dayTasks.length > 0 && (
                <span className="cal-task-previews">
                  {dayTasks.slice(0, 2).map((task) => (
                    <span
                      key={task.id}
                      className={`cal-task-preview ${isOverdue(task) ? 'overdue' : task.status === STATUS.COMPLETED ? 'completed' : ''}`}
                      title={task.title}
                    >
                      {shortTaskTitle(task.title)}
                    </span>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="cal-more">+{dayTasks.length - 2} more</span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="cal-selected">
        <div className="row between">
          <strong>
            {dateFromYmd(selected).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </strong>
          <span className="text-xs muted">
            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
        {selectedHolidays.length > 0 && (
          <ul className="cal-holiday-list" aria-label="Singapore public holidays">
            {selectedHolidays.map((holiday) => (
              <li key={`${holiday.date}-${holiday.name}`}>
                <span className="cal-holiday-marker" aria-hidden="true" />
                <span>{holiday.name}</span>
                <span className="cal-holiday-kind">Singapore public holiday</span>
              </li>
            ))}
          </ul>
        )}
        {selectedTasks.length === 0 && selectedHolidays.length === 0 ? (
          <p className="text-sm muted" style={{ margin: '10px 0 0' }}>No deadlines on this day.</p>
        ) : selectedTasks.length > 0 && (
          <ul className="cal-task-list">
            {selectedTasks.map((t) => (
              <li key={t.id} onClick={() => onOpen(t.id)} className={isOverdue(t) ? 'overdue' : ''}>
                <div className="row between gap-8">
                  <span className="strong text-sm">{t.title}</span>
                  <PriorityBadge value={t.priority} />
                </div>
                <div className="row gap-8" style={{ marginTop: 6 }}>
                  <StatusBadge value={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ---- Date grid builders ----------------------------------------------------

function monthDays(cursor) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  // Monday-first offset.
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

function weekDays(cursor) {
  const d = new Date(cursor)
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d)
    day.setDate(d.getDate() + i)
    return day
  })
}
