import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  collection, query, orderBy, onSnapshot,
} from 'firebase/firestore'
import { auth, db } from './firebase.js'

import Auth    from './components/Auth.jsx'
import Header  from './components/Header.jsx'
import Countdown from './pages/Countdown.jsx'
import Calendar  from './pages/Calendar.jsx'
import Pomodoro  from './pages/Pomodoro.jsx'
import Todo      from './pages/Todo.jsx'

export default function App() {
  const [loading,    setLoading]    = useState(true)
  const [user,       setUser]       = useState(null)
  const [activePage, setActivePage] = useState('countdown')
  const [ctTasks,    setCtTasks]    = useState([])
  const [todos,      setTodos]      = useState([])

  useEffect(() => {
    let unsubCT = null
    let unsubTD = null

    const unsubAuth = onAuthStateChanged(auth, u => {
      setLoading(false)
      setUser(u || null)

      if (unsubCT) { unsubCT(); unsubCT = null }
      if (unsubTD) { unsubTD(); unsubTD = null }

      if (u) {
        const ctQ = query(
          collection(db, 'users', u.uid, 'countdowns'),
          orderBy('createdAt', 'desc')
        )
        unsubCT = onSnapshot(ctQ, snap => {
          setCtTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })

        const tdQ = query(
          collection(db, 'users', u.uid, 'todos'),
          orderBy('createdAt', 'desc')
        )
        unsubTD = onSnapshot(tdQ, snap => {
          setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
      } else {
        setCtTasks([])
        setTodos([])
      }
    })

    return () => {
      unsubAuth()
      if (unsubCT) unsubCT()
      if (unsubTD) unsubTD()
    }
  }, [])

  if (loading) {
    return <div className="loading-screen">กำลังโหลด...</div>
  }

  if (!user) {
    return <Auth />
  }

  function handleSignOut() {
    signOut(auth)
  }

  return (
    <>
      <Header
        activePage={activePage}
        setActivePage={setActivePage}
        userEmail={user.email}
        onSignOut={handleSignOut}
      />

      {activePage === 'countdown' && (
        <Countdown ctTasks={ctTasks} uid={user.uid} />
      )}
      {activePage === 'calendar' && (
        <Calendar ctTasks={ctTasks} todos={todos} />
      )}
      {activePage === 'pomodoro' && (
        <Pomodoro />
      )}
      {activePage === 'todo' && (
        <Todo todos={todos} uid={user.uid} />
      )}
    </>
  )
}
