import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Target, BarChart2, Plus } from 'lucide-react'
import useAppStore from '../../store/useAppStore'

const tabs = [
  { to: '/app/dashboard',    icon: LayoutDashboard, label: 'Inicio' },
  { to: '/app/transactions', icon: ArrowLeftRight,  label: 'Gastos' },
  { to: '/app/goals',        icon: Target,          label: 'Metas' },
  { to: '/app/analytics',    icon: BarChart2,       label: 'Análisis' },
]

const glassBar = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.07) 100%)',
  boxShadow: [
    'inset 0 1px 0 0 rgba(255,255,255,0.45)',
    'inset 0 -1px 0 0 rgba(0,0,0,0.25)',
    'inset 0 0 0 0.5px rgba(255,255,255,0.18)',
    '0 8px 28px rgba(0,0,0,0.45)',
  ].join(', '),
  backdropFilter: 'url(#liquid-glass) blur(14px) saturate(180%)',
  WebkitBackdropFilter: 'blur(14px) saturate(180%)',
}

const activePill = {
  background: 'linear-gradient(180deg, rgba(124,110,255,0.36), rgba(124,110,255,0.20))',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 14px rgba(124,110,255,0.5)',
}

const fabStyle = {
  background: 'linear-gradient(180deg, rgba(124,110,255,0.95), rgba(124,110,255,0.78))',
  boxShadow: [
    'inset 0 1px 0 rgba(255,255,255,0.45)',
    'inset 0 -1px 0 rgba(0,0,0,0.22)',
    '0 10px 26px rgba(124,110,255,0.55)',
  ].join(', '),
}

export default function BottomNav() {
  const openAddTx = useAppStore(s => s.openAddTx)

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 flex items-end justify-center gap-2.5 px-3 pb-[18px] pt-2 pointer-events-none">
      {/* Glass tab bar */}
      <div className="flex-1 max-w-[320px] h-16 rounded-full relative overflow-hidden pointer-events-auto">
        <div className="absolute inset-0 rounded-full" style={glassBar} />
        {/* Specular highlight */}
        <div
          className="absolute top-[3px] left-4 right-4 h-[13px] rounded-full pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))', opacity: 0.85 }}
        />
        {/* Tabs */}
        <div className="absolute inset-2 flex items-center">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 h-11 flex flex-col items-center justify-center gap-[2px] rounded-[18px] relative transition-all duration-[380ms] ease-spring ${
                  isActive ? 'text-white' : 'text-white/55'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 rounded-[18px]" style={activePill} />
                  )}
                  <Icon size={20} strokeWidth={1.8} className="relative z-10" />
                  <span className="text-[9.5px] font-semibold relative z-10 font-dm">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={openAddTx}
        className="w-16 h-16 rounded-full flex items-center justify-center relative pointer-events-auto active:scale-95 transition-transform duration-150 flex-shrink-0"
        style={fabStyle}
        aria-label="Agregar transacción"
      >
        {/* FAB specular */}
        <div
          className="absolute top-[3px] left-[14px] right-[14px] h-[13px] rounded-full pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))' }}
        />
        <Plus size={28} strokeWidth={2.4} className="text-white relative z-10" />
      </button>
    </nav>
  )
}
