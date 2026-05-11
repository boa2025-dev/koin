import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Trash2, Edit3, X, ChevronDown } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../services/auth'
import { useTransactions, addTransaction, updateTransaction, deleteTransaction } from '../../services/transactions'
import { useCategories } from '../../services/categories'
import { useWallets } from '../../services/wallets'
import useFormatCurrency from '../../hooks/useFormatCurrency'
import CategoryIcon from '../../components/ui/CategoryIcon'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { SkeletonRow } from '../../components/ui/Skeleton'
import toast from 'react-hot-toast'

const emptyForm = {
  amount: '',
  description: '',
  categoryId: '',
  walletId: '',
  type: 'expense',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
}

export default function Transactions() {
  const { user } = useAuth()
  const format = useFormatCurrency()
  const { transactions, loading } = useTransactions(user?.uid)
  const { categories } = useCategories(user?.uid)
  const { wallets } = useWallets(user?.uid)

  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const filtered = useMemo(() => {
    let t = transactions
    if (search) t = t.filter(tx =>
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      catMap[tx.categoryId]?.name.toLowerCase().includes(search.toLowerCase())
    )
    if (filterCat) t = t.filter(tx => tx.categoryId === filterCat)
    if (filterType) t = t.filter(tx => tx.type === filterType)
    return t
  }, [transactions, search, filterCat, filterType, catMap])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (tx) => {
    setEditing(tx)
    const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
    setForm({
      amount: String(tx.amount),
      description: tx.description || '',
      categoryId: tx.categoryId || '',
      walletId: tx.walletId || '',
      type: tx.type || 'expense',
      date: d.toISOString().slice(0, 10),
      notes: tx.notes || '',
    })
    setModalOpen(true)
  }

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.amount || !form.categoryId) {
      toast.error('Completá el monto y la categoría.')
      return
    }
    setSaving(true)
    try {
      const data = {
        amount: parseFloat(form.amount),
        description: form.description,
        categoryId: form.categoryId,
        walletId: form.walletId,
        type: form.type,
        date: Timestamp.fromDate(new Date(form.date + 'T12:00:00')),
        notes: form.notes,
      }

      if (editing) {
        await updateTransaction(user.uid, editing.id, data)
        toast.success('Transacción actualizada.')
      } else {
        await addTransaction(user.uid, data)
        toast.success('Transacción agregada.')
      }
      setModalOpen(false)
    } catch {
      toast.error('Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(user.uid, id)
      toast.success('Transacción eliminada.')
    } catch {
      toast.error('Error al eliminar.')
    }
  }

  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-sora font-bold text-2xl text-brand-text">Transacciones</h1>
          <p className="text-brand-muted text-sm">{filtered.length} registros</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="input-base pl-9 py-2.5 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="input-base py-2.5 text-sm pr-8 appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="input-base py-2.5 text-sm pr-8 appearance-none cursor-pointer"
          >
            <option value="">Todos los tipos</option>
            <option value="expense">Gastos</option>
            <option value="income">Ingresos</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
        </div>
      </div>

      {/* List */}
      <div className="card space-y-0 overflow-hidden">
        {loading ? (
          Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-brand-muted text-sm mb-2">Sin transacciones</p>
            <button onClick={openNew} className="text-brand-violet text-sm hover:underline">
              Agregar la primera →
            </button>
          </div>
        ) : (
          filtered.map((tx, i) => {
            const cat = catMap[tx.categoryId]
            const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
              >
                <CategoryIcon
                  icon={cat?.icon ?? 'MoreHorizontal'}
                  color={cat?.color ?? '#7C6EFF'}
                  size={16}
                  className="w-10 h-10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-brand-text text-sm font-medium truncate">
                    {tx.description || cat?.name || 'Sin descripción'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-brand-muted text-xs">
                      {d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {cat && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: cat.color + '20', color: cat.color }}
                      >
                        {cat.name}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-sm font-semibold font-sora ${tx.type === 'income' ? 'text-brand-green' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{format(tx.amount)}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(tx)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-brand-muted hover:text-brand-text transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(tx.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* FAB mobile */}
      <button
        onClick={openNew}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full bg-brand-violet shadow-lg glow-violet flex items-center justify-center z-30 active:scale-95 transition-transform"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Transaction modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar transacción' : 'Nueva transacción'}>
        <div className="space-y-4">
          {/* Type toggle */}
          <div className="flex bg-white/[0.04] rounded-xl p-1">
            {['expense', 'income'].map(t => (
              <button
                key={t}
                onClick={() => update('type', t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  form.type === t
                    ? t === 'expense' ? 'bg-red-500/80 text-white' : 'bg-brand-green/80 text-brand-bg'
                    : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                {t === 'expense' ? '↓ Gasto' : '↑ Ingreso'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="text-brand-muted text-xs mb-1 block">Monto *</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              placeholder="0.00"
              className="input-base text-lg font-sora font-bold"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-brand-muted text-xs mb-1 block">Descripción</label>
            <input
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="¿En qué gastaste?"
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="relative">
              <label className="text-brand-muted text-xs mb-1 block">Categoría *</label>
              <select
                value={form.categoryId}
                onChange={e => update('categoryId', e.target.value)}
                className="input-base appearance-none cursor-pointer pr-8 text-sm"
              >
                <option value="">Seleccionar</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 bottom-3.5 text-brand-muted pointer-events-none" />
            </div>

            {/* Wallet */}
            <div className="relative">
              <label className="text-brand-muted text-xs mb-1 block">Billetera</label>
              <select
                value={form.walletId}
                onChange={e => update('walletId', e.target.value)}
                className="input-base appearance-none cursor-pointer pr-8 text-sm"
              >
                <option value="">Seleccionar</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 bottom-3.5 text-brand-muted pointer-events-none" />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-brand-muted text-xs mb-1 block">Fecha</label>
            <input
              type="date"
              value={form.date}
              onChange={e => update('date', e.target.value)}
              className="input-base text-sm [color-scheme:dark]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-brand-muted text-xs mb-1 block">Nota (opcional)</label>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Comentarios adicionales..."
              rows={2}
              className="input-base resize-none text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalOpen(false)} className="btn-ghost flex-1 py-2.5 text-sm">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {editing ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Eliminar transacción"
        message="¿Estás seguro? Esta acción no se puede deshacer."
      />
    </div>
  )
}
