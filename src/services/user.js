import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export const userRef = (uid) => doc(db, 'users', uid)

export const createUserDoc = (uid, data) =>
  setDoc(userRef(uid), {
    ...data,
    currency: 'ARS',
    theme: 'dark',
    onboardingDone: false,
    createdAt: serverTimestamp(),
  }, { merge: true })

export const getUserDoc = (uid) => getDoc(userRef(uid))

export const updateUserDoc = (uid, data) =>
  updateDoc(userRef(uid), data)
