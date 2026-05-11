import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Target, BarChart2, Settings,
} from 'lucide-react'

const links = [
  { to: '/app/dashboard',    icon: LayoutDashboard, label: 'Inicio' },
  { to: '/app/transactions', icon: ArrowLeftRight,  label: 'Gastos' },
  { to: '/app/goals',        icon: Target,          label: 'Metas' },
  { to: '/app/analytics',    icon: BarChart2,       label: 'Análisis' },
  { to: '/app/settings',     icon: Settings,        label: 'Ajustes' },
]

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-bg/95 backdrop-blur-lg border-t border-white/[0.07]">
      <div className="flex items-center justify-around py-2 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                isActive ? 'text-brand-violet' : 'text-brand-muted'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium font-dm">{label}</span>
          </NavLink>
        ))}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  )
}
