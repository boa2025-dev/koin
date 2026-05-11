import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Target, Trash2, PlusCircle, CheckCircle2, Calendar } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../services/auth'
import { useGoals, addGoal, deleteGoal, addGoalContribution, updateGoal } from '../../services/goals'
import useFormatCurrency from '../../hooks/useFormatCurrency'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import toast from 'react-hot-toast'

const emptyForm = {
  name: '',
  targetAmount: '',
  deadline: '',
  description: '',
}

export default function Goals() {
  const { user } = useAuth()
  const format = useFormatCurrency()
  const { goals, loading } = useGoals(user?.uid)

  const [modalOpen, setModalOpen] = useState(false)
  const [contribModal, setContribModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [contribAmount, setContribAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.name || !form.targetAmount) {
      toast.error('Completá nombre y monto objetivo.')
      return
    }
    setSaving(true)
    try {
      await addGoal(user.uid, {
        name: form.name,
        targetAmount: parseFloat(form.targetAmount),
        deadline: form.deadline ? Timestamp.fromDate(new Date(form.deadline + 'T00:00:00')) : null,
        description: form.description,
      })
      toast.success('Meta creada.')
      setModalOpen(false)
      setForm(emptyForm)
    } catch {
      toast.error('Error al crear.')
    } finally {
      setSaving(false)
    }
  }

  const handleContrib = async () => {
    if (!contribAmount || !contribModal) return
    setSaving(true)
    try {
      const newAmount = contribModal.currentAmount + parseFloat(contribAmount)
      const completed = newAmount >= contribModal.targetAmount
      await addGoalContribution(user.uid, contribModal.id, parseFloat(contribAmount), contribModal.currentAmount)
      if (completed && !contribModal.completed) {
        await updateGoal(user.uid, contribModal.id, { completed: true })
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#7C6EFF', '#2FFFA0', '#FF6B6B'] })
        toast.success('¡Meta completada! 🎉')
      } else {
        toast.success('Aporte registrado.')
      }
      setContribModal(null)
      setContribAmount('')
    } catch {
      toast.error('Error al registrar aporte.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteGoal(user.uid, id)
      toast.success('Meta eliminada.')
    } catch {
      toast.error('Error al eliminar.')
    }
  }

  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-sora font-bold text-2xl text-brand-text">Metas de ahorro</h1>
          <p className="text-brand-muted text-sm">{goals.length} meta{goals.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva meta</span>
        </button>
      </div>

      {/* Goals grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="card py-16 text-center">
          <Target size={36} className="text-brand-violet mx-auto mb-3 opacity-50" />
          <p className="text-brand-muted text-sm mb-2">No tenés metas aún.</p>
          <button onClick={() => setModalOpen(true)} className="text-brand-violet text-sm hover:underline">
            Crear la primera →
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {goals.map((goal, i) => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              const deadline = goal.deadline?.toDate ? goal.deadline.toDate() : null
              const remaining = goal.targetAmount - goal.currentAmount
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.07 }}
                  className={`card group ${goal.completed ? 'border-brand-green/30' : ''}`}
                >
                  {/* Completed badge */}
                  {goal.completed && (
                    <div className="flex items-center gap-1.5 text-brand-green text-xs font-medium mb-2">
                      <CheckCircle2 size={13} />
                      Completada
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sora font-semibold text-base text-brand-text truncate">{goal.name}</h3>
                      {goal.description && (
                        <p className="text-brand-muted text-xs mt-0.5 line-clamp-1">{goal.description}</p>
                      )}
                      {deadline && (
                        <div className="flex items-center gap-1 text-brand-muted text-xs mt-1">
                          <Calendar size={11} />
                          {deadline.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteId(goal.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-brand-text font-semibold font-sora">{format(goal.currentAmount)}</span>
                      <span className="text-brand-muted">{format(goal.targetAmount)}</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ background: goal.completed ? '#2FFFA0' : '#7C6EFF' }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span style={{ color: goal.completed ? '#2FFFA0' : '#7C6EFF' }}>{pct}%</span>
                      {!goal.completed && (
                        <span className="text-brand-muted">Faltan {format(remaining)}</span>
                      )}
                    </div>
                  </div>

                  {!goal.completed && (
                    <button
                      onClick={() => { setContribModal(goal); setContribAmount('') }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-brand-violet text-sm font-medium border border-brand-violet/30 hover:bg-brand-violet/10 transition-all"
                    >
                      <PlusCircle size={15} />
                      Agregar aporte
                    </button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* FAB mobile */}
      <button
        onClick={() => setModalOpen(true)}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full bg-brand-violet shadow-lg glow-violet flex items-center justify-center z-30 active:scale-95 transition-transform"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva meta de ahorro">
        <div className="space-y-4">
          <div>
            <label className="text-brand-muted text-xs mb-1 block">Nombre *</label>
            <input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Ej: Laptop, Viaje, Fondo de emergencia..."
              className="input-base"
              autoFocus
            />
          </div>
          <div>
            <label className="text-brand-muted text-xs mb-1 block">Monto objetivo *</label>
            <input
              type="number"
              value={form.targetAmount}
              onChange={e => update('targetAmount', e.target.value)}
              placeholder="0.00"
              className="input-base font-sora font-bold text-lg"
            />
          </div>
          <div>
            <label className="text-brand-muted text-xs mb-1 block">Fecha límite (opcional)</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => update('deadline', e.target.value)}
              className="input-base text-sm [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="text-brand-muted text-xs mb-1 block">Descripción (opcional)</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="¿Para qué estás ahorrando?"
              rows={2}
              className="input-base resize-none text-sm"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalOpen(false)} className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Crear meta
            </button>
          </div>
        </div>
      </Modal>

      {/* Contribution modal */}
      <Modal open={!!contribModal} onClose={() => setContribModal(null)} title="Agregar aporte" size="sm">
        <div className="space-y-4">
          {contribModal && (
            <div className="glass rounded-xl p-3 mb-1">
              <p className="text-brand-muted text-xs">Meta</p>
              <p className="font-sora font-semibold text-brand-text">{contribModal.name}</p>
              <p className="text-brand-muted text-xs mt-1">
                {format(contribModal.currentAmount)} / {format(contribModal.targetAmount)}
              </p>
            </div>
          )}
          <div>
            <label className="text-brand-muted text-xs mb-1 block">Monto a aportar</label>
            <input
              type="number"
              value={contribAmount}
              onChange={e => setContribAmount(e.target.value)}
              placeholder="0.00"
              className="input-base font-sora font-bold text-lg"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setContribModal(null)} className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
            <button
              onClick={handleContrib}
              disabled={saving || !contribAmount}
              className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Eliminar meta"
        message="¿Eliminás esta meta? Los aportes registrados se perderán."
      />
    </div>
  )
}
