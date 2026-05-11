import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, orderBy, query,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export const categoriesRef = (uid) =>
  collection(db, 'users', uid, 'categories')

export const addCategory = (uid, data) =>
  addDoc(categoriesRef(uid), data)

export const updateCategory = (uid, id, data) =>
  updateDoc(doc(db, 'users', uid, 'categories', id), data)

export const deleteCategory = (uid, id) =>
  deleteDoc(doc(db, 'users', uid, 'categories', id))

export const seedDefaultCategories = async (uid) => {
  const defaults = [
    { name: 'Comida',          icon: 'Utensils',      color: '#FF6B6B', isDefault: true },
    { name: 'Transporte',      icon: 'Bus',           color: '#4ECDC4', isDefault: true },
    { name: 'Educación',       icon: 'BookOpen',      color: '#7C6EFF', isDefault: true },
    { name: 'Entretenimiento', icon: 'Gamepad2',      color: '#F7DC6F', isDefault: true },
    { name: 'Salud',           icon: 'HeartPulse',    color: '#2ECC71', isDefault: true },
    { name: 'Ropa',            icon: 'Shirt',         color: '#E91E63', isDefault: true },
    { name: 'Tecnología',      icon: 'Laptop',        color: '#3498DB', isDefault: true },
    { name: 'Alquiler',        icon: 'Home',          color: '#E67E22', isDefault: true },
    { name: 'Suscripciones',   icon: 'Repeat',        color: '#9B59B6', isDefault: true },
    { name: 'Otros',           icon: 'MoreHorizontal',color: '#95A5A6', isDefault: true },
  ]
  const ref = categoriesRef(uid)
  await Promise.all(defaults.map(cat => addDoc(ref, cat)))
}

export const useCategories = (uid) => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(categoriesRef(uid), orderBy('name'))
    const unsub = onSnapshot(q, snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { categories, loading }
}
