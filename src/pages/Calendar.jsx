import { useState } from 'react'

const pad = n => String(n).padStart(2, '0')

const MONTH_NAMES = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
]
const DOW_NAMES = ['อา','จ','อ','พ','พฤ','ศ','ส']

function ctStatus(t) {
  if (t.done) return 'done'
  const diff = new Date(t.date + 'T' + t.time + ':00') - Date.now()
  if (diff <= 0) return 'overdue'
  if (diff < 86400000) return 'soon'
  return 'future'
}

function buildEvMap(ctTasks, todos) {
  const evMap = {}
  ctTasks.forEach(t => {
    if (!evMap[t.date]) evMap[t.date] = []
    evMap[t.date].push({
      type: 'countdown', name: t.name, time: t.time,
      done: t.done, status: ctStatus(t),
    })
  })
  todos.forEach(t => {
    if (t.dueDate) {
      if (!evMap[t.dueDate]) evMap[t.dueDate] = []
      evMap[t.dueDate].push({
        type: 'todo', name: t.name, priority: t.priority, done: t.done,
      })
    }
  })
  return evMap
}

export default function Calendar({ ctTasks, todos }) {
  const now = new Date()
  const [calYear,         setCalYear]         = useState(now.getFullYear())
  const [calMonth,        setCalMonth]        = useState(now.getMonth())
  const [calSelectedDate, setCalSelectedDate] = useState(now.toISOString().slice(0, 10))

  function calPrev() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else { setCalMonth(m => m - 1) }
  }
  function calNext() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else { setCalMonth(m => m + 1) }
  }
  function calToday() {
    const n = new Date()
    setCalYear(n.getFullYear())
    setCalMonth(n.getMonth())
    setCalSelectedDate(n.toISOString().slice(0, 10))
  }

  const today  = new Date().toISOString().slice(0, 10)
  const evMap  = buildEvMap(ctTasks, todos)
  const first  = new Date(calYear, calMonth, 1)
  const last   = new Date(calYear, calMonth + 1, 0)
  const startDow = first.getDay()

  // Build 42 cells
  const cells = []
  // prev month padding
  for (let i = 0; i < startDow; i++) {
    const d = new Date(calYear, calMonth, -startDow + i + 1)
    cells.push({ dateStr: d.toISOString().slice(0, 10), dayNum: d.getDate(), otherMonth: true })
  }
  // this month
  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`
    cells.push({ dateStr, dayNum: d, otherMonth: false })
  }
  // next month padding
  const remaining = 42 - startDow - last.getDate()
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(calYear, calMonth + 1, i)
    cells.push({ dateStr: d.toISOString().slice(0, 10), dayNum: i, otherMonth: true })
  }

  // Detail panel
  const selEvs    = evMap[calSelectedDate] || []
  const selDate   = new Date(calSelectedDate + 'T00:00:00')
  const selTitle  = selDate.toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const DOT_COLORS = {
    countdown: 'var(--lime)',
    overdue:   'var(--red)',
    todo:      'var(--blue)',
  }

  return (
    <div className="page">
      <div className="card" style={{ padding: '1rem' }}>
        {/* Header */}
        <div className="cal-header">
          <button className="btn btn-sm" onClick={calPrev}>‹</button>
          <div className="cal-title">{MONTH_NAMES[calMonth]} {calYear + 543}</div>
          <button className="btn btn-sm" onClick={calNext}>›</button>
          <button className="btn btn-sm" onClick={calToday}>วันนี้</button>
        </div>

        {/* Day-of-week headers */}
        <div className="cal-grid">
          {DOW_NAMES.map(d => (
            <div key={d} className="cal-dow">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="cal-grid">
          {cells.map(({ dateStr, dayNum, otherMonth }) => {
            const isToday    = dateStr === today
            const isSelected = dateStr === calSelectedDate
            const evs        = evMap[dateStr] || []

            const cls = [
              'cal-day',
              otherMonth  ? 'other-month' : '',
              isToday     ? 'today'       : '',
              isSelected  ? 'selected'    : '',
            ].filter(Boolean).join(' ')

            return (
              <div
                key={dateStr}
                className={cls}
                onClick={() => setCalSelectedDate(dateStr)}
              >
                <div className="cal-day-num">{dayNum}</div>
                <div className="cal-dots">
                  {evs.map((e, i) => {
                    const dotCls = e.type === 'todo'
                      ? 'todo'
                      : (e.status === 'overdue' ? 'overdue' : 'countdown')
                    return <div key={i} className={`cal-dot ${dotCls}`}></div>
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="cal-detail">
        <div className="cal-detail-title">{selTitle}</div>
        {selEvs.length === 0 ? (
          <div className="empty" style={{ padding: '1rem' }}>ไม่มีกิจกรรมวันนี้</div>
        ) : (
          selEvs.map((e, i) => {
            const dotKey = e.type === 'countdown'
              ? (e.status === 'overdue' ? 'overdue' : 'countdown')
              : 'todo'
            const extra = e.type === 'countdown'
              ? (e.time || '')
              : ({ high: '🔴', medium: '🟡', low: '🔵' }[e.priority] || '')

            return (
              <div
                key={i}
                className="cal-event"
                style={e.done ? { opacity: 0.4 } : {}}
              >
                <div
                  className="cal-event-dot"
                  style={{ background: DOT_COLORS[dotKey] }}
                ></div>
                <div
                  className="cal-event-name"
                  style={e.done ? { textDecoration: 'line-through' } : {}}
                >{e.name}</div>
                <div className="cal-event-time">{extra}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
