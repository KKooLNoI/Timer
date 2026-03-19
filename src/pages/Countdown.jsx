import { useState, useEffect, useRef } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const pad = n => String(n).padStart(2, '0')

function ctStatus(t) {
  if (t.done) return 'done'
  const diff = new Date(t.date + 'T' + t.time + ':00') - Date.now()
  if (diff <= 0) return 'overdue'
  if (diff < 86400000) return 'soon'
  return 'future'
}

function buildCdParts(t) {
  const diff = new Date(t.date + 'T' + t.time + ':00') - Date.now()
  const abs  = Math.floor(Math.abs(diff) / 1000)
  const days = Math.floor(abs / 86400)
  const hrs  = Math.floor((abs % 86400) / 3600)
  const mins = Math.floor((abs % 3600) / 60)
  const secs = abs % 60
  return { days, hrs, mins, secs }
}

function CountdownDisplay({ t }) {
  const s  = ctStatus(t)
  const cc = t.done ? 'color-done' : 'color-' + s
  const { days, hrs, mins, secs } = buildCdParts(t)

  return (
    <div className={`cd-row ${cc}`}>
      {days >= 1 ? (
        <>
          <span className="cd-num">{days}</span><span className="cd-unit">วัน</span>
          <span className="cd-sep">:</span>
          <span className="cd-num">{pad(hrs)}</span><span className="cd-unit">ชม.</span>
          <span className="cd-sep">:</span>
          <span className="cd-num">{pad(mins)}</span><span className="cd-unit">น.</span>
        </>
      ) : (
        <>
          <span className="cd-num">{pad(hrs)}</span><span className="cd-unit">ชม.</span>
          <span className="cd-sep">:</span>
          <span className="cd-num">{pad(mins)}</span><span className="cd-unit">น.</span>
          <span className="cd-sep">:</span>
          <span className="cd-num">{pad(secs)}</span><span className="cd-unit">ว.</span>
        </>
      )}
    </div>
  )
}

function CountdownMeta({ t }) {
  const s = ctStatus(t)
  if (t.done) {
    return <span className="tag tag-gray">✓ เสร็จแล้ว</span>
  }
  const target  = new Date(t.date + 'T' + t.time + ':00')
  const dateStr = target.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = pad(target.getHours()) + ':' + pad(target.getMinutes()) + ' น.'

  let badge
  if (s === 'overdue') {
    badge = <span className="tag tag-red">⚠ เลยกำหนด</span>
  } else if (s === 'soon') {
    badge = <span className="tag tag-amber"><span className="dot-pulse"></span>ใกล้ครบ</span>
  } else {
    badge = <span className="tag tag-lime"><span className="dot-pulse"></span>กำลังนับ</span>
  }

  return (
    <>
      {badge}
      <span className="tag tag-gray">{dateStr} {timeStr}</span>
    </>
  )
}

export default function Countdown({ ctTasks, uid }) {
  const today = new Date().toISOString().slice(0, 10)
  const [ctName,   setCtName]   = useState('')
  const [ctDate,   setCtDate]   = useState(today)
  const [ctTime,   setCtTime]   = useState('09:00')
  const [ctFilter, setCtFilter] = useState('all')
  const [ctEditId, setCtEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [, forceUpdate] = useState(0)

  // Tick every second for live countdown
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const ctCol = () => collection(db, 'users', uid, 'countdowns')

  async function addCountdown() {
    if (!ctName.trim() || !ctDate) return
    await addDoc(ctCol(), {
      name: ctName.trim(),
      date: ctDate,
      time: ctTime || '09:00',
      done: false,
      createdAt: Date.now(),
    })
    setCtName('')
    setCtDate(today)
  }

  async function toggleCT(id) {
    const t = ctTasks.find(x => x.id === id)
    if (t) await updateDoc(doc(db, 'users', uid, 'countdowns', id), { done: !t.done })
  }

  async function delCT(id) {
    await deleteDoc(doc(db, 'users', uid, 'countdowns', id))
  }

  function startEdit(t) {
    setCtEditId(t.id)
    setEditName(t.name)
    setEditDate(t.date)
    setEditTime(t.time)
  }

  function cancelEdit() {
    setCtEditId(null)
  }

  async function saveCTEdit(id) {
    const upd = {}
    if (editName.trim()) upd.name = editName.trim()
    if (editDate) upd.date = editDate
    if (editTime) upd.time = editTime
    await updateDoc(doc(db, 'users', uid, 'countdowns', id), upd)
    setCtEditId(null)
  }

  // Summary counts
  const cnt = { future: 0, soon: 0, overdue: 0, done: 0 }
  ctTasks.forEach(t => { cnt[ctStatus(t)]++ })

  const filtered = ctTasks.filter(t => {
    const s = ctStatus(t)
    if (ctFilter === 'all')      return true
    if (ctFilter === 'upcoming') return s === 'future'
    if (ctFilter === 'soon')     return s === 'soon'
    if (ctFilter === 'overdue')  return s === 'overdue'
    if (ctFilter === 'done')     return s === 'done'
    return true
  })

  return (
    <div className="page">
      {/* Add form */}
      <div className="card">
        <div className="section-title">เพิ่ม Task ใหม่</div>
        <div className="form-row">
          <input
            type="text"
            className="flex1"
            placeholder="ชื่องาน / กิจกรรม..."
            value={ctName}
            onChange={e => setCtName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCountdown()}
            style={{ height: '38px' }}
          />
        </div>
        <div className="form-row">
          <input
            type="date"
            value={ctDate}
            onChange={e => setCtDate(e.target.value)}
            style={{ flex: 1, minWidth: '130px', height: '38px' }}
          />
          <input
            type="time"
            value={ctTime}
            onChange={e => setCtTime(e.target.value)}
            style={{ width: '110px', height: '38px' }}
          />
          <button className="btn btn-lime" onClick={addCountdown}>+ เพิ่ม</button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="sum-bar">
        <div className="sum-box">
          <div className="sum-val">{ctTasks.length}</div>
          <div className="sum-lbl">ทั้งหมด</div>
        </div>
        <div className="sum-box c-lime">
          <div className="sum-val">{cnt.future + cnt.soon}</div>
          <div className="sum-lbl">ยังไม่ถึง</div>
        </div>
        <div className="sum-box c-amber">
          <div className="sum-val">{cnt.soon}</div>
          <div className="sum-lbl">ใกล้ครบ</div>
        </div>
        <div className="sum-box c-red">
          <div className="sum-val">{cnt.overdue}</div>
          <div className="sum-lbl">เลยกำหนด</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        {[
          { key: 'all',      label: 'ทั้งหมด' },
          { key: 'upcoming', label: 'ยังไม่ถึง' },
          { key: 'soon',     label: 'ใกล้ครบ' },
          { key: 'overdue',  label: 'เลยกำหนด' },
          { key: 'done',     label: 'เสร็จแล้ว' },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-btn${ctFilter === f.key ? ' active' : ''}`}
            onClick={() => setCtFilter(f.key)}
          >{f.label}</button>
        ))}
        <span style={{ flex: 1 }}></span>
        <span style={{ fontSize: '12px', color: 'var(--dim)', fontFamily: 'var(--mono)' }}>
          {filtered.length} รายการ
        </span>
      </div>

      {/* Task list */}
      <div>
        {filtered.length === 0 ? (
          <div className="empty">ไม่มีงานในหมวดนี้</div>
        ) : (
          filtered.map(t => {
            const s       = ctStatus(t)
            const editing = ctEditId === t.id
            return (
              <div
                key={t.id}
                className={`task-card status-${s}${t.done ? ' done' : ''}`}
              >
                <div className="accent"></div>
                <div className="task-body">
                  <div className="task-top">
                    <div
                      className={`chk${t.done ? ' checked' : ''}`}
                      onClick={() => toggleCT(t.id)}
                    >{t.done ? '✓' : ''}</div>
                    <div className="task-name">{t.name}</div>
                    <div className="task-acts">
                      <button
                        className="btn-icon"
                        onClick={() => editing ? cancelEdit() : startEdit(t)}
                      >✎</button>
                      <button
                        className="btn-icon del"
                        onClick={() => delCT(t.id)}
                      >✕</button>
                    </div>
                  </div>

                  {editing && (
                    <div className="edit-row">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        style={{ flex: 1, minWidth: '140px' }}
                        autoFocus
                      />
                      <input
                        type="date"
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        style={{ flex: 1, minWidth: '130px' }}
                      />
                      <input
                        type="time"
                        value={editTime}
                        onChange={e => setEditTime(e.target.value)}
                        style={{ width: '100px' }}
                      />
                      <button
                        className="btn btn-lime btn-sm"
                        onClick={() => saveCTEdit(t.id)}
                      >บันทึก</button>
                    </div>
                  )}

                  <CountdownDisplay t={t} />
                  <div className="task-meta">
                    <CountdownMeta t={t} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
