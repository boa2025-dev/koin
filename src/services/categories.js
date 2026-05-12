import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, orderBy, query, getDocs,
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

const EXPENSE_DEFAULTS = [
  { name: 'Comida',          icon: 'Utensils',       color: '#FF6B6B', isDefault: true, type: 'expense' },
  { name: 'Transporte',      icon: 'Bus',            color: '#4ECDC4', isDefault: true, type: 'expense' },
  { name: 'Educación',       icon: 'BookOpen',       color: '#7C6EFF', isDefault: true, type: 'expense' },
  { name: 'Entretenimiento', icon: 'Gamepad2',       color: '#F7DC6F', isDefault: true, type: 'expense' },
  { name: 'Salud',           icon: 'HeartPulse',     color: '#2ECC71', isDefault: true, type: 'expense' },
  { name: 'Ropa',            icon: 'Shirt',          color: '#E91E63', isDefault: true, type: 'expense' },
  { name: 'Tecnología',      icon: 'Laptop',         color: '#3498DB', isDefault: true, type: 'expense' },
  { name: 'Alquiler',        icon: 'Home',           color: '#E67E22', isDefault: true, type: 'expense' },
  { name: 'Suscripciones',   icon: 'Repeat',         color: '#9B59B6', isDefault: true, type: 'expense' },
  { name: 'Otros gastos',    icon: 'MoreHorizontal', color: '#95A5A6', isDefault: true, type: 'expense' },
]

const INCOME_DEFAULTS = [
  { name: 'Sueldo',      icon: 'Briefcase',     color: '#2FFFA0', isDefault: true, type: 'income' },
  { name: 'Freelance',   icon: 'MonitorSmartphone', color: '#7C6EFF', isDefault: true, type: 'income' },
  { name: 'Regalo',      icon: 'Gift',          color: '#FF8E72', isDefault: true, type: 'income' },
  { name: 'Venta',       icon: 'Tag',           color: '#F7C56F', isDefault: true, type: 'income' },
  { name: 'Inversión',   icon: 'TrendingUp',    color: '#5BC0EB', isDefault: true, type: 'income' },
  { name: 'Otros ingresos', icon: 'MoreHorizontal', color: '#95A5A6', isDefault: true, type: 'income' },
]

export const seedDefaultCategories = async (uid) => {
  const ref = categoriesRef(uid)
  await Promise.all([...EXPENSE_DEFAULTS, ...INCOME_DEFAULTS].map(cat => addDoc(ref, cat)))
}

// For existing users who were seeded before income categories existed
export const ensureIncomeCategories = async (uid, currentCategories) => {
  const hasIncome = currentCategories.some(c => c.type === 'income')
  if (hasIncome) return
  const ref = categoriesRef(uid)
  await Promise.all(INCOME_DEFAULTS.map(cat => addDoc(ref, cat)))
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
