import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../services/auth'
import { addTransaction } from '../../services/transactions'
import { useCategories, ensureIncomeCategories } from '../../services/categories'
import { useWallets, adjustWalletBalance } from '../../services/wallets'
import useAppStore from '../../store/useAppStore'
import toast from 'react-hot-toast'

const fmt = (val) => {
  const n = parseFloat(val)
  if (!val || isNaN(n)) return ''
  return new Intl.NumberFormat('es-AR').format(n)
}

const empty = {
  amount: '',
  categoryId: '',
  walletId: '',
  type: 'expense',
  date: new Date().toISOString().slice(0, 10),
}

export default function AddTransactionSheet() {
  const { user } = useAuth()
  const { addTxOpen, closeAddTx } = useAppStore()
  const { categories } = useCategories(user?.uid)
  const { wallets } = useWallets(user?.uid)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const amountRef = useRef(null)

  // Ensure income categories exist for existing users
  useEffect(() => {
    if (addTxOpen && user && categories.length > 0 && !seeded) {
      ensureIncomeCategories(user.uid, categories).then(() => setSeeded(true))
    }
  }, [addTxOpen, user, categories, seeded])

  // Focus amount input after sheet animation completes
  useEffect(() => {
    if (addTxOpen) {
      const t = setTimeout(() => amountRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
  }, [addTxOpen])

  const expenseCats = useMemo(() => categories.filter(c => !c.type || c.type === 'expense'), [categories])
  const incomeCats  = useMemo(() => categories.filter(c => c.type === 'income'), [categories])
  const shownCats   = form.type === 'income' ? incomeCats : expenseCats

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Reset category when switching type so a mis-matched category is not sent
  const setType = (t) => setForm(f => ({ ...f, type: t, categoryId: '' }))

  const handleSave = async () => {
    if (!form.amount || !form.categoryId) {
      toast.error('Completá el monto y la categoría.')
      return
    }
    const amount = parseFloat(form.amount)
    setSaving(true)
    try {
      await addTransaction(user.uid, {
        amount,
        categoryId: form.categoryId,
        walletId: form.walletId,
        type: form.type,
        date: Timestamp.fromDate(new Date(form.date + 'T12:00:00')),
      })

      // Fix 4: update wallet balance
      if (form.walletId) {
        const delta = form.type === 'income' ? amount : -amount
        await adjustWalletBalance(user.uid, form.walletId, delta)
      }

      toast.success(form.type === 'expense' ? 'Gasto registrado.' : 'Ingreso registrado.')
      setForm(empty)
      closeAddTx()
    } catch {
      toast.error('Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => { setForm(empty); closeAddTx() }

  return (
    <AnimatePresence>
      {addTxOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative rounded-t-[30px] overflow-hidden"
            style={{
              background: 'rgba(14,16,28,0.97)',
              backdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="font-sora font-semibold text-base text-brand-text">Nueva transacción</h3>
              <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-brand-muted">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 pb-8 space-y-4">
              {/* Type toggle */}
              <div className="flex p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  { v: 'expense', label: '↓ Gasto',   cls: 'bg-brand-red/80 text-white' },
                  { v: 'income',  label: '↑ Ingreso',  cls: 'bg-brand-green/80 text-brand-bg' },
                ].map(({ v, label, cls }) => (
                  <button key={v} onClick={() => setType(v)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold font-dm transition-all cursor-pointer ${form.type === v ? cls : 'text-brand-muted'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Amount — Fix 1: formatted preview */}
              <div>
                <p className="text-brand-muted text-xs mb-1.5">Monto *</p>
                <input
                  ref={amountRef}
                  type="number"
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  placeholder="0"
                  className="input-base text-2xl font-sora font-bold tracking-tight"
                  inputMode="decimal"
                />
                {form.amount !== '' && (
                  <p className="text-brand-muted text-xs mt-1 text-right font-sora">
                    = {fmt(form.amount)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category — Fix 3: filtered by type */}
                <div className="relative">
                  <p className="text-brand-muted text-xs mb-1.5">Categoría *</p>
                  <select
                    value={form.categoryId}
                    onChange={e => set('categoryId', e.target.value)}
                    className="input-base appearance-none pr-8 text-sm cursor-pointer"
                  >
                    <option value="">Elegir</option>
                    {shownCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 bottom-3.5 text-brand-muted pointer-events-none" />
                </div>

                {/* Wallet */}
                <div className="relative">
                  <p className="text-brand-muted text-xs mb-1.5">Billetera</p>
                  <select
                    value={form.walletId}
                    onChange={e => set('walletId', e.target.value)}
                    className="input-base appearance-none pr-8 text-sm cursor-pointer"
                  >
                    <option value="">Elegir</option>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 bottom-3.5 text-brand-muted pointer-events-none" />
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="text-brand-muted text-xs mb-1.5">Fecha</p>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                  className="input-base text-sm [color-scheme:dark]"
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 rounded-2xl font-sora font-semibold text-base text-white flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-transform"
                style={{
                  background: 'linear-gradient(180deg, rgba(124,110,255,0.95), rgba(124,110,255,0.80))',
                  boxShadow: '0 8px 24px rgba(124,110,255,0.45)',
                }}
              >
                {saving
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : form.type === 'expense' ? 'Registrar gasto' : 'Registrar ingreso'
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
