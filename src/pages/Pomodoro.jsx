import { useState, useEffect, useRef } from 'react'

const pad = n => String(n).padStart(2, '0')
const RING_CIRC = 2 * Math.PI * 88 // ≈ 553

const DEFAULT_MODES = {
  focus25: { focus: 25, break: 5 },
  focus50: { focus: 50, break: 10 },
  custom:  { focus: 25, break: 5 },
}

function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)
  } catch (e) {}
}

function loadLog() {
  return JSON.parse(localStorage.getItem('pomo_log_' + new Date().toDateString()) || '[]')
}
function saveLog(log) {
  localStorage.setItem('pomo_log_' + new Date().toDateString(), JSON.stringify(log))
}

export default function Pomodoro() {
  const [pomoMode,      setPomoMode]      = useState('focus25')
  const [pomoPhase,     setPomoPhase]     = useState('focus')
  const [pomoTotal,     setPomoTotal]     = useState(25 * 60)
  const [pomoLeft,      setPomoLeft]      = useState(25 * 60)
  const [pomoRunning,   setPomoRunning]   = useState(false)
  const [pomoRounds,    setPomoRounds]    = useState(0)
  const [pomoFocusMins, setPomoFocusMins] = useState(0)
  const [pomoStreak,    setPomoStreak]    = useState(0)
  const [pomoLog,       setPomoLog]       = useState(loadLog)
  const [customFocus,   setCustomFocus]   = useState(25)
  const [customBreak,   setCustomBreak]   = useState(5)
  const [modes,         setModes]         = useState(DEFAULT_MODES)

  const timerRef    = useRef(null)
  const phaseRef    = useRef(pomoPhase)
  const totalRef    = useRef(pomoTotal)
  const leftRef     = useRef(pomoLeft)
  const roundsRef   = useRef(pomoRounds)
  const focusMRef   = useRef(pomoFocusMins)
  const streakRef   = useRef(pomoStreak)
  const logRef      = useRef(pomoLog)
  const modesRef    = useRef(modes)
  const modeRef     = useRef(pomoMode)

  // Keep refs in sync
  useEffect(() => { phaseRef.current  = pomoPhase  }, [pomoPhase])
  useEffect(() => { totalRef.current  = pomoTotal  }, [pomoTotal])
  useEffect(() => { leftRef.current   = pomoLeft   }, [pomoLeft])
  useEffect(() => { roundsRef.current = pomoRounds }, [pomoRounds])
  useEffect(() => { focusMRef.current = pomoFocusMins }, [pomoFocusMins])
  useEffect(() => { streakRef.current = pomoStreak }, [pomoStreak])
  useEffect(() => { logRef.current    = pomoLog    }, [pomoLog])
  useEffect(() => { modesRef.current  = modes      }, [modes])
  useEffect(() => { modeRef.current   = pomoMode   }, [pomoMode])

  // Request notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  function phaseEnd() {
    clearInterval(timerRef.current)
    timerRef.current = null

    const phase = phaseRef.current
    const dur   = modesRef.current[modeRef.current]
    const now   = new Date()
    const timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes())

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(phase === 'focus' ? '⏰ หมดเวลาโฟกัส! พักได้แล้ว' : '✅ หมดเวลาพัก! โฟกัสต่อ')
    }
    playBeep()

    let newRounds    = roundsRef.current
    let newFocusMins = focusMRef.current
    let newStreak    = streakRef.current
    let newLog       = [...logRef.current]

    if (phase === 'focus') {
      newRounds    = roundsRef.current + 1
      newFocusMins = focusMRef.current + dur.focus
      newStreak    = streakRef.current + 1
      newLog = [{ phase: 'focus', mins: dur.focus, time: timeStr }, ...newLog]
    } else {
      newLog = [{ phase: 'break', mins: dur.break, time: timeStr }, ...newLog]
    }

    saveLog(newLog)
    setPomoRounds(newRounds)
    setPomoFocusMins(newFocusMins)
    setPomoStreak(newStreak)
    setPomoLog(newLog)

    const nextPhase = phase === 'focus' ? 'break' : 'focus'
    const nextTotal = (nextPhase === 'focus' ? dur.focus : dur.break) * 60

    setPomoPhase(nextPhase)
    setPomoTotal(nextTotal)
    setPomoLeft(nextTotal)
    setPomoRunning(false)
  }

  function startTimer() {
    if (timerRef.current) return
    setPomoRunning(true)
    timerRef.current = setInterval(() => {
      setPomoLeft(prev => {
        if (prev <= 1) {
          phaseEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopTimer() {
    clearInterval(timerRef.current)
    timerRef.current = null
    setPomoRunning(false)
  }

  function pomoToggle() {
    if (pomoRunning) {
      stopTimer()
    } else {
      startTimer()
    }
  }

  function resetTimer(newPhase, newTotal) {
    stopTimer()
    const ph = newPhase !== undefined ? newPhase : 'focus'
    const tot = newTotal !== undefined ? newTotal : modesRef.current[modeRef.current].focus * 60
    setPomoPhase(ph)
    setPomoTotal(tot)
    setPomoLeft(tot)
  }

  function pomoReset() {
    resetTimer('focus', modesRef.current[modeRef.current].focus * 60)
  }

  function pomoSkip() {
    stopTimer()
    phaseEnd()
  }

  function handleSetMode(m) {
    setPomoMode(m)
    modeRef.current = m
    stopTimer()
    if (m !== 'custom') {
      const dur = modes[m]
      setPomoPhase('focus')
      setPomoTotal(dur.focus * 60)
      setPomoLeft(dur.focus * 60)
    }
  }

  function applyCustom() {
    const f = Math.min(120, Math.max(1, parseInt(customFocus) || 25))
    const b = Math.min(60,  Math.max(1, parseInt(customBreak) || 5))
    const newModes = { ...modes, custom: { focus: f, break: b } }
    setModes(newModes)
    modesRef.current = newModes
    stopTimer()
    setPomoPhase('focus')
    setPomoTotal(f * 60)
    setPomoLeft(f * 60)
  }

  function clearPomoLog() {
    saveLog([])
    setPomoLog([])
  }

  // Ring calculation
  const pct    = pomoTotal > 0 ? pomoLeft / pomoTotal : 1
  const offset = (RING_CIRC * (1 - pct)).toFixed(2)
  const ringColor   = pomoPhase === 'focus' ? 'var(--lime)' : 'var(--amber)'
  const phaseLabel  = pomoPhase === 'focus' ? 'โฟกัส' : 'พักผ่อน'
  const phaseColor  = pomoPhase === 'focus' ? 'var(--lime)' : 'var(--amber)'
  const timeColor   = pomoPhase === 'focus' ? 'var(--text)' : 'var(--amber)'
  const roundLabel  = 'รอบที่ ' + (pomoRounds + (pomoPhase === 'focus' ? 1 : 0))
  const timeDisplay = pad(Math.floor(pomoLeft / 60)) + ':' + pad(pomoLeft % 60)
  const playLabel   = pomoRunning ? 'หยุด' : (pomoLeft < pomoTotal && pomoLeft > 0 ? 'ต่อ' : 'เริ่ม')

  return (
    <div className="page">
      <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>

        {/* Mode selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            className={`pomo-mode-btn${pomoMode === 'focus25' ? ' active' : ''}`}
            onClick={() => handleSetMode('focus25')}
          >25 / 5</button>
          <button
            className={`pomo-mode-btn${pomoMode === 'focus50' ? ' active' : ''}`}
            onClick={() => handleSetMode('focus50')}
          >50 / 10</button>
          <button
            className={`pomo-mode-btn${pomoMode === 'custom' ? ' active' : ''}`}
            onClick={() => handleSetMode('custom')}
          >กำหนดเอง</button>
        </div>

        {/* Custom inputs */}
        {pomoMode === 'custom' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>โฟกัส</span>
              <input
                type="number"
                value={customFocus}
                min="1" max="120"
                onChange={e => setCustomFocus(e.target.value)}
                style={{ width: '64px', height: '34px', textAlign: 'center' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>น.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>พัก</span>
              <input
                type="number"
                value={customBreak}
                min="1" max="60"
                onChange={e => setCustomBreak(e.target.value)}
                style={{ width: '64px', height: '34px', textAlign: 'center' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>น.</span>
            </div>
            <button className="btn btn-sm" onClick={applyCustom}>ตั้งค่า</button>
          </div>
        )}

        {/* Phase label */}
        <div style={{
          fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase',
          color: phaseColor, marginBottom: '1rem',
        }}>
          {phaseLabel}
        </div>

        {/* Ring timer */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" fill="none" stroke="var(--b1)" strokeWidth="8" />
            <circle
              cx="100" cy="100" r="88" fill="none"
              stroke={ringColor} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={RING_CIRC.toFixed(0)}
              strokeDashoffset={offset}
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: '44px', fontWeight: 400,
              letterSpacing: '-0.02em', lineHeight: 1, color: timeColor,
            }}>
              {timeDisplay}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              {roundLabel}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <button
            className="btn"
            onClick={pomoReset}
            style={{ width: '44px', height: '44px', padding: 0, fontSize: '16px' }}
          >↺</button>
          <button
            onClick={pomoToggle}
            style={{
              width: '80px', height: '44px', borderRadius: '22px', border: 'none',
              background: 'var(--lime)', color: 'var(--lime-text)',
              fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
          >{playLabel}</button>
          <button
            className="btn"
            onClick={pomoSkip}
            style={{ width: '44px', height: '44px', padding: 0, fontSize: '16px' }}
          >⏭</button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <div className="pomo-stat-box">
            <div className="pomo-stat-val">{pomoRounds}</div>
            <div className="pomo-stat-lbl">รอบโฟกัส</div>
          </div>
          <div className="pomo-stat-box">
            <div className="pomo-stat-val">{pomoFocusMins}</div>
            <div className="pomo-stat-lbl">นาทีโฟกัส</div>
          </div>
          <div className="pomo-stat-box">
            <div className="pomo-stat-val">{pomoStreak}</div>
            <div className="pomo-stat-lbl">ติดต่อกัน</div>
          </div>
        </div>
      </div>

      {/* Session log */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div className="section-title" style={{ margin: 0 }}>ประวัติวันนี้</div>
          <button className="btn btn-sm" onClick={clearPomoLog}>ล้าง</button>
        </div>
        {pomoLog.length === 0 ? (
          <div className="empty" style={{ padding: '1rem 0' }}>ยังไม่มีประวัติ</div>
        ) : (
          pomoLog.slice(0, 20).map((l, i) => (
            <div key={i} className="pomo-log-item">
              <div
                className="pomo-log-dot"
                style={{ background: l.phase === 'focus' ? 'var(--lime)' : 'var(--amber)' }}
              ></div>
              <div style={{ flex: 1 }}>
                {l.phase === 'focus' ? `โฟกัส ${l.mins} นาที` : `พัก ${l.mins} นาที`}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' }}>
                {l.time}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
