import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Bell, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import { useAuth } from '../../services/auth'
import { useTransactions } from '../../services/transactions'
import { useCategories } from '../../services/categories'
import { useWallets } from '../../services/wallets'
import useAppStore from '../../store/useAppStore'
import useFormatCurrency from '../../hooks/useFormatCurrency'
import CategoryIcon from '../../components/ui/CategoryIcon'
import { SkeletonCard, SkeletonRow } from '../../components/ui/Skeleton'

const now = new Date()
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

const greeting = () => {
  const h = now.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
})

// ─── Desktop Dashboard (unchanged) ───────────────────────────────────────────
function DesktopDashboard({ userDoc, format, transactions, categories, wallets, loading }) {
  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const monthTx = useMemo(() =>
    transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonth
    }), [transactions])

  const totalSpent  = useMemo(() => monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTx])
  const totalIncome = useMemo(() => monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTx])
  const totalBalance = useMemo(() => wallets.reduce((s, w) => s + (w.balance || 0), 0), [wallets])

  const byCategory = useMemo(() => {
    const map = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount
    })
    return Object.entries(map).map(([id, amount]) => ({ id, amount, cat: catMap[id] }))
      .filter(x => x.cat).sort((a, b) => b.amount - a.amount)
  }, [monthTx, catMap])

  const metrics = [
    { label: 'Saldo total',      value: format(totalBalance),              color: '#7C6EFF', trend: null },
    { label: 'Gastado este mes', value: format(totalSpent),                color: '#FF6B6B', trend: 'down' },
    { label: 'Ingresos este mes',value: format(totalIncome),               color: '#2FFFA0', trend: 'up' },
    { label: 'Balance del mes',  value: format(totalIncome - totalSpent),  color: totalIncome - totalSpent >= 0 ? '#2FFFA0' : '#FF6B6B', trend: totalIncome - totalSpent >= 0 ? 'up' : 'down' },
  ]

  return (
    <div className="p-5 md:p-7 max-w-6xl mx-auto">
      <motion.div {...fadeUp(0)} className="flex items-start justify-between mb-7">
        <div>
          <p className="text-brand-muted text-sm mb-0.5 capitalize">{greeting()}</p>
          <h1 className="font-sora font-bold text-2xl md:text-3xl text-brand-text">
            {userDoc?.name?.split(' ')[0] ?? '👋'}
          </h1>
        </div>
        <Link to="/app/transactions" className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
          + Nuevo gasto
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) :
          metrics.map(({ label, value, color, trend }, i) => (
            <motion.div key={label} {...fadeUp(i * 0.07)} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '20', color }} />
                {trend === 'up' && <ArrowUpRight size={14} className="text-brand-green" />}
                {trend === 'down' && <ArrowDownRight size={14} className="text-red-400" />}
              </div>
              <p className="font-sora font-bold text-xl mb-0.5" style={{ color }}>{value}</p>
              <p className="text-brand-muted text-xs">{label}</p>
            </motion.div>
          ))
        }
      </div>

      <div className="grid lg:grid-cols-5 gap-5 mb-6">
        <motion.div {...fadeUp(0.2)} className="card lg:col-span-2">
          <h2 className="font-sora font-semibold text-sm text-brand-text mb-4">Gastos por categoría</h2>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : byCategory.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-brand-muted text-sm">Sin gastos este mes</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={byCategory} dataKey="amount" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {byCategory.map(e => <Cell key={e.id} fill={e.cat?.color ?? '#7C6EFF'} />)}
                  </Pie>
                  <Tooltip formatter={v => format(v)} contentStyle={{ background:'#13161F', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, fontFamily:'DM Sans', fontSize:12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {byCategory.slice(0, 4).map(({ id, amount, cat }) => (
                  <div key={id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat?.color }} />
                    <span className="text-brand-muted text-xs flex-1 truncate">{cat?.name}</span>
                    <span className="text-brand-text text-xs font-medium">{format(amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        <motion.div {...fadeUp(0.25)} className="card lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sora font-semibold text-sm text-brand-text">Últimas transacciones</h2>
            <Link to="/app/transactions" className="text-brand-violet text-xs hover:underline">Ver todas</Link>
          </div>
          {loading ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />) :
            transactions.slice(0, 5).map((tx) => {
              const cat = catMap[tx.categoryId]
              const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
              return (
                <div key={tx.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <CategoryIcon icon={cat?.icon ?? 'MoreHorizontal'} color={cat?.color ?? '#7C6EFF'} size={16} className="w-9 h-9 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-text text-sm font-medium truncate">{tx.description || cat?.name}</p>
                    <p className="text-brand-muted text-xs">{d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <span className={`text-sm font-semibold font-sora ${tx.type === 'income' ? 'text-brand-green' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{format(tx.amount)}
                  </span>
                </div>
              )
            })
          }
        </motion.div>
      </div>
    </div>
  )
}

// ─── Mobile Dashboard ─────────────────────────────────────────────────────────
function MobileDashboard({ userDoc, format, transactions, categories, wallets, loading }) {
  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const monthTx = useMemo(() =>
    transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonth
    }), [transactions])

  const totalSpent  = useMemo(() => monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTx])
  const totalIncome = useMemo(() => monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTx])
  const totalBalance = useMemo(() => wallets.reduce((s, w) => s + (w.balance || 0), 0), [wallets])

  // Last 7 days bar chart data
  const weekBars = useMemo(() => {
    const labels = ['D','L','M','X','J','V','S']
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (6 - i))
      const dayStr = d.toDateString()
      const total = transactions
        .filter(t => t.type === 'expense' && (t.date?.toDate ? t.date.toDate() : new Date(t.date)).toDateString() === dayStr)
        .reduce((s, t) => s + t.amount, 0)
      return { label: labels[d.getDay()], total, isToday: i === 6 }
    })
  }, [transactions])

  const weekMax = Math.max(...weekBars.map(b => b.total), 1)

  const recentTx = transactions.slice(0, 3)
  const initials = (userDoc?.name ?? '?').charAt(0).toUpperCase()

  return (
    <div className="px-5 pt-4 pb-36 space-y-4">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <p className="text-brand-muted text-[10px] uppercase tracking-widest font-dm">{greeting()}</p>
          <p className="font-sora font-semibold text-base text-brand-text mt-0.5">
            {userDoc?.name?.split(' ')[0] ?? 'Bienvenido'} 👋
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center relative">
            <Bell size={15} className="text-white" />
          </button>
          <Link to="/app/settings"
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #FF8E72, #B57BFF)' }}
          >
            {initials}
          </Link>
        </div>
      </motion.div>

      {/* Hero balance */}
      <motion.div {...fadeUp(0.06)}>
        <p className="text-brand-muted text-[10px] uppercase tracking-widest font-dm mb-1">Saldo total</p>
        {loading
          ? <div className="skeleton h-10 w-48 rounded-xl" />
          : <p className="font-sora font-bold text-4xl tracking-tight text-brand-text" style={{ letterSpacing: '-1px' }}>
              {format(totalBalance)}
            </p>
        }
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1"
            style={{ background: 'rgba(47,255,160,0.12)', color: '#2FFFA0', border: '1px solid rgba(47,255,160,0.3)' }}>
            +{format(totalIncome)} este mes
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {wallets.length} billetera{wallets.length !== 1 ? 's' : ''}
          </span>
        </div>
      </motion.div>

      {/* Mini stats */}
      <motion.div {...fadeUp(0.1)} className="grid grid-cols-2 gap-3">
        {[
          { label: 'Ingresos', value: totalIncome, color: '#2FFFA0', bg: 'rgba(47,255,160,0.18)', dir: 'up' },
          { label: 'Gastos',   value: totalSpent,  color: '#FF6B6B', bg: 'rgba(255,107,107,0.18)', dir: 'down' },
        ].map(({ label, value, color, bg, dir }) => (
          <div key={label} className="card" style={{ padding: '12px 14px' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center" style={{ background: bg, color }}>
                {dir === 'up'
                  ? <ArrowUpRight size={12} strokeWidth={2.4} />
                  : <ArrowDownRight size={12} strokeWidth={2.4} />
                }
              </div>
              <span className="text-[9px] text-brand-muted uppercase tracking-wide font-dm">{label}</span>
            </div>
            {loading
              ? <div className="skeleton h-5 w-24 rounded" />
              : <p className="font-sora font-bold text-[15px]" style={{ color }}>{format(value)}</p>
            }
          </div>
        ))}
      </motion.div>

      {/* Weekly chart */}
      <motion.div {...fadeUp(0.14)} className="card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[9px] text-brand-muted uppercase tracking-widest font-dm">Esta semana</p>
            <p className="font-sora font-semibold text-sm text-brand-text mt-0.5">
              {loading ? '...' : format(weekBars.reduce((s, b) => s + b.total, 0))}
            </p>
          </div>
        </div>
        <div className="flex items-end gap-[5px] h-14">
          {weekBars.map(({ label, total, isToday }, i) => {
            const h = weekMax > 0 ? Math.max(8, Math.round((total / weekMax) * 100)) : 8
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-[5px]"
                  style={{
                    height: `${h}%`,
                    minHeight: 8,
                    background: isToday
                      ? 'linear-gradient(180deg, #7C6EFF, rgba(124,110,255,0.4))'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                    boxShadow: isToday ? '0 2px 10px rgba(124,110,255,0.4)' : 'none',
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex gap-[5px] mt-1">
          {weekBars.map(({ label }, i) => (
            <p key={i} className="flex-1 text-center text-[8px] text-brand-muted">{label}</p>
          ))}
        </div>
      </motion.div>

      {/* Recent transactions */}
      <motion.div {...fadeUp(0.18)} className="card" style={{ padding: 0 }}>
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-sora font-semibold text-[13px] text-brand-text">Últimos movimientos</p>
          <Link to="/app/transactions" className="flex items-center gap-0.5 text-brand-violet text-[11px]">
            Ver todos <ChevronRight size={12} />
          </Link>
        </div>
        {loading
          ? Array(3).fill(0).map((_, i) => <SkeletonRow key={i} />)
          : recentTx.length === 0
          ? <p className="text-brand-muted text-sm text-center py-6">Sin transacciones aún.</p>
          : recentTx.map((tx, i) => {
              const cat = catMap[tx.categoryId]
              const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                >
                  <CategoryIcon icon={cat?.icon ?? 'MoreHorizontal'} color={cat?.color ?? '#7C6EFF'} size={14} className="w-8 h-8 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-brand-text truncate">{tx.description || cat?.name || 'Sin descripción'}</p>
                    <p className="text-[10px] text-brand-muted">
                      {cat?.name} · {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`font-sora font-semibold text-[12px] ${tx.type === 'income' ? 'text-brand-green' : 'text-brand-red'}`}>
                    {tx.type === 'income' ? '+' : '−'}{format(tx.amount)}
                  </span>
                </div>
              )
            })
        }
      </motion.div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const userDoc = useAppStore(s => s.userDoc)
  const format = useFormatCurrency()
  const { transactions, loading: txL } = useTransactions(user?.uid)
  const { categories, loading: catL } = useCategories(user?.uid)
  const { wallets, loading: walL } = useWallets(user?.uid)
  const loading = txL || catL || walL

  const props = { userDoc, format, transactions, categories, wallets, loading }

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileDashboard {...props} />
      </div>
      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopDashboard {...props} />
      </div>
    </>
  )
}
