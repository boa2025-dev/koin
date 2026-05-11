import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export const budgetsRef = (uid) =>
  collection(db, 'users', uid, 'budgets')

export const addBudget = (uid, data) =>
  addDoc(budgetsRef(uid), data)

export const updateBudget = (uid, id, data) =>
  updateDoc(doc(db, 'users', uid, 'budgets', id), data)

export const deleteBudget = (uid, id) =>
  deleteDoc(doc(db, 'users', uid, 'budgets', id))

export const useBudgets = (uid, month) => {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid || !month) return
    const q = query(budgetsRef(uid), where('month', '==', month))
    const unsub = onSnapshot(q, snap => {
      setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [uid, month])

  return { budgets, loading }
}
