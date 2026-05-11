import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export const transactionsRef = (uid) =>
  collection(db, 'users', uid, 'transactions')

export const addTransaction = (uid, data) =>
  addDoc(transactionsRef(uid), { ...data, createdAt: serverTimestamp() })

export const updateTransaction = (uid, id, data) =>
  updateDoc(doc(db, 'users', uid, 'transactions', id), data)

export const deleteTransaction = (uid, id) =>
  deleteDoc(doc(db, 'users', uid, 'transactions', id))

export const useTransactions = (uid, filters = {}) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    let q = query(transactionsRef(uid), orderBy('date', 'desc'))
    if (filters.categoryId)
      q = query(q, where('categoryId', '==', filters.categoryId))
    if (filters.type)
      q = query(q, where('type', '==', filters.type))

    const unsub = onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [uid, filters.categoryId, filters.type])

  return { transactions, loading }
}
