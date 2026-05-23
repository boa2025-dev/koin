import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../services/auth'
import { addTransaction } from '../../services/transactions'
import { useCategories, ensureIncomeCategories } from '../../services/categories'
import { useWallets, adjustWalletBalance } from '../../services/wallets'
import useAppStore from '../../store/useAppStore'
import CategoryIcon from './CategoryIcon'
import toast from 'react-hot-toast'

// Format integer part with es-AR thousands separator, preserve decimal input
const displayAmount = (raw) => {
  if (!raw) return '0'
  const [intPart, decPart] = raw.split('.')
  const intFormatted = new Intl.NumberFormat('es-AR').format(parseInt(intPart) || 0)
  if (decPart !== undefined) return intFormatted + ',' + decPart
  return intFormatted
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']

export default function AddTransactionSheet() {
  const { user } = useAuth()
  const { addTxOpen, closeAddTx } = useAppStore()
  const { categories } = useCategories(user?.uid)
  const { wallets } = useWallets(user?.uid)
  const [type, setType] = useState('expense')
  const [raw, setRaw] = useState('')           // raw digit string, e.g. "1250" or "1250.5"
  const [categoryId, setCategoryId] = useState('')
  const [walletId, setWalletId] = useState('')
  const [saving, setSaving] = useState(false)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    if (addTxOpen && user && categories.length > 0 && !seeded) {
      ensureIncomeCategories(user.uid, categories).then(() => setSeeded(true))
    }
  }, [addTxOpen, user, categories, seeded])

  // Reset on open
  useEffect(() => {
    if (addTxOpen) {
      setRaw('')
      setCategoryId('')
      setType('expense')
    }
  }, [addTxOpen])

  const expenseCats = useMemo(() => categories.filter(c => !c.type || c.type === 'expense'), [categories])
  const incomeCats  = useMemo(() => categories.filter(c => c.type === 'income'), [categories])
  const shownCats   = type === 'income' ? incomeCats : expenseCats

  const switchType = (t) => { setType(t); setCategoryId('') }

  const pressKey = (key) => {
    if (key === 'del') {
      setRaw(s => s.slice(0, -1))
      return
    }
    if (key === '.') {
      if (raw.includes('.') || raw.length === 0) return
      setRaw(s => s + '.')
      return
    }
    // max 10 digits before decimal
    const [intPart] = raw.split('.')
    if (!raw.includes('.') && intPart.length >= 10) return
    // max 2 decimal digits
    if (raw.includes('.') && raw.split('.')[1].length >= 2) return
    setRaw(s => s + key)
  }

  const handleSave = async () => {
    const amount = parseFloat(raw)
    if (!raw || isNaN(amount) || amount === 0) {
      toast.error('Ingresá un monto.')
      return
    }
    if (!categoryId) {
      toast.error('Elegí una categoría.')
      return
    }
    setSaving(true)
    try {
      await addTransaction(user.uid, {
        amount,
        categoryId,
        walletId,
        type,
        date: Timestamp.fromDate(new Date()),
      })
      if (walletId) {
        const delta = type === 'income' ? amount : -amount
        await adjustWalletBalance(user.uid, walletId, delta)
      }
      toast.success(type === 'expense' ? 'Gasto registrado.' : 'Ingreso registrado.')
      closeAddTx()
    } catch {
      toast.error('Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const expenseActive = { color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.4)' }
  const incomeActive  = { color: '#2FFFA0', bg: 'rgba(47,255,160,0.15)', border: 'rgba(47,255,160,0.4)' }
  const activeStyle   = type === 'expense' ? expenseActive : incomeActive

  return (
    <AnimatePresence>
      {addTxOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeAddTx}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative rounded-t-[32px] overflow-hidden"
            style={{
              background: '#0E1018',
              borderTop: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 -24px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-4 pb-6 space-y-4">

              {/* Type toggle */}
              <div className="flex gap-2 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {[
                  { v: 'expense', label: 'Gasto' },
                  { v: 'income',  label: 'Ingreso' },
                ].map(({ v, label }) => {
                  const s = v === 'expense' ? expenseActive : incomeActive
                  const isActive = type === v
                  return (
                    <button
                      key={v}
                      onClick={() => switchType(v)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold font-sora transition-all cursor-pointer"
                      style={isActive
                        ? { color: s.color, background: s.bg, border: `1px solid ${s.border}` }
                        : { color: 'rgba(255,255,255,0.30)', background: 'transparent', border: '1px solid transparent' }
                      }
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Amount display */}
              <div className="text-center py-1">
                <p className="text-[10px] uppercase tracking-widest font-dm text-white/40 mb-3">Monto</p>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="font-sora font-bold text-2xl" style={{ color: 'rgba(255,255,255,0.35)' }}>$</span>
                  <span
                    className="font-sora font-bold leading-none"
                    style={{ fontSize: 52, letterSpacing: '-2px', color: raw ? '#F0F0F5' : 'rgba(255,255,255,0.18)' }}
                  >
                    {displayAmount(raw)}
                  </span>
                </div>
              </div>

              {/* Category pills */}
              <div style={{ overflow: 'hidden' }}>
                <div
                  className="flex gap-2 pb-1"
                  style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {shownCats.map(cat => {
                    const sel = categoryId === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryId(sel ? '' : cat.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-[14px] text-[12px] font-semibold font-dm whitespace-nowrap transition-all cursor-pointer flex-shrink-0"
                        style={sel
                          ? { color: cat.color, background: cat.color + '22', border: `1.5px solid ${cat.color}80` }
                          : { color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.08)' }
                        }
                      >
                        <CategoryIcon
                          icon={cat.icon}
                          color={sel ? cat.color : 'rgba(255,255,255,0.45)'}
                          size={12}
                          className="w-4 h-4 shrink-0"
                        />
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Wallet pills (optional) */}
              {wallets.length > 0 && (
                <div
                  className="flex gap-2"
                  style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
                >
                  {wallets.map(w => {
                    const sel = walletId === w.id
                    return (
                      <button
                        key={w.id}
                        onClick={() => setWalletId(sel ? '' : w.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-dm whitespace-nowrap flex-shrink-0 transition-all cursor-pointer"
                        style={sel
                          ? { color: w.color ?? '#7C6EFF', background: (w.color ?? '#7C6EFF') + '22', border: `1.5px solid ${(w.color ?? '#7C6EFF')}60` }
                          : { color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.07)' }
                        }
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: w.color ?? '#7C6EFF' }} />
                        {w.name}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Numeric keypad */}
              <div className="grid grid-cols-3 gap-2">
                {KEYS.map(key => (
                  <button
                    key={key}
                    onPointerDown={(e) => { e.preventDefault(); pressKey(key) }}
                    className="h-[58px] rounded-2xl flex items-center justify-center font-sora font-semibold text-xl text-white select-none transition-transform active:scale-95"
                    style={{
                      background: key === 'del' ? 'rgba(255,107,107,0.08)' : 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {key === 'del'
                      ? <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.45)' }}>⌫</span>
                      : <span style={{ color: key === '.' ? 'rgba(255,255,255,0.55)' : '#F0F0F5' }}>{key}</span>
                    }
                  </button>
                ))}
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 rounded-2xl font-sora font-semibold text-base text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
                style={{
                  background: `linear-gradient(180deg, ${activeStyle.color}E6, ${activeStyle.color}B0)`,
                  boxShadow: `0 8px 24px ${activeStyle.color}40`,
                }}
              >
                {saving
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Guardar transacción'
                }
              </button>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
