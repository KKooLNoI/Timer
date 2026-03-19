import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../firebase.js'

const ERROR_MSGS = {
  'auth/user-not-found':       'ไม่พบบัญชีนี้',
  'auth/wrong-password':       'รหัสผ่านไม่ถูกต้อง',
  'auth/email-already-in-use': 'อีเมลนี้ถูกใช้แล้ว',
  'auth/invalid-email':        'อีเมลไม่ถูกต้อง',
  'auth/too-many-requests':    'ลองใหม่ในภายหลัง',
  'auth/invalid-credential':   'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
}

export default function Auth() {
  const [authMode, setAuthMode] = useState('login')
  const [email,    setEmail]    = useState('')
  const [pass,     setPass]     = useState('')
  const [pass2,    setPass2]    = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  function switchTab(mode) {
    setAuthMode(mode)
    setError('')
  }

  async function authSubmit() {
    setError('')
    if (!email || !pass) { setError('กรุณากรอกอีเมลและรหัสผ่าน'); return }
    if (authMode === 'register') {
      if (pass !== pass2) { setError('รหัสผ่านไม่ตรงกัน'); return }
      if (pass.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัว'); return }
    }
    setLoading(true)
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, pass)
      } else {
        await createUserWithEmailAndPassword(auth, email, pass)
      }
    } catch (e) {
      setError(ERROR_MSGS[e.code] || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="auth-screen">
      <div className="auth-box">
        <div className="auth-logo">MY<em>·</em>PLANNER</div>
        <div className="auth-sub">จัดการงาน นับถอยหลัง ปฏิทิน</div>

        <div className="auth-tabs">
          <button
            className={`auth-tab${authMode === 'login' ? ' active' : ''}`}
            onClick={() => switchTab('login')}
          >เข้าสู่ระบบ</button>
          <button
            className={`auth-tab${authMode === 'register' ? ' active' : ''}`}
            onClick={() => switchTab('register')}
          >สมัครสมาชิก</button>
        </div>

        {error && <div className="auth-err">{error}</div>}

        <div className="auth-field">
          <label>อีเมล</label>
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label>รหัสผ่าน</label>
          <input
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && authSubmit()}
          />
        </div>

        {authMode === 'register' && (
          <div className="auth-field">
            <label>ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              placeholder="••••••••"
              value={pass2}
              onChange={e => setPass2(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && authSubmit()}
            />
          </div>
        )}

        <button className="btn-full" onClick={authSubmit} disabled={loading}>
          {authMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </button>
      </div>
    </div>
  )
}
