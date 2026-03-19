import { useState, useEffect } from 'react'

const pad = n => String(n).padStart(2, '0')

export default function Header({ activePage, setActivePage, userEmail, onSignOut }) {
  const [clock, setClock] = useState('')

  useEffect(() => {
    function tick() {
      const n = new Date()
      setClock(pad(n.getHours()) + ':' + pad(n.getMinutes()) + ':' + pad(n.getSeconds()))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const tabs = [
    { key: 'countdown', label: 'Countdown' },
    { key: 'calendar',  label: 'ปฏิทิน' },
    { key: 'todo',      label: 'To-Do' },
    { key: 'pomodoro',  label: 'Pomodoro' },
  ]

  return (
    <div className="app-header">
      <div className="app-logo">MY<em>·</em>PLANNER</div>

      <div className="nav-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`nav-tab${activePage === t.key ? ' active' : ''}`}
            onClick={() => setActivePage(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="header-right">
        <div className="header-clock">{clock}</div>
        <div className="user-email">{userEmail}</div>
        <button className="btn-signout" onClick={onSignOut}>ออก</button>
      </div>
    </div>
  )
}
