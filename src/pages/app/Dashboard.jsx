import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Plus, TrendingUp, TrendingDown, Wallet, Target,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
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
  const h = new Date().getHours()
  if (h < 12) return 'Buen día'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const dateStr = now.toLocaleDateString('es-AR', {
  weekday: 'long', day: 'numeric', month: 'long',
})

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
})

export default function Dashboard() {
  const { user } = useAuth()
  const userDoc = useAppStore(s => s.userDoc)
  const format = useFormatCurrency()
  const { transactions, loading: txLoading } = useTransactions(user?.uid)
  const { categories, loading: catLoading } = useCategories(user?.uid)
  const { wallets, loading: walLoading } = useWallets(user?.uid)
  const loading = txLoading || catLoading || walLoading

  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const monthTx = useMemo(() =>
    transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return m === currentMonth
    }), [transactions])

  const totalSpent = useMemo(() =>
    monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTx])

  const totalIncome = useMemo(() =>
    monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTx])

  const totalBalance = useMemo(() =>
    wallets.reduce((s, w) => s + (w.balance || 0), 0), [wallets])

  const byCategory = useMemo(() => {
    const map = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount
    })
    return Object.entries(map)
      .map(([id, amount]) => ({ id, amount, cat: catMap[id] }))
      .filter(x => x.cat)
      .sort((a, b) => b.amount - a.amount)
  }, [monthTx, catMap])

  const recentTx = transactions.slice(0, 5)

  const metrics = [
    {
      label: 'Saldo total',
      value: format(totalBalance),
      icon: Wallet,
      color: '#7C6EFF',
      sub: `${wallets.length} billetera${wallets.length !== 1 ? 's' : ''}`,
      trend: null,
    },
    {
      label: 'Gastado este mes',
      value: format(totalSpent),
      icon: TrendingDown,
      color: '#FF6B6B',
      sub: `${monthTx.filter(t => t.type === 'expense').length} transacciones`,
      trend: 'down',
    },
    {
      label: 'Ingresos este mes',
      value: format(totalIncome),
      icon: TrendingUp,
      color: '#2FFFA0',
      sub: `${monthTx.filter(t => t.type === 'income').length} ingresos`,
      trend: 'up',
    },
    {
      label: 'Balance del mes',
      value: format(totalIncome - totalSpent),
      icon: Target,
      color: totalIncome - totalSpent >= 0 ? '#2FFFA0' : '#FF6B6B',
      sub: totalIncome - totalSpent >= 0 ? 'En positivo ✓' : 'En negativo',
      trend: totalIncome - totalSpent >= 0 ? 'up' : 'down',
    },
  ]

  return (
    <div className="p-5 md:p-7 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex items-start justify-between mb-7">
        <div>
          <p className="text-brand-muted text-sm mb-0.5 capitalize">{dateStr}</p>
          <h1 className="font-sora font-bold text-2xl md:text-3xl text-brand-text">
            {greeting()}, {userDoc?.name?.split(' ')[0] ?? '👋'}
          </h1>
        </div>
        <Link
          to="/app/transactions"
          className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo gasto</span>
        </Link>
      </motion.div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : metrics.map(({ label, value, icon: Icon, color, sub, trend }, i) => (
            <motion.div key={label} {...fadeUp(i * 0.07)} className="card">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: color + '20', color }}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                {trend === 'up' && <ArrowUpRight size={14} className="text-brand-green" />}
                {trend === 'down' && <ArrowDownRight size={14} className="text-red-400" />}
              </div>
              <p className="font-sora font-bold text-xl text-brand-text mb-0.5" style={{ color }}>
                {value}
              </p>
              <p className="text-brand-muted text-xs">{label}</p>
              <p className="text-brand-muted text-[10px] mt-0.5">{sub}</p>
            </motion.div>
          ))
        }
      </div>

      {/* Charts + recent */}
      <div className="grid lg:grid-cols-5 gap-5 mb-6">
        {/* Pie chart */}
        <motion.div {...fadeUp(0.2)} className="card lg:col-span-2">
          <h2 className="font-sora font-semibold text-sm text-brand-text mb-4">
            Gastos por categoría
          </h2>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : byCategory.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-brand-muted text-sm">
              Sin gastos este mes
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="amount"
                  nameKey="id"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {byCategory.map((entry) => (
                    <Cell key={entry.id} fill={entry.cat?.color ?? '#7C6EFF'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => format(v)}
                  contentStyle={{
                    background: '#13161F',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    fontFamily: 'DM Sans',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-2 mt-2">
            {byCategory.slice(0, 4).map(({ id, amount, cat }) => (
              <div key={id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat?.color }} />
                <span className="text-brand-muted text-xs flex-1 truncate">{cat?.name}</span>
                <span className="text-brand-text text-xs font-medium">{format(amount)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent transactions */}
        <motion.div {...fadeUp(0.25)} className="card lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sora font-semibold text-sm text-brand-text">Últimas transacciones</h2>
            <Link to="/app/transactions" className="text-brand-violet text-xs hover:underline">
              Ver todas
            </Link>
          </div>
          {loading ? (
            Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
          ) : recentTx.length === 0 ? (
            <div className="py-8 text-center text-brand-muted text-sm">
              <p>No hay transacciones aún.</p>
              <Link to="/app/transactions" className="text-brand-violet mt-2 inline-block text-xs hover:underline">
                Agregar la primera →
              </Link>
            </div>
          ) : (
            <div className="space-y-1 -mx-1">
              {recentTx.map((tx) => {
                const cat = catMap[tx.categoryId]
                const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                    <CategoryIcon
                      icon={cat?.icon ?? 'MoreHorizontal'}
                      color={cat?.color ?? '#7C6EFF'}
                      size={16}
                      className="w-9 h-9 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-brand-text text-sm font-medium truncate">{tx.description || cat?.name}</p>
                      <p className="text-brand-muted text-xs">
                        {d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold font-sora ${tx.type === 'income' ? 'text-brand-green' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{format(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Budget summary mini */}
      <motion.div {...fadeUp(0.3)} className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sora font-semibold text-sm text-brand-text">Balance de billeteras</h2>
          <Link to="/app/budgets" className="text-brand-violet text-xs hover:underline">
            Ver presupuestos
          </Link>
        </div>
        {loading ? (
          <div className="skeleton h-10 rounded-lg" />
        ) : wallets.length === 0 ? (
          <p className="text-brand-muted text-sm">Sin billeteras configuradas.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {wallets.map(w => (
              <div
                key={w.id}
                className="flex items-center gap-2.5 bg-white/[0.04] rounded-xl px-3 py-2"
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: w.color }} />
                <span className="text-brand-muted text-xs">{w.name}</span>
                <span className="text-brand-text text-sm font-semibold font-sora">{format(w.balance)}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
