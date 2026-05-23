import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, PlusCircle, CheckCircle2, Calendar, Target } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../services/auth'
import { useGoals, addGoal, deleteGoal, addGoalContribution, updateGoal } from '../../services/goals'
import useFormatCurrency from '../../hooks/useFormatCurrency'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import useAppStore from '../../store/useAppStore'
import toast from 'react-hot-toast'

const EMOJIS = ['🎯','📱','✈️','🏔️','🛡️','🎓','🏠','🚗','💻','🎵','📚','💎']

const fmtPreview = (val) => {
  const n = parseFloat(val)
  if (!val || isNaN(n)) return ''
  return new Intl.NumberFormat('es-AR').format(n)
}

const emptyForm = { name: '', targetAmount: '', deadline: '', description: '', emoji: '🎯' }

// ─── Mobile Goals ──────────────────────────────────────────────────────────
function MobileGoals({ goals, loading, format, onAdd, onContrib, onDelete }) {
  const totalTarget  = goals.reduce((s, g) => s + g.targetAmount, 0)
  const totalSaved   = goals.reduce((s, g) => s + g.currentAmount, 0)
  const totalPct     = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0
  const openAddTx    = useAppStore(s => s.openAddTx)

  return (
    <div className="px-5 pt-safe-page pb-safe-page space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sora font-bold text-[26px] tracking-tight text-brand-text" style={{ letterSpacing: '-0.6px' }}>Metas</h1>
          <p className="text-brand-muted text-[10px] mt-0.5">Ahorrando para {goals.length} objetivo{goals.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onAdd}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(124,110,255,0.16)', border: '1px solid rgba(124,110,255,0.3)', color: '#7C6EFF' }}>
          <Plus size={18} />
        </button>
      </div>

      {/* Hero summary */}
      {!loading && goals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[18px] p-4 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,110,255,0.32), rgba(47,255,160,0.18))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p className="text-[10px] text-white/55 uppercase tracking-widest font-dm">Ahorrado en total</p>
          <p className="font-sora font-bold text-2xl text-brand-text mt-1" style={{ letterSpacing: '-0.8px' }}>
            {format(totalSaved)}
          </p>
          <p className="text-[10px] text-white/55 mt-0.5">de {format(totalTarget)} · {totalPct}% del total</p>
          <div className="mt-3 h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${totalPct}%`,
                background: 'linear-gradient(90deg, #7C6EFF, #2FFFA0)',
                boxShadow: '0 0 12px rgba(124,110,255,0.5)',
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Goals list */}
      {loading ? (
        Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
      ) : goals.length === 0 ? (
        <div className="card py-16 text-center">
          <Target size={32} className="text-brand-violet mx-auto mb-3 opacity-50" />
          <p className="text-brand-muted text-sm mb-1">No tenés metas aún.</p>
          <button onClick={onAdd} className="text-brand-violet text-sm hover:underline">Crear la primera →</button>
        </div>
      ) : (
        <AnimatePresence>
          {goals.map((goal, i) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
            const deadline = goal.deadline?.toDate ? goal.deadline.toDate() : null
            const remaining = goal.targetAmount - goal.currentAmount
            const barColor = goal.completed ? '#2FFFA0' : pct >= 80 ? '#2FFFA0' : '#7C6EFF'
            const emoji = goal.emoji ?? '🎯'

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.07 }}
                className="card group"
                style={goal.completed ? { border: '1px solid rgba(47,255,160,0.25)' } : {}}
              >
                {goal.completed && (
                  <div className="flex items-center gap-1.5 text-brand-green text-[11px] font-semibold mb-2">
                    <CheckCircle2 size={12} /> Completada
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  {/* Emoji icon */}
                  <div
                    className="w-9 h-9 rounded-[11px] flex items-center justify-center text-lg shrink-0"
                    style={{
                      background: `${barColor}18`,
                      border: `1px solid ${barColor}40`,
                    }}
                  >
                    {emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-sora font-semibold text-sm text-brand-text leading-tight">{goal.name}</p>
                      <span className="font-sora font-bold text-[11px] shrink-0" style={{ color: barColor }}>{pct}%</span>
                    </div>
                    {deadline && (
                      <div className="flex items-center gap-1 text-brand-muted text-[9px] mt-0.5">
                        <Calendar size={9} />
                        {deadline.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onDelete(goal.id)}
                    className="p-1 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Progress */}
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="font-sora font-bold text-brand-text">{format(goal.currentAmount)}</span>
                  <span className="text-brand-muted">{format(goal.targetAmount)}</span>
                </div>
                <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.07 }}
                    style={{
                      background: `linear-gradient(90deg, ${barColor}, ${barColor}b0)`,
                      boxShadow: `0 0 10px ${barColor}66`,
                    }}
                  />
                </div>
                {!goal.completed && (
                  <p className="text-[9px] text-brand-muted text-right mt-1">Faltan {format(remaining)}</p>
                )}

                {!goal.completed && (
                  <button
                    onClick={() => onContrib(goal)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-[14px] text-[11px] font-semibold font-dm transition-all"
                    style={{ color: barColor, border: `1px solid ${barColor}40`, background: `${barColor}10` }}
                  >
                    <PlusCircle size={13} />
                    Agregar aporte
                  </button>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
    </div>
  )
}

// ─── Desktop Goals (unchanged layout, same as before) ────────────────────────
function DesktopGoals({ goals, loading, format, onAdd, onContrib, onDelete }) {
  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-sora font-bold text-2xl text-brand-text">Metas de ahorro</h1>
          <p className="text-brand-muted text-sm">{goals.length} meta{goals.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onAdd} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
          <Plus size={16} /> Nueva meta
        </button>
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : goals.length === 0 ? (
        <div className="card py-16 text-center">
          <Target size={36} className="text-brand-violet mx-auto mb-3 opacity-50" />
          <p className="text-brand-muted text-sm mb-2">No tenés metas aún.</p>
          <button onClick={onAdd} className="text-brand-violet text-sm hover:underline">Crear la primera →</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map((goal, i) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
            const deadline = goal.deadline?.toDate ? goal.deadline.toDate() : null
            return (
              <motion.div key={goal.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }} className="card group">
                {goal.completed && <div className="flex items-center gap-1.5 text-brand-green text-xs font-medium mb-2"><CheckCircle2 size={13} /> Completada</div>}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sora font-semibold text-base text-brand-text truncate">{goal.emoji ?? '🎯'} {goal.name}</h3>
                    {deadline && <div className="flex items-center gap-1 text-brand-muted text-xs mt-0.5"><Calendar size={11} />{deadline.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                  </div>
                  <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-sora font-bold text-brand-text">{format(goal.currentAmount)}</span>
                  <span className="text-brand-muted">{format(goal.targetAmount)}</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.06 }}
                    style={{ background: goal.completed ? '#2FFFA0' : '#7C6EFF' }} />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: goal.completed ? '#2FFFA0' : '#7C6EFF' }}>{pct}%</span>
                  {!goal.completed && <span className="text-brand-muted">Faltan {format(goal.targetAmount - goal.currentAmount)}</span>}
                </div>
                {!goal.completed && (
                  <button onClick={() => onContrib(goal)} className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-brand-violet text-sm font-medium border border-brand-violet/30 hover:bg-brand-violet/10 transition-all">
                    <PlusCircle size={15} /> Agregar aporte
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Goals() {
  const { user } = useAuth()
  const format = useFormatCurrency()
  const { goals, loading } = useGoals(user?.uid)

  const [createOpen, setCreateOpen] = useState(false)
  const [contribModal, setContribModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [contribAmount, setContribAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.name || !form.targetAmount) { toast.error('Completá nombre y monto.'); return }
    setSaving(true)
    try {
      await addGoal(user.uid, {
        name: form.name,
        emoji: form.emoji,
        targetAmount: parseFloat(form.targetAmount),
        deadline: form.deadline ? Timestamp.fromDate(new Date(form.deadline + 'T00:00:00')) : null,
        description: form.description,
      })
      toast.success('Meta creada.')
      setCreateOpen(false)
      setForm(emptyForm)
    } catch { toast.error('Error al crear.') }
    finally { setSaving(false) }
  }

  const handleContrib = async () => {
    if (!contribAmount || !contribModal) return
    setSaving(true)
    try {
      const newAmt = contribModal.currentAmount + parseFloat(contribAmount)
      const completed = newAmt >= contribModal.targetAmount
      await addGoalContribution(user.uid, contribModal.id, parseFloat(contribAmount), contribModal.currentAmount)
      if (completed && !contribModal.completed) {
        await updateGoal(user.uid, contribModal.id, { completed: true })
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#7C6EFF','#2FFFA0','#FF6B6B'] })
        toast.success('¡Meta completada! 🎉')
      } else {
        toast.success('Aporte registrado.')
      }
      setContribModal(null); setContribAmount('')
    } catch { toast.error('Error al registrar aporte.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await deleteGoal(user.uid, id); toast.success('Meta eliminada.') }
    catch { toast.error('Error al eliminar.') }
  }

  const sharedProps = { goals, loading, format, onAdd: () => setCreateOpen(true), onContrib: setContribModal, onDelete: setDeleteId }

  return (
    <>
      <div className="md:hidden"><MobileGoals {...sharedProps} /></div>
      <div className="hidden md:block"><DesktopGoals {...sharedProps} /></div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva meta">
        <div className="space-y-4">
          {/* Emoji picker */}
          <div>
            <p className="text-brand-muted text-xs mb-2">Ícono</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => upd('emoji', e)}
                  className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer"
                  style={form.emoji === e ? { background: 'rgba(124,110,255,0.2)', outline: '2px solid #7C6EFF', outlineOffset: 1 } : { background: 'rgba(255,255,255,0.05)' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-brand-muted text-xs mb-1">Nombre *</p>
            <input value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Ej: iPhone, Viaje, Fondo…" className="input-base" autoFocus />
          </div>
          <div>
            <p className="text-brand-muted text-xs mb-1">Monto objetivo *</p>
            <input type="number" value={form.targetAmount} onChange={e => upd('targetAmount', e.target.value)} placeholder="0.00" className="input-base font-sora font-bold text-lg" />
          </div>
          <div>
            <p className="text-brand-muted text-xs mb-1">Fecha límite (opcional)</p>
            <input type="date" value={form.deadline} onChange={e => upd('deadline', e.target.value)} className="input-base text-sm [color-scheme:dark]" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setCreateOpen(false)} className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Crear meta
            </button>
          </div>
        </div>
      </Modal>

      {/* Contribution modal */}
      <Modal open={!!contribModal} onClose={() => setContribModal(null)} title="Agregar aporte" size="sm">
        <div className="space-y-4">
          {contribModal && (
            <div className="glass rounded-xl p-3">
              <p className="text-brand-muted text-xs">{contribModal.emoji ?? '🎯'} {contribModal.name}</p>
              <p className="text-brand-muted text-xs mt-0.5">{format(contribModal.currentAmount)} / {format(contribModal.targetAmount)}</p>
            </div>
          )}
          <div>
            <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)} placeholder="0.00" className="input-base font-sora font-bold text-lg" autoFocus />
            {contribAmount !== '' && (
              <p className="text-brand-muted text-xs mt-1 text-right font-sora">= {fmtPreview(contribAmount)}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setContribModal(null)} className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
            <button onClick={handleContrib} disabled={saving || !contribAmount} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} title="Eliminar meta" message="¿Eliminás esta meta? Los aportes se perderán." />
    </>
  )
}
