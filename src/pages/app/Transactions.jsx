import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Trash2, Edit3, X, ChevronDown, SlidersHorizontal } from 'lucide-react'
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
  amount: '', description: '', categoryId: '', walletId: '',
  type: 'expense', date: new Date().toISOString().slice(0, 10), notes: '',
}

const today = new Date()
const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

const dayLabel = (d) => {
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })
}

// ─── Mobile view ─────────────────────────────────────────────────────────────
function MobileTransactions({ filtered, loading, catMap, format, onEdit, onDelete, search, setSearch, filterType, setFilterType }) {
  const [showFilters, setShowFilters] = useState(false)

  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(tx => {
      const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
      const key = d.toDateString()
      if (!groups[key]) groups[key] = { label: dayLabel(d), date: d, txs: [], total: 0 }
      groups[key].txs.push(tx)
      groups[key].total += tx.type === 'expense' ? -tx.amount : tx.amount
    })
    return Object.values(groups).sort((a, b) => b.date - a.date)
  }, [filtered])

  const currentMonthName = today.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div className="px-5 pt-4 pb-36 space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-sora font-bold text-[26px] tracking-tight text-brand-text" style={{ letterSpacing: '-0.6px' }}>
          Movimientos
        </h1>
        <p className="text-brand-muted text-[10px] mt-0.5 capitalize">{currentMonthName} · {filtered.length} registros</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar comercio, categoría…"
            className="input-base pl-9 py-2.5 text-[11px]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted">
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(p => !p)}
          className="w-10 h-10 rounded-[14px] flex items-center justify-center transition-colors"
          style={{
            background: showFilters ? 'rgba(124,110,255,0.18)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${showFilters ? 'rgba(124,110,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: showFilters ? '#7C6EFF' : '#8B8FA3',
          }}
        >
          <SlidersHorizontal size={15} />
        </button>
      </div>

      {/* Segmented filter */}
      <div className="flex p-[3px] rounded-[10px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[['', 'Todo'], ['expense', 'Gastos'], ['income', 'Ingresos']].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilterType(v)}
            className="flex-1 text-center py-[6px] rounded-[7px] text-[10px] font-semibold font-dm transition-all cursor-pointer"
            style={filterType === v
              ? { background: 'rgba(255,255,255,0.10)', color: '#F0F0F5', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }
              : { color: 'rgba(255,255,255,0.55)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
      ) : grouped.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-brand-muted text-sm">Sin transacciones</p>
        </div>
      ) : (
        grouped.map(({ label, date, txs, total }) => (
          <div key={date.toDateString()}>
            {/* Day header */}
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="font-sora font-semibold text-[11px] text-brand-text capitalize">{label}</span>
              <span className={`text-[9px] font-semibold ${total >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                {total >= 0 ? '+' : ''}{format(total)}
              </span>
            </div>
            {/* Day transactions */}
            <div className="rounded-[20px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {txs.map((tx, i) => {
                const cat = catMap[tx.categoryId]
                const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 px-3 py-[10px] group"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <div
                      className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0"
                      style={{ background: (cat?.color ?? '#7C6EFF') + '28', color: cat?.color ?? '#7C6EFF' }}
                    >
                      <CategoryIcon icon={cat?.icon ?? 'MoreHorizontal'} color={cat?.color ?? '#7C6EFF'} size={12} className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-brand-text truncate">{tx.description || cat?.name || 'Sin descripción'}</p>
                      <p className="text-[9px] text-brand-muted">{cat?.name} · {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`font-sora font-semibold text-[11px] ${tx.type === 'income' ? 'text-brand-green' : 'text-brand-text'}`}>
                      {tx.type === 'income' ? '+' : '−'}{format(tx.amount)}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(tx)} className="p-1 rounded-lg hover:bg-white/10 text-brand-muted hover:text-brand-text">
                        <Edit3 size={12} />
                      </button>
                      <button onClick={() => onDelete(tx.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Desktop view ─────────────────────────────────────────────────────────────
function DesktopTransactions({ filtered, loading, catMap, format, onEdit, onOpenNew, onDelete, search, setSearch, filterCat, setFilterCat, filterType, setFilterType, categories }) {
  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-sora font-bold text-2xl text-brand-text">Transacciones</h1>
          <p className="text-brand-muted text-sm">{filtered.length} registros</p>
        </div>
        <button onClick={onOpenNew} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
          + Nueva
        </button>
      </div>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-base pl-9 py-2.5 text-sm" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted"><X size={14} /></button>}
        </div>
        <div className="relative">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input-base py-2.5 text-sm pr-8 appearance-none cursor-pointer min-w-[140px]">
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-base py-2.5 text-sm pr-8 appearance-none cursor-pointer">
            <option value="">Todos</option>
            <option value="expense">Gastos</option>
            <option value="income">Ingresos</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
        </div>
      </div>
      <div className="card">
        {loading ? Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />) :
          filtered.length === 0 ? (
            <div className="py-16 text-center text-brand-muted text-sm">Sin transacciones</div>
          ) : filtered.map((tx, i) => {
            const cat = catMap[tx.categoryId]
            const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
            return (
              <motion.div key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
                <CategoryIcon icon={cat?.icon ?? 'MoreHorizontal'} color={cat?.color ?? '#7C6EFF'} size={16} className="w-10 h-10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-brand-text text-sm font-medium truncate">{tx.description || cat?.name || 'Sin descripción'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-brand-muted text-xs">{d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {cat && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: cat.color + '20', color: cat.color }}>{cat.name}</span>}
                  </div>
                </div>
                <span className={`text-sm font-semibold font-sora ${tx.type === 'income' ? 'text-brand-green' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{format(tx.amount)}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(tx)} className="p-1.5 rounded-lg hover:bg-white/10 text-brand-muted hover:text-brand-text transition-colors"><Edit3 size={14} /></button>
                  <button onClick={() => onDelete(tx.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            )
          })
        }
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
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

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

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

  const openNew = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }

  const openEdit = (tx) => {
    setEditing(tx)
    const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
    setForm({ amount: String(tx.amount), description: tx.description || '', categoryId: tx.categoryId || '',
      walletId: tx.walletId || '', type: tx.type || 'expense', date: d.toISOString().slice(0, 10), notes: tx.notes || '' })
    setModalOpen(true)
  }

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.amount || !form.categoryId) { toast.error('Completá el monto y la categoría.'); return }
    setSaving(true)
    try {
      const data = { amount: parseFloat(form.amount), description: form.description, categoryId: form.categoryId,
        walletId: form.walletId, type: form.type, date: Timestamp.fromDate(new Date(form.date + 'T12:00:00')), notes: form.notes }
      if (editing) { await updateTransaction(user.uid, editing.id, data); toast.success('Transacción actualizada.') }
      else { await addTransaction(user.uid, data); toast.success('Transacción agregada.') }
      setModalOpen(false)
    } catch { toast.error('Error al guardar.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await deleteTransaction(user.uid, id); toast.success('Eliminada.') }
    catch { toast.error('Error al eliminar.') }
  }

  const sharedProps = { filtered, loading, catMap, format, onEdit: openEdit, onDelete: setDeleteId, search, setSearch, filterType, setFilterType }

  return (
    <>
      <div className="md:hidden">
        <MobileTransactions {...sharedProps} />
      </div>
      <div className="hidden md:block">
        <DesktopTransactions {...sharedProps} onOpenNew={openNew} filterCat={filterCat} setFilterCat={setFilterCat} categories={categories} />
      </div>

      {/* Edit modal (desktop + mobile) */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar transacción' : 'Nueva transacción'}>
        <div className="space-y-4">
          <div className="flex bg-white/[0.04] rounded-xl p-1">
            {['expense','income'].map(t => (
              <button key={t} onClick={() => upd('type', t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  form.type === t ? (t==='expense' ? 'bg-red-500/80 text-white' : 'bg-brand-green/80 text-brand-bg') : 'text-brand-muted'
                }`}>{t === 'expense' ? '↓ Gasto' : '↑ Ingreso'}</button>
            ))}
          </div>
          <input type="number" value={form.amount} onChange={e => upd('amount', e.target.value)} placeholder="0.00" className="input-base text-lg font-sora font-bold" autoFocus />
          <input value={form.description} onChange={e => upd('description', e.target.value)} placeholder="Descripción" className="input-base" />
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select value={form.categoryId} onChange={e => upd('categoryId', e.target.value)} className="input-base appearance-none cursor-pointer pr-8 text-sm">
                <option value="">Categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 bottom-3.5 text-brand-muted pointer-events-none" />
            </div>
            <div className="relative">
              <select value={form.walletId} onChange={e => upd('walletId', e.target.value)} className="input-base appearance-none cursor-pointer pr-8 text-sm">
                <option value="">Billetera</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 bottom-3.5 text-brand-muted pointer-events-none" />
            </div>
          </div>
          <input type="date" value={form.date} onChange={e => upd('date', e.target.value)} className="input-base text-sm [color-scheme:dark]" />
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalOpen(false)} className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editing ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)}
        title="Eliminar transacción" message="¿Estás seguro? Esta acción no se puede deshacer." />
    </>
  )
}
