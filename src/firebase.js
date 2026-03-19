import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyACZn9LwIOp8Jnq1-_0bHXmGSsQdIUW7Es",
  authDomain:        "timer-532d0.firebaseapp.com",
  projectId:         "timer-532d0",
  storageBucket:     "timer-532d0.firebasestorage.app",
  messagingSenderId: "586491723623",
  appId:             "1:586491723623:web:40724bda506455d84bf9c2"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)
