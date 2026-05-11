import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { useAuth } from '../../services/auth'
import { useTransactions } from '../../services/transactions'
import { useCategories } from '../../services/categories'
import useFormatCurrency from '../../hooks/useFormatCurrency'
import { SkeletonCard } from '../../components/ui/Skeleton'

const padMonth = (y, m) => `${y}-${String(m).padStart(2, '0')}`
const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const fullMonthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const tooltipStyle = {
  background: '#13161F',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  fontFamily: 'DM Sans',
  fontSize: 12,
  color: '#F0F0F5',
}

export default function Analytics() {
  const { user } = useAuth()
  const format = useFormatCurrency()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const monthStr = padMonth(year, month)

  const { transactions, loading: txLoading } = useTransactions(user?.uid)
  const { categories, loading: catLoading } = useCategories(user?.uid)
  const loading = txLoading || catLoading

  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const monthTx = useMemo(() =>
    transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      return padMonth(d.getFullYear(), d.getMonth() + 1) === monthStr
    }), [transactions, monthStr])

  // Daily spending line chart
  const dailyData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const map = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      const day = d.getDate()
      map[day] = (map[day] || 0) + t.amount
    })
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      gasto: map[i + 1] || 0,
    }))
  }, [monthTx, year, month])

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount
    })
    return Object.entries(map)
      .map(([id, amount]) => ({ id, name: catMap[id]?.name ?? id, amount, color: catMap[id]?.color ?? '#7C6EFF' }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthTx, catMap])

  // Monthly comparison (last 6 months)
  const monthlyData = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      const mStr = padMonth(d.getFullYear(), d.getMonth() + 1)
      const income = transactions
        .filter(t => {
          const td = t.date?.toDate ? t.date.toDate() : new Date(t.date)
          return padMonth(td.getFullYear(), td.getMonth() + 1) === mStr && t.type === 'income'
        })
        .reduce((s, t) => s + t.amount, 0)
      const expense = transactions
        .filter(t => {
          const td = t.date?.toDate ? t.date.toDate() : new Date(t.date)
          return padMonth(td.getFullYear(), td.getMonth() + 1) === mStr && t.type === 'expense'
        })
        .reduce((s, t) => s + t.amount, 0)
      result.push({ month: monthNames[d.getMonth()], gasto: expense, ingreso: income })
    }
    return result
  }, [transactions, year, month])

  const totalSpent = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const topCategory = categoryData[0]
  const avgDaily = totalSpent / new Date(year, month, 0).getDate()

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-sora font-bold text-2xl text-brand-text">Análisis</h1>
          <p className="text-brand-muted text-sm">Tendencias y patrones de gasto</p>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/10 text-brand-muted hover:text-brand-text transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="font-sora font-semibold text-lg text-brand-text w-44 text-center">
          {fullMonthNames[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/10 text-brand-muted hover:text-brand-text transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary metrics */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <TrendingDown size={18} className="text-red-400 mb-2" />
            <p className="font-sora font-bold text-lg text-red-400">{format(totalSpent)}</p>
            <p className="text-brand-muted text-xs">Total gastado</p>
          </div>
          <div className="card">
            <TrendingUp size={18} className="text-brand-green mb-2" />
            <p className="font-sora font-bold text-lg text-brand-green">{format(totalIncome)}</p>
            <p className="text-brand-muted text-xs">Total ingresos</p>
          </div>
          <div className="card col-span-2 md:col-span-1">
            <Zap size={18} className="text-brand-violet mb-2" />
            <p className="font-sora font-bold text-lg text-brand-violet">{format(avgDaily)}</p>
            <p className="text-brand-muted text-xs">Promedio diario</p>
          </div>
        </div>
      )}

      {/* Daily line chart */}
      <div className="card mb-5">
        <h2 className="font-sora font-semibold text-sm text-brand-text mb-4">Gastos diarios</h2>
        {loading ? (
          <div className="skeleton h-48 rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyData}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => format(v).replace(',00', '')} width={60} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [format(v), 'Gasto']} />
              <Line type="monotone" dataKey="gasto" stroke="#7C6EFF" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#7C6EFF' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar + Pie */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Monthly comparison */}
        <div className="card">
          <h2 className="font-sora font-semibold text-sm text-brand-text mb-4">Últimos 6 meses</h2>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} width={55} tickFormatter={v => format(v).replace(',00', '')} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => format(v)} />
                <Bar dataKey="gasto" fill="#FF6B6B" radius={[4, 4, 0, 0]} name="Gasto" />
                <Bar dataKey="ingreso" fill="#2FFFA0" radius={[4, 4, 0, 0]} name="Ingreso" />
                <Legend wrapperStyle={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category pie */}
        <div className="card">
          <h2 className="font-sora font-semibold text-sm text-brand-text mb-4">Por categoría</h2>
          {loading ? <div className="skeleton h-48 rounded-xl" /> :
           categoryData.length === 0 ? (
             <div className="h-48 flex items-center justify-center text-brand-muted text-sm">Sin datos este mes</div>
           ) : (
            <div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={categoryData} dataKey="amount" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                    {categoryData.map(e => <Cell key={e.id} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={v => format(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {categoryData.slice(0, 5).map(({ id, name, amount, color }) => (
                  <div key={id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-brand-muted text-xs flex-1 truncate">{name}</span>
                    <span className="text-brand-text text-xs font-medium font-sora">{format(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insight */}
      {!loading && topCategory && (
        <div className="card bg-brand-violet/[0.08] border-brand-violet/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={15} className="text-brand-violet" />
            <span className="text-brand-violet text-xs font-semibold">Insight del mes</span>
          </div>
          <p className="text-brand-text text-sm">
            Tu mayor gasto fue en <strong>{topCategory.name}</strong> con {format(topCategory.amount)},
            representando el{' '}
            <strong>{totalSpent > 0 ? Math.round((topCategory.amount / totalSpent) * 100) : 0}%</strong> del total gastado.
          </p>
        </div>
      )}
    </div>
  )
}
