import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Suspense, lazy } from 'react'
import {
  Zap, PieChart, Target, BarChart2, Users, Bell,
  ArrowRight, CheckCircle2, TrendingDown, Eye,
} from 'lucide-react'

const HeroScene = lazy(() => import('../components/landing/HeroScene'))

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const features = [
  {
    icon: Zap,
    title: 'Registro rápido',
    desc: 'Cargá un gasto en segundos, desde cualquier dispositivo.',
    size: 'col-span-2 row-span-1',
  },
  {
    icon: PieChart,
    title: 'Presupuestos por categoría',
    desc: 'Definí cuánto podés gastar en comida, salidas, y más.',
    size: 'col-span-1 row-span-2',
  },
  {
    icon: Target,
    title: 'Metas de ahorro',
    desc: 'Creá objetivos y seguí tu progreso mes a mes.',
    size: 'col-span-1 row-span-1',
  },
  {
    icon: BarChart2,
    title: 'Análisis visual',
    desc: 'Gráficos claros para entender tus patrones de gasto.',
    size: 'col-span-1 row-span-1',
  },
  {
    icon: Users,
    title: 'Gastos compartidos',
    desc: 'Próximamente: dividí gastos con compañeros de piso.',
    size: 'col-span-1 row-span-1',
  },
  {
    icon: Bell,
    title: 'Recordatorios inteligentes',
    desc: 'Te avisamos cuando estás por pasarte del presupuesto.',
    size: 'col-span-1 row-span-1',
  },
]

const problems = [
  { icon: TrendingDown, title: 'Gastos invisibles', desc: 'Pequeñas compras que sumadas se llevan todo.' },
  { icon: Eye, title: 'Sin visibilidad', desc: 'No sabés cuánto gastaste hasta que revisás el resumen bancario.' },
  { icon: Target, title: 'Metas sin cumplir', desc: 'Querés ahorrar pero nunca llegás a fin de mes con plata.' },
]

const steps = [
  { n: '01', title: 'Creá tu cuenta', desc: 'En segundos, con email o Google. Sin datos de tarjeta.' },
  { n: '02', title: 'Cargá tus gastos', desc: 'Manual o con foto del ticket. Rápido y sin fricción.' },
  { n: '03', title: 'Tomá el control', desc: 'Visualizá, presupuestá y ahorrá con intención.' },
]

export default function Landing() {
  return (
    <div className="min-h-dvh bg-brand-bg text-brand-text font-dm overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/[0.06] bg-brand-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-violet flex items-center justify-center">
            <PieChart size={14} className="text-white" />
          </div>
          <span className="font-sora font-bold text-brand-text text-base">UniSpend</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-brand-muted">
          <a href="#features" className="hover:text-brand-text transition-colors">Funciones</a>
          <a href="#how" className="hover:text-brand-text transition-colors">Cómo funciona</a>
        </div>
        <Link
          to="/login"
          className="btn-primary text-sm py-2 px-4"
        >
          Empezar gratis
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative min-h-dvh flex items-center pt-20">
        {/* Bg glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-violet/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-brand-green/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="text-left"
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 text-xs text-brand-muted border border-white/10 rounded-full px-3 py-1 mb-6 bg-white/[0.03]">
                ✦ Sin tarjeta de crédito requerida
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-sora font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6"
            >
              Tus gastos,{' '}
              <span className="gradient-text">bajo control.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-brand-muted text-lg md:text-xl leading-relaxed mb-8 max-w-md"
            >
              La app financiera diseñada para la vida universitaria. Presupuestos, metas y análisis en un solo lugar.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary flex items-center gap-2 text-base">
                Crear cuenta gratis
                <ArrowRight size={16} />
              </Link>
              <a href="#preview" className="btn-ghost text-base">
                Ver demo
              </a>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="flex items-center gap-4 mt-8">
              {['Sin costos ocultos', 'Datos privados', 'PWA lista'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-brand-muted">
                  <CheckCircle2 size={12} className="text-brand-green" />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Three.js */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-[420px] lg:h-[520px] relative"
          >
            <div className="absolute inset-0 glow-violet rounded-3xl" />
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-brand-muted text-sm">Cargando...</div>}>
              <HeroScene />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* El problema */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <motion.p variants={fadeUp} custom={0} className="text-brand-violet text-sm font-medium mb-3">
            El problema
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="font-sora font-bold text-4xl md:text-5xl mb-12 max-w-xl"
          >
            ¿A fin de mes no sabés adónde fue la plata?
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {problems.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                variants={fadeUp}
                custom={i + 2}
                className="glass-hover rounded-2xl p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-violet/15 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand-violet" />
                </div>
                <h3 className="font-sora font-semibold text-brand-text mb-2">{title}</h3>
                <p className="text-brand-muted text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features bento */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.p variants={fadeUp} custom={0} className="text-brand-green text-sm font-medium mb-3">
            Funciones
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="font-sora font-bold text-4xl md:text-5xl mb-12 max-w-xl">
            Todo lo que necesitás, nada que no.
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[160px]">
            {features.map(({ icon: Icon, title, desc, size }, i) => (
              <motion.div
                key={title}
                variants={fadeUp}
                custom={i + 2}
                className={`glass-hover rounded-2xl p-5 flex flex-col justify-between ${size}`}
              >
                <div className="w-9 h-9 rounded-xl bg-brand-violet/15 flex items-center justify-center">
                  <Icon size={18} className="text-brand-violet" />
                </div>
                <div>
                  <h3 className="font-sora font-semibold text-brand-text text-sm mb-1">{title}</h3>
                  <p className="text-brand-muted text-xs leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* App preview */}
      <section id="preview" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="text-center mb-12"
        >
          <motion.p variants={fadeUp} custom={0} className="text-brand-violet text-sm font-medium mb-3">
            Vista previa
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="font-sora font-bold text-4xl md:text-5xl">
            Tu dashboard, de un vistazo.
          </motion.h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-3xl p-6 md:p-8 glow-violet max-w-3xl mx-auto"
        >
          {/* Mock dashboard */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-brand-muted text-xs mb-1">Buen día, Martina 👋</p>
              <p className="font-sora font-bold text-xl text-brand-text">Mayo 2026</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-violet/30 border border-brand-violet/40" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Saldo total', value: '$82.450', color: 'text-brand-green' },
              { label: 'Gastado', value: '$47.200', color: 'text-red-400' },
              { label: 'Ahorrado', value: '$18.000', color: 'text-brand-violet' },
              { label: 'Disponible', value: '$12.800', color: 'text-yellow-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/[0.04] rounded-xl p-3">
                <p className="text-brand-muted text-xs mb-1">{label}</p>
                <p className={`font-sora font-bold text-base ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { cat: 'Comida', pct: 78, color: '#FF6B6B' },
              { cat: 'Transporte', pct: 45, color: '#4ECDC4' },
              { cat: 'Educación', pct: 30, color: '#7C6EFF' },
              { cat: 'Entretenimiento', pct: 60, color: '#F7DC6F' },
            ].map(({ cat, pct, color }) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-brand-muted">{cat}</span>
                  <span style={{ color }}>{pct}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Cómo funciona */}
      <section id="how" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.p variants={fadeUp} custom={0} className="text-brand-violet text-sm font-medium mb-3 text-center">
            Cómo funciona
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="font-sora font-bold text-4xl md:text-5xl mb-16 text-center">
            Simple, rápido y efectivo.
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-brand-violet/40 to-transparent" />

            {steps.map(({ n, title, desc }, i) => (
              <motion.div key={n} variants={fadeUp} custom={i + 2} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center mx-auto mb-4">
                  <span className="font-sora font-bold text-brand-violet text-lg">{n}</span>
                </div>
                <h3 className="font-sora font-semibold text-brand-text text-lg mb-2">{title}</h3>
                <p className="text-brand-muted text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA final */}
      <section className="py-24 px-6 md:px-12">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={stagger}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.h2 variants={fadeUp} custom={0} className="font-sora font-extrabold text-4xl md:text-5xl mb-4">
            Tu futuro financiero empieza hoy.
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-brand-muted mb-8">
            Gratis para siempre en el plan básico.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Link to="/login" className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2">
              Crear cuenta gratis
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-violet flex items-center justify-center">
              <PieChart size={12} className="text-white" />
            </div>
            <span className="font-sora font-bold text-sm">UniSpend</span>
            <span className="text-brand-muted text-xs ml-2">La app financiera universitaria</span>
          </div>
          <p className="text-brand-muted text-xs">
            © 2026 UniSpend. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
