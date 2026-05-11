import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../services/auth'
import useAppStore from '../../store/useAppStore'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { setUser, setUserDoc } = useAppStore()

  useEffect(() => {
    setUser(user)
    if (!user) {
      setUserDoc(null)
      return
    }
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) setUserDoc(snap.data())
    })
    return unsub
  }, [user, setUser, setUserDoc])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-brand-bg">
        <div className="w-8 h-8 border-2 border-brand-violet border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}
