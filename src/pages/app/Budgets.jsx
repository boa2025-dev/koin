import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Edit3, ChevronDown } from 'lucide-react'
import { useAuth } from '../../services/auth'
import { useBudgets, addBudget, updateBudget } from '../../services/budgets'
import { useCategories } from '../../services/categories'
import { useTransactions } from '../../services/transactions'
import useFormatCurrency from '../../hooks/useFormatCurrency'
import CategoryIcon from '../../components/ui/CategoryIcon'
import Modal from '../../components/ui/Modal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import toast from 'react-hot-toast'

const padMonth = (y, m) => `${y}-${String(m).padStart(2, '0')}`

export default function Budgets() {
  const { user } = useAuth()
  const format = useFormatCurrency()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const monthStr = padMonth(year, month)

  const { budgets, loading: bLoading } = useBudgets(user?.uid, monthStr)
  const { categories, loading: cLoading } = useCategories(user?.uid)
  const { transactions, loading: tLoading } = useTransactions(user?.uid)
  const loading = bLoading || cLoading || tLoading

  const [modalOpen, setModalOpen] = useState(false)
  const [editBudget, setEditBudget] = useState(null)
  const [form, setForm] = useState({ categoryId: '', amount: '' })
  const [saving, setSaving] = useState(false)

  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const budgetMap = useMemo(() =>
    Object.fromEntries(budgets.map(b => [b.categoryId, b])), [budgets])

  const spentByCategory = useMemo(() => {
    const map = {}
    transactions.forEach(t => {
      if (t.type !== 'expense') return
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      const m = padMonth(d.getFullYear(), d.getMonth() + 1)
      if (m !== monthStr) return
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount
    })
    return map
  }, [transactions, monthStr])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = Object.values(spentByCategory).reduce((s, v) => s + v, 0)

  const openEdit = (b) => {
    setEditBudget(b)
    setForm({ categoryId: b.categoryId, amount: String(b.amount) })
    setModalOpen(true)
  }

  const openNew = () => {
    setEditBudget(null)
    setForm({ categoryId: '', amount: '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.categoryId || !form.amount) {
      toast.error('Completá categoría y monto.')
      return
    }
    setSaving(true)
    try {
      if (editBudget) {
        await updateBudget(user.uid, editBudget.id, { amount: parseFloat(form.amount) })
        toast.success('Presupuesto actualizado.')
      } else {
        const existing = budgetMap[form.categoryId]
        if (existing) {
          await updateBudget(user.uid, existing.id, { amount: parseFloat(form.amount) })
        } else {
          await addBudget(user.uid, {
            categoryId: form.categoryId,
            amount: parseFloat(form.amount),
            month: monthStr,
          })
        }
        toast.success('Presupuesto creado.')
      }
      setModalOpen(false)
    } catch {
      toast.error('Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const progressColor = (pct) => {
    if (pct >= 85) return '#FF6B6B'
    if (pct >= 60) return '#F7DC6F'
    return '#2FFFA0'
  }

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-sora font-bold text-2xl text-brand-text">Presupuestos</h1>
          <p className="text-brand-muted text-sm">Control mensual por categoría</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/10 text-brand-muted hover:text-brand-text transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="font-sora font-semibold text-lg text-brand-text w-44 text-center">
          {monthNames[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/10 text-brand-muted hover:text-brand-text transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary */}
      {!loading && totalBudgeted > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-brand-muted text-xs">Presupuesto total</p>
              <p className="font-sora font-bold text-xl text-brand-text">{format(totalBudgeted)}</p>
            </div>
            <div className="text-right">
              <p className="text-brand-muted text-xs">Gastado</p>
              <p className="font-sora font-bold text-xl text-red-400">{format(totalSpent)}</p>
            </div>
            <div className="text-right">
              <p className="text-brand-muted text-xs">Disponible</p>
              <p className={`font-sora font-bold text-xl ${totalBudgeted - totalSpent >= 0 ? 'text-brand-green' : 'text-red-400'}`}>
                {format(Math.max(0, totalBudgeted - totalSpent))}
              </p>
            </div>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (totalSpent / totalBudgeted) * 100)}%`,
                background: progressColor(Math.min(100, (totalSpent / totalBudgeted) * 100)),
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-brand-muted text-sm mb-2">No hay presupuestos para este mes.</p>
          <button onClick={openNew} className="text-brand-violet text-sm hover:underline">
            Crear el primero →
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {budgets.map((b, i) => {
            const cat = catMap[b.categoryId]
            const spent = spentByCategory[b.categoryId] || 0
            const pct = Math.min(100, Math.round((spent / b.amount) * 100))
            const color = progressColor(pct)
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {cat && (
                      <CategoryIcon icon={cat.icon} color={cat.color} size={16} className="w-9 h-9" />
                    )}
                    <span className="font-sora font-semibold text-sm text-brand-text">{cat?.name ?? 'Sin categoría'}</span>
                  </div>
                  <button
                    onClick={() => openEdit(b)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-brand-muted hover:text-brand-text transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>

                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-brand-muted text-xs">Gastado</p>
                    <p className="font-sora font-bold text-base" style={{ color }}>{format(spent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-brand-muted text-xs">Presupuesto</p>
                    <p className="font-sora font-semibold text-base text-brand-text">{format(b.amount)}</p>
                  </div>
                </div>

                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.06 }}
                    style={{ background: color }}
                  />
                </div>
                <p className="text-right text-xs mt-1" style={{ color }}>{pct}%</p>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'} size="sm">
        <div className="space-y-4">
          {!editBudget && (
            <div className="relative">
              <label className="text-brand-muted text-xs mb-1 block">Categoría *</label>
              <select
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="input-base appearance-none cursor-pointer pr-8 text-sm"
              >
                <option value="">Seleccionar</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 bottom-3.5 text-brand-muted pointer-events-none" />
            </div>
          )}
          <div>
            <label className="text-brand-muted text-xs mb-1 block">Monto *</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className="input-base"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalOpen(false)} className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
