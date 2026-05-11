import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, orderBy, query, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export const goalsRef = (uid) =>
  collection(db, 'users', uid, 'goals')

export const addGoal = (uid, data) =>
  addDoc(goalsRef(uid), {
    ...data,
    currentAmount: 0,
    completed: false,
    createdAt: serverTimestamp(),
  })

export const updateGoal = (uid, id, data) =>
  updateDoc(doc(db, 'users', uid, 'goals', id), data)

export const deleteGoal = (uid, id) =>
  deleteDoc(doc(db, 'users', uid, 'goals', id))

export const addGoalContribution = (uid, id, amount, current) =>
  updateDoc(doc(db, 'users', uid, 'goals', id), {
    currentAmount: current + amount,
  })

export const useGoals = (uid) => {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(goalsRef(uid), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { goals, loading }
}
