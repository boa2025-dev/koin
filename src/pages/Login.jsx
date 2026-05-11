import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { signIn, signUp, signInWithGoogle } from '../services/auth'
import { createUserDoc, getUserDoc } from '../services/user'
import toast from 'react-hot-toast'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

export default function Login() {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const navigate = useNavigate()

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const { user } = await signIn(form.email, form.password)
        const snap = await getUserDoc(user.uid)
        if (!snap.exists() || !snap.data().onboardingDone) {
          await createUserDoc(user.uid, { email: user.email, name: user.displayName ?? form.email.split('@')[0] })
          navigate('/onboarding')
        } else {
          navigate('/app/dashboard')
        }
        toast.success('¡Bienvenido de nuevo!')
      } else {
        const { user } = await signUp(form.email, form.password)
        await createUserDoc(user.uid, { email: user.email, name: form.name || form.email.split('@')[0] })
        toast.success('¡Cuenta creada! Vamos a configurar todo.')
        navigate('/onboarding')
      }
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'Usuario no encontrado.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/email-already-in-use': 'El email ya está en uso.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/invalid-email': 'Email inválido.',
        'auth/invalid-credential': 'Credenciales inválidas.',
      }
      toast.error(msgs[err.code] ?? 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      const { user } = await signInWithGoogle()
      const snap = await getUserDoc(user.uid)
      if (!snap.exists() || !snap.data().onboardingDone) {
        await createUserDoc(user.uid, { email: user.email, name: user.displayName ?? '' })
        navigate('/onboarding')
      } else {
        navigate('/app/dashboard')
      }
      toast.success('¡Bienvenido!')
    } catch {
      toast.error('Error al iniciar con Google.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-brand-bg flex items-center justify-center p-4 relative">
      {/* Bg glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-violet/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-xl bg-brand-violet flex items-center justify-center">
            <PieChart size={16} className="text-white" />
          </div>
          <span className="font-sora font-bold text-brand-text">UniSpend</span>
        </Link>

        <div className="glass rounded-2xl p-7">
          {/* Tabs */}
          <div className="flex bg-white/[0.04] rounded-xl p-1 mb-6">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  mode === m
                    ? 'bg-brand-violet text-white'
                    : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nombre"
                  className="input-base pl-10"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
                className="input-base pl-10"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Contraseña"
                required
                minLength={6}
                className="input-base pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-brand-muted text-xs">o continuá con</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="btn-ghost w-full flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <GoogleIcon />
            Continuar con Google
          </button>
        </div>
      </motion.div>
    </div>
  )
}
