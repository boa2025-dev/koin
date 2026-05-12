import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { useAuth } from '../../services/auth'
import { useTransactions } from '../../services/transactions'
import { useCategories } from '../../services/categories'
import { useBudgets } from '../../services/budgets'
import useFormatCurrency from '../../hooks/useFormatCurrency'
import CategoryIcon from '../../components/ui/CategoryIcon'
import { SkeletonCard } from '../../components/ui/Skeleton'

const padMonth = (y, m) => `${y}-${String(m).padStart(2, '0')}`
const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const fullMonths  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const tooltip = {
  background: '#13161F', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, fontFamily: 'DM Sans', fontSize: 12, color: '#F0F0F5',
}

const budgetColor = (pct) => {
  if (pct >= 100) return '#FF6B6B'
  if (pct >= 83)  return '#F7C56F'
  return '#2FFFA0'
}

// ─── Mobile Analytics ─────────────────────────────────────────────────────────
function MobileAnalytics({ year, month, setYear, setMonth, transactions, categories, budgets, format, loading }) {
  const monthStr = padMonth(year, month)
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const monthTx = useMemo(() =>
    transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      return padMonth(d.getFullYear(), d.getMonth() + 1) === monthStr
    }), [transactions, monthStr])

  const totalSpent  = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  const categoryData = useMemo(() => {
    const map = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount
    })
    return Object.entries(map)
      .map(([id, amount]) => ({ id, name: catMap[id]?.name ?? id, amount, color: catMap[id]?.color ?? '#7C6EFF', icon: catMap[id]?.icon }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthTx, catMap])

  const spentByCategory = useMemo(() => {
    const map = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount
    })
    return map
  }, [monthTx])

  const prevM = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  const nextM = () => { if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }

  // Donut SVG data — 5 arcs
  const donutData = categoryData.slice(0, 5)
  const donutTotal = donutData.reduce((s, d) => s + d.amount, 0) || 1
  const circumference = 2 * Math.PI * 38
  let offset = 0
  const arcs = donutData.map(d => {
    const dash = (d.amount / donutTotal) * circumference - 3
    const arc = { ...d, dash: Math.max(0, dash), offset }
    offset += (d.amount / donutTotal) * circumference
    return arc
  })

  return (
    <div className="px-5 pt-safe-page pb-safe-page space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-sora font-bold text-[26px] tracking-tight text-brand-text" style={{ letterSpacing: '-0.6px' }}>Análisis</h1>
        <p className="text-brand-muted text-[10px] mt-0.5">{fullMonths[month - 1]} {year} · Presupuesto</p>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between">
        <button onClick={prevM} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-brand-muted hover:text-brand-text">
          <ChevronLeft size={18} />
        </button>
        <span className="font-sora font-semibold text-sm text-brand-text">{fullMonths[month - 1]} {year}</span>
        <button onClick={nextM} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-brand-muted hover:text-brand-text">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Donut card */}
      <div className="card">
        {loading ? <div className="skeleton h-36 rounded-xl" /> : categoryData.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-brand-muted text-sm">Sin gastos este mes</div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Custom SVG donut */}
            <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
              <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
                {arcs.map((arc, i) => (
                  <circle key={i} cx="48" cy="48" r="38" fill="none" stroke={arc.color} strokeWidth="14"
                    strokeDasharray={`${arc.dash} ${circumference}`}
                    strokeDashoffset={-arc.offset} />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[8px] text-brand-muted uppercase tracking-wide leading-none">Gastado</p>
                <p className="font-sora font-bold text-[15px] text-brand-text leading-tight mt-0.5">
                  {format(totalSpent).replace(/\s/g,' ')}
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-[5px]">
              {donutData.map(({ id, name, amount, color }) => (
                <div key={id} className="flex items-center gap-1.5">
                  <div className="w-[7px] h-[7px] rounded-[2px] shrink-0" style={{ background: color }} />
                  <span className="text-[10px] text-brand-text flex-1 truncate">{name}</span>
                  <span className="text-[9px] text-brand-muted">{totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Budget bars */}
      <div>
        <p className="font-sora font-semibold text-[12px] text-brand-text mb-2">Presupuestos</p>
        {loading ? (
          Array(3).fill(0).map((_, i) => <SkeletonCard key={i} className="mb-2 h-16" />)
        ) : budgets.length === 0 ? (
          <div className="card text-center py-6 text-brand-muted text-sm">Sin presupuestos configurados</div>
        ) : (
          <div className="space-y-2">
            {budgets.map(b => {
              const cat = catMap[b.categoryId]
              const spent = spentByCategory[b.categoryId] || 0
              const pct = Math.round((spent / b.amount) * 100)
              const color = budgetColor(pct)
              const over = spent > b.amount

              return (
                <div key={b.id} className="card" style={{ padding: '10px 12px' }}>
                  <div className="flex items-center gap-2.5">
                    {cat && (
                      <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center shrink-0"
                        style={{ background: (cat.color ?? '#7C6EFF') + '28', color: cat.color ?? '#7C6EFF' }}>
                        <CategoryIcon icon={cat.icon} color={cat.color} size={12} className="w-full h-full" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sora font-semibold text-[11px] text-brand-text">{cat?.name ?? 'Sin cat.'}</span>
                        <span className="text-[9px]" style={{ color: over ? '#FF6B6B' : 'rgba(255,255,255,0.55)' }}>
                          {format(spent)} / {format(b.amount)}
                        </span>
                      </div>
                      <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            background: color,
                            boxShadow: over ? `0 0 8px ${color}99` : 'none',
                          }}
                        />
                      </div>
                      {over && <p className="text-[8px] mt-0.5" style={{ color: '#FF6B6B' }}>Excedido por {format(spent - b.amount)}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Insight */}
      {!loading && categoryData[0] && (
        <div className="card" style={{ background: 'rgba(124,110,255,0.08)', border: '1px solid rgba(124,110,255,0.2)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={13} className="text-brand-violet" />
            <span className="text-brand-violet text-[10px] font-semibold uppercase tracking-wide">Insight</span>
          </div>
          <p className="text-brand-text text-[12px] leading-relaxed">
            Tu mayor gasto fue en <strong>{categoryData[0].name}</strong> con {format(categoryData[0].amount)},
            el{' '}<strong>{totalSpent > 0 ? Math.round((categoryData[0].amount / totalSpent) * 100) : 0}%</strong> del total.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Desktop Analytics (unchanged) ───────────────────────────────────────────
function DesktopAnalytics({ year, month, setYear, setMonth, transactions, categories, budgets, format, loading }) {
  const monthStr = padMonth(year, month)
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const monthTx = useMemo(() =>
    transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      return padMonth(d.getFullYear(), d.getMonth() + 1) === monthStr
    }), [transactions, monthStr])

  const totalSpent  = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const avgDaily    = totalSpent / new Date(year, month, 0).getDate()

  const dailyData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const map = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      map[d.getDate()] = (map[d.getDate()] || 0) + t.amount
    })
    return Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, gasto: map[i + 1] || 0 }))
  }, [monthTx, year, month])

  const categoryData = useMemo(() => {
    const map = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount
    })
    return Object.entries(map)
      .map(([id, amount]) => ({ id, name: catMap[id]?.name ?? id, amount, color: catMap[id]?.color ?? '#7C6EFF' }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthTx, catMap])

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 1 - (5 - i), 1)
      const mStr = padMonth(d.getFullYear(), d.getMonth() + 1)
      const income  = transactions.filter(t => { const td = t.date?.toDate ? t.date.toDate() : new Date(t.date); return padMonth(td.getFullYear(), td.getMonth()+1) === mStr && t.type === 'income' }).reduce((s,t) => s+t.amount, 0)
      const expense = transactions.filter(t => { const td = t.date?.toDate ? t.date.toDate() : new Date(t.date); return padMonth(td.getFullYear(), td.getMonth()+1) === mStr && t.type === 'expense' }).reduce((s,t) => s+t.amount, 0)
      return { month: monthNames[d.getMonth()], gasto: expense, ingreso: income }
    })
  }, [transactions, year, month])

  const prevM = () => { if (month === 1) { setYear(y => y-1); setMonth(12) } else setMonth(m => m-1) }
  const nextM = () => { if (month === 12) { setYear(y => y+1); setMonth(1) } else setMonth(m => m+1) }
  const topCat = categoryData[0]

  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-sora font-bold text-2xl text-brand-text">Análisis</h1><p className="text-brand-muted text-sm">Tendencias y patrones</p></div>
      </div>
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={prevM} className="p-2 rounded-xl hover:bg-white/10 text-brand-muted hover:text-brand-text"><ChevronLeft size={20} /></button>
        <span className="font-sora font-semibold text-lg text-brand-text w-44 text-center">{fullMonths[month-1]} {year}</span>
        <button onClick={nextM} className="p-2 rounded-xl hover:bg-white/10 text-brand-muted hover:text-brand-text"><ChevronRight size={20} /></button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card"><TrendingDown size={18} className="text-red-400 mb-2" /><p className="font-sora font-bold text-lg text-red-400">{format(totalSpent)}</p><p className="text-brand-muted text-xs">Total gastado</p></div>
        <div className="card"><TrendingUp size={18} className="text-brand-green mb-2" /><p className="font-sora font-bold text-lg text-brand-green">{format(totalIncome)}</p><p className="text-brand-muted text-xs">Total ingresos</p></div>
        <div className="card"><Zap size={18} className="text-brand-violet mb-2" /><p className="font-sora font-bold text-lg text-brand-violet">{format(avgDaily)}</p><p className="text-brand-muted text-xs">Promedio diario</p></div>
      </div>
      <div className="card mb-5">
        <h2 className="font-sora font-semibold text-sm text-brand-text mb-4">Gastos diarios</h2>
        {loading ? <div className="skeleton h-48 rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyData}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <XAxis dataKey="day" tick={{ fill: '#8B8FA3', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B8FA3', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={tooltip} formatter={v => [format(v), 'Gasto']} />
              <Line type="monotone" dataKey="gasto" stroke="#7C6EFF" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#7C6EFF' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <h2 className="font-sora font-semibold text-sm text-brand-text mb-4">Últimos 6 meses</h2>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                <XAxis dataKey="month" tick={{ fill: '#8B8FA3', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B8FA3', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={tooltip} formatter={v => format(v)} />
                <Bar dataKey="gasto" fill="#FF6B6B" radius={[4,4,0,0]} name="Gasto" />
                <Bar dataKey="ingreso" fill="#2FFFA0" radius={[4,4,0,0]} name="Ingreso" />
                <Legend wrapperStyle={{ fontSize: 11, color: '#8B8FA3', fontFamily: 'DM Sans' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h2 className="font-sora font-semibold text-sm text-brand-text mb-4">Por categoría</h2>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : categoryData.length === 0
            ? <div className="h-48 flex items-center justify-center text-brand-muted text-sm">Sin datos</div>
            : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="amount" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                      {categoryData.map(e => <Cell key={e.id} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltip} formatter={v => format(v)} />
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
              </>
            )
          }
        </div>
      </div>
      {!loading && topCat && (
        <div className="card" style={{ background: 'rgba(124,110,255,0.08)', border: '1px solid rgba(124,110,255,0.2)' }}>
          <div className="flex items-center gap-2 mb-1"><Zap size={15} className="text-brand-violet" /><span className="text-brand-violet text-xs font-semibold">Insight del mes</span></div>
          <p className="text-brand-text text-sm">Tu mayor gasto fue en <strong>{topCat.name}</strong> con {format(topCat.amount)}, el <strong>{totalSpent > 0 ? Math.round((topCat.amount/totalSpent)*100) : 0}%</strong> del total.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Analytics() {
  const { user } = useAuth()
  const format = useFormatCurrency()
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const monthStr = padMonth(year, month)

  const { transactions, loading: txL } = useTransactions(user?.uid)
  const { categories,   loading: catL } = useCategories(user?.uid)
  const { budgets,      loading: bL   } = useBudgets(user?.uid, monthStr)
  const loading = txL || catL || bL

  const props = { year, month, setYear, setMonth, transactions, categories, budgets, format, loading }

  return (
    <>
      <div className="md:hidden"><MobileAnalytics {...props} /></div>
      <div className="hidden md:block"><DesktopAnalytics {...props} /></div>
    </>
  )
}
