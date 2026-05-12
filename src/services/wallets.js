import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, orderBy, query, increment,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export const walletsRef = (uid) =>
  collection(db, 'users', uid, 'wallets')

export const addWallet = (uid, data) =>
  addDoc(walletsRef(uid), data)

export const updateWallet = (uid, id, data) =>
  updateDoc(doc(db, 'users', uid, 'wallets', id), data)

export const deleteWallet = (uid, id) =>
  deleteDoc(doc(db, 'users', uid, 'wallets', id))

// Adjusts wallet balance atomically (positive = add, negative = subtract)
export const adjustWalletBalance = (uid, walletId, delta) =>
  updateDoc(doc(db, 'users', uid, 'wallets', walletId), {
    balance: increment(delta),
  })

export const useWallets = (uid) => {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(walletsRef(uid), orderBy('name'))
    const unsub = onSnapshot(q, snap => {
      setWallets(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { wallets, loading }
}
