import { useState } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const SECTIONS = [
  { key: 'inbox',    label: '📥 Inbox' },
  { key: 'work',     label: '💼 งาน' },
  { key: 'personal', label: '🏠 ส่วนตัว' },
]

export default function Todo({ todos, uid }) {
  const [tdName,     setTdName]     = useState('')
  const [tdNote,     setTdNote]     = useState('')
  const [tdPriority, setTdPriority] = useState('medium')
  const [tdSection,  setTdSection]  = useState('inbox')

  const tdCol = () => collection(db, 'users', uid, 'todos')

  async function addTodo() {
    if (!tdName.trim()) return
    await addDoc(tdCol(), {
      name:      tdName.trim(),
      note:      tdNote.trim(),
      priority:  tdPriority,
      section:   tdSection,
      done:      false,
      createdAt: Date.now(),
    })
    setTdName('')
    setTdNote('')
  }

  async function toggleTD(id) {
    const t = todos.find(x => x.id === id)
    if (t) await updateDoc(doc(db, 'users', uid, 'todos', id), { done: !t.done })
  }

  async function delTD(id) {
    await deleteDoc(doc(db, 'users', uid, 'todos', id))
  }

  return (
    <div className="page">
      {/* Add form */}
      <div className="card">
        <div className="section-title">เพิ่มงานใหม่</div>
        <div className="form-row">
          <input
            type="text"
            className="flex1"
            placeholder="ชื่องาน..."
            value={tdName}
            onChange={e => setTdName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            style={{ height: '38px' }}
          />
          <select
            value={tdPriority}
            onChange={e => setTdPriority(e.target.value)}
            style={{ height: '38px', width: '110px', padding: '0 10px' }}
          >
            <option value="high">🔴 สำคัญ</option>
            <option value="medium">🟡 ปานกลาง</option>
            <option value="low">🔵 ต่ำ</option>
          </select>
        </div>
        <div className="form-row">
          <input
            type="text"
            className="flex1"
            placeholder="หมายเหตุ (ไม่บังคับ)..."
            value={tdNote}
            onChange={e => setTdNote(e.target.value)}
            style={{ height: '38px' }}
          />
          <select
            value={tdSection}
            onChange={e => setTdSection(e.target.value)}
            style={{ height: '38px', flex: 1, padding: '0 10px', minWidth: '120px' }}
          >
            <option value="inbox">📥 Inbox</option>
            <option value="work">💼 งาน</option>
            <option value="personal">🏠 ส่วนตัว</option>
          </select>
          <button className="btn btn-lime" onClick={addTodo}>+ เพิ่ม</button>
        </div>
      </div>

      {/* Sections */}
      <div className="todo-sections">
        {SECTIONS.map(sec => {
          const items = todos.filter(t => (t.section || 'inbox') === sec.key)
          const done  = items.filter(t => t.done).length
          const pct   = items.length ? Math.round((done / items.length) * 100) : 0

          return (
            <div key={sec.key} className="card">
              <div className="todo-section-header">
                <div className="todo-section-name">{sec.label}</div>
                <div className="todo-count">{done}/{items.length}</div>
              </div>

              {items.length === 0 && (
                <div className="empty" style={{ padding: '1rem 0' }}>ยังไม่มีงาน</div>
              )}

              {items.map(t => (
                <div
                  key={t.id}
                  className={`todo-item${t.done ? ' done-item' : ''}`}
                >
                  <div className={`priority-dot p-${t.priority || 'medium'}`}></div>
                  <div
                    className={`chk${t.done ? ' checked' : ''}`}
                    onClick={() => toggleTD(t.id)}
                  >{t.done ? '✓' : ''}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="todo-text">{t.name}</div>
                    {t.note && <div className="todo-note">{t.note}</div>}
                  </div>
                  <div className="todo-acts">
                    <button
                      className="btn-icon del"
                      onClick={() => delTD(t.id)}
                    >✕</button>
                  </div>
                </div>
              ))}

              {items.length > 0 && (
                <div className="progress-wrap">
                  <div className="progress-fill" style={{ width: `${pct}%` }}></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
