import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ArrowLeftRight, Target, PieChart,
  BarChart2, Settings, LogOut, Wallet, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { logOut } from '../../services/auth'
import useAppStore from '../../store/useAppStore'
import toast from 'react-hot-toast'

const links = [
  { to: '/app/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/transactions', icon: ArrowLeftRight,  label: 'Transacciones' },
  { to: '/app/budgets',      icon: Wallet,          label: 'Presupuestos' },
  { to: '/app/goals',        icon: Target,          label: 'Metas' },
  { to: '/app/analytics',    icon: BarChart2,       label: 'Análisis' },
  { to: '/app/settings',     icon: Settings,        label: 'Configuración' },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, userDoc } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logOut()
    navigate('/')
    toast.success('Sesión cerrada')
  }

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 220 : 68 }}
      transition={{ type: 'spring', damping: 25, stiffness: 260 }}
      className="hidden md:flex flex-col h-full bg-white/[0.03] border-r border-white/[0.07] relative shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.07]">
        <div className="w-8 h-8 rounded-xl bg-brand-violet flex items-center justify-center shrink-0">
          <PieChart size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-sora font-bold text-brand-text text-base whitespace-nowrap"
            >
              UniSpend
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto no-scrollbar">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-violet/15 text-brand-violet'
                  : 'text-brand-muted hover:text-brand-text hover:bg-white/5'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.8} className="shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-2 py-3 border-t border-white/[0.07]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-brand-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={18} strokeWidth={1.8} className="shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-brand-bg border border-white/10 flex items-center justify-center text-brand-muted hover:text-brand-text transition-colors z-10"
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </motion.aside>
  )
}
