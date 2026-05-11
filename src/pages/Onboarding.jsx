import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, ChevronRight, Check } from 'lucide-react'
import { useAuth } from '../services/auth'
import { updateUserDoc } from '../services/user'
import { addWallet } from '../services/wallets'
import { seedDefaultCategories } from '../services/categories'
import toast from 'react-hot-toast'

const currencies = ['ARS', 'USD', 'EUR', 'CLP', 'BRL', 'MXN']

const walletColors = ['#7C6EFF', '#2FFFA0', '#FF6B6B', '#4ECDC4', '#F7DC6F', '#E91E63']

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
}

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    name: '',
    currency: 'ARS',
    walletName: 'Efectivo',
    walletBalance: '',
    walletColor: '#7C6EFF',
  })

  const update = (k, v) => setData(d => ({ ...d, [k]: v }))

  const next = () => {
    setDir(1)
    setStep(s => s + 1)
  }

  const back = () => {
    setDir(-1)
    setStep(s => s - 1)
  }

  const finish = async () => {
    if (!user) return
    setLoading(true)
    try {
      await updateUserDoc(user.uid, {
        name: data.name || user.displayName || 'Estudiante',
        currency: data.currency,
        onboardingDone: true,
      })
      await addWallet(user.uid, {
        name: data.walletName,
        balance: parseFloat(data.walletBalance) || 0,
        color: data.walletColor,
      })
      await seedDefaultCategories(user.uid)
      toast.success('¡Todo listo! Bienvenido a UniSpend.')
      navigate('/app/dashboard')
    } catch {
      toast.error('Hubo un error. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      title: '¿Cómo te llamás?',
      subtitle: 'Personalizamos tu experiencia.',
      content: (
        <div className="space-y-4">
          <input
            value={data.name}
            onChange={e => update('name', e.target.value)}
            placeholder="Tu nombre"
            className="input-base text-center text-lg"
            autoFocus
          />
        </div>
      ),
      canNext: true,
    },
    {
      title: '¿Con qué moneda operás?',
      subtitle: 'Podés cambiarlo después en ajustes.',
      content: (
        <div className="grid grid-cols-3 gap-3">
          {currencies.map(c => (
            <button
              key={c}
              onClick={() => update('currency', c)}
              className={`py-3 rounded-xl text-sm font-medium font-sora transition-all cursor-pointer ${
                data.currency === c
                  ? 'bg-brand-violet text-white'
                  : 'glass hover:border-brand-violet/40 text-brand-muted hover:text-brand-text'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      ),
      canNext: !!data.currency,
    },
    {
      title: 'Creá tu primera billetera',
      subtitle: 'Podés agregar más después.',
      content: (
        <div className="space-y-4">
          <input
            value={data.walletName}
            onChange={e => update('walletName', e.target.value)}
            placeholder="Ej: Efectivo, Mercado Pago..."
            className="input-base"
          />
          <input
            value={data.walletBalance}
            onChange={e => update('walletBalance', e.target.value)}
            type="number"
            placeholder="Saldo inicial (opcional)"
            className="input-base"
          />
          <div>
            <p className="text-brand-muted text-xs mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {walletColors.map(c => (
                <button
                  key={c}
                  onClick={() => update('walletColor', c)}
                  className="w-8 h-8 rounded-full transition-all cursor-pointer"
                  style={{ background: c, outline: data.walletColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
          </div>
        </div>
      ),
      canNext: !!data.walletName,
    },
  ]

  const isLast = step === steps.length - 1
  const current = steps[step]

  return (
    <div className="min-h-dvh bg-brand-bg flex items-center justify-center p-4 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-violet/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-xl bg-brand-violet flex items-center justify-center">
            <PieChart size={16} className="text-white" />
          </div>
          <span className="font-sora font-bold text-brand-text">UniSpend</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 justify-center mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`transition-all duration-300 rounded-full ${
                i === step ? 'w-6 h-2 bg-brand-violet' : i < step ? 'w-2 h-2 bg-brand-violet/60' : 'w-2 h-2 bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="glass rounded-2xl p-7 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="font-sora font-bold text-2xl text-brand-text mb-2">{current.title}</h2>
              <p className="text-brand-muted text-sm mb-6">{current.subtitle}</p>
              {current.content}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={back} className="btn-ghost text-sm py-2 px-4">
                Atrás
              </button>
            ) : (
              <div />
            )}

            {isLast ? (
              <button
                onClick={finish}
                disabled={!current.canNext || loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={16} />
                    ¡Comenzar!
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={next}
                disabled={!current.canNext}
                className="btn-primary flex items-center gap-2 disabled:opacity-60"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
