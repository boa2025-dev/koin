import { useState, useEffect } from 'react'
import * as Icons from 'lucide-react'
import { motion } from 'framer-motion'
import { User, Wallet, Trash2, Plus, ChevronDown, LogOut, Edit3, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../services/auth'
import { logOut } from '../../services/auth'
import { updateUserDoc } from '../../services/user'
import { useWallets, addWallet, updateWallet, deleteWallet } from '../../services/wallets'
import { useCategories, addCategory, deleteCategory } from '../../services/categories'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import useAppStore from '../../store/useAppStore'
import toast from 'react-hot-toast'

const currencies   = ['ARS', 'USD', 'EUR', 'CLP', 'BRL', 'MXN']
const walletColors = ['#7C6EFF', '#2FFFA0', '#FF6B6B', '#4ECDC4', '#F7DC6F', '#E91E63', '#3498DB', '#E67E22']
const CAT_COLORS   = ['#FF6B6B', '#4ECDC4', '#7C6EFF', '#F7DC6F', '#2ECC71', '#E91E63', '#3498DB', '#E67E22', '#9B59B6', '#2FFFA0', '#FF8E72', '#5BC0EB', '#F39C12', '#1ABC9C', '#D35400', '#8E44AD']
const CAT_ICONS    = [
  'Utensils','Coffee','Pizza','ShoppingCart','ShoppingBag',
  'Bus','Car','Plane','Bike','Fuel',
  'Home','Laptop','Smartphone','Tv','Headphones',
  'BookOpen','GraduationCap','Gamepad2','Film','Music',
  'HeartPulse','Pill','Dumbbell','Baby',
  'Shirt','Scissors','Gift','PartyPopper',
  'Briefcase','TrendingUp','DollarSign','CreditCard',
  'Repeat','Zap','Star','MoreHorizontal',
]

function IconPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto pr-1">
      {CAT_ICONS.map(name => {
        const Icon = Icons[name] ?? Icons.MoreHorizontal
        const sel = value === name
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
            style={sel
              ? { background: 'rgba(124,110,255,0.25)', border: '1.5px solid rgba(124,110,255,0.7)', color: '#7C6EFF' }
              : { background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }
            }
          >
            <Icon size={15} strokeWidth={1.8} />
          </button>
        )
      })}
    </div>
  )
}

export default function AppSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { userDoc, setUserDoc } = useAppStore()
  const { wallets } = useWallets(user?.uid)
  const { categories } = useCategories(user?.uid)

  // Profile
  const [name, setName]         = useState(userDoc?.name ?? '')
  const [currency, setCurrency] = useState(userDoc?.currency ?? 'ARS')
  const [savingProfile, setSavingProfile] = useState(false)

  // Wallets
  const [walletModal, setWalletModal]     = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)
  const [wForm, setWForm]                 = useState({ name: '', balance: '', color: '#7C6EFF' })
  const [deleteWalletId, setDeleteWalletId] = useState(null)
  const [savingWallet, setSavingWallet]   = useState(false)

  // Categories
  const [catModal, setCatModal]         = useState(false)
  const [cForm, setCForm]               = useState({ name: '', type: 'expense', color: '#FF6B6B', icon: 'Utensils' })
  const [deleteCatId, setDeleteCatId]   = useState(null)
  const [savingCat, setSavingCat]       = useState(false)
  const [catTab, setCatTab]             = useState('expense')

  useEffect(() => {
    if (userDoc) {
      setName(userDoc.name ?? '')
      setCurrency(userDoc.currency ?? 'ARS')
    }
  }, [userDoc])

  // ── Profile ──────────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    try {
      await updateUserDoc(user.uid, { name, currency })
      setUserDoc({ ...userDoc, name, currency })
      toast.success('Perfil actualizado.')
    } catch { toast.error('Error al guardar.') }
    finally { setSavingProfile(false) }
  }

  // ── Wallets ───────────────────────────────────────────────────────────────────
  const openNewWallet  = () => { setEditingWallet(null); setWForm({ name: '', balance: '', color: '#7C6EFF' }); setWalletModal(true) }
  const openEditWallet = (w) => { setEditingWallet(w); setWForm({ name: w.name, balance: String(w.balance ?? 0), color: w.color ?? '#7C6EFF' }); setWalletModal(true) }

  const saveWallet = async () => {
    if (!wForm.name) { toast.error('Ingresá un nombre.'); return }
    setSavingWallet(true)
    try {
      const data = { name: wForm.name, balance: parseFloat(wForm.balance) || 0, color: wForm.color }
      if (editingWallet) { await updateWallet(user.uid, editingWallet.id, data); toast.success('Billetera actualizada.') }
      else               { await addWallet(user.uid, data);                       toast.success('Billetera agregada.') }
      setWalletModal(false)
    } catch { toast.error('Error al guardar.') }
    finally { setSavingWallet(false) }
  }

  const handleDeleteWallet = async (id) => {
    try { await deleteWallet(user.uid, id); toast.success('Billetera eliminada.') }
    catch { toast.error('Error al eliminar.') }
  }

  // ── Categories ────────────────────────────────────────────────────────────────
  const openNewCat = () => {
    setCForm({ name: '', type: catTab, color: catTab === 'expense' ? '#FF6B6B' : '#2FFFA0', icon: catTab === 'expense' ? 'Utensils' : 'Briefcase' })
    setCatModal(true)
  }

  const saveCat = async () => {
    if (!cForm.name.trim()) { toast.error('Ingresá un nombre.'); return }
    setSavingCat(true)
    try {
      await addCategory(user.uid, { name: cForm.name.trim(), type: cForm.type, color: cForm.color, icon: cForm.icon, isDefault: false })
      toast.success('Categoría creada.')
      setCatModal(false)
    } catch { toast.error('Error al crear.') }
    finally { setSavingCat(false) }
  }

  const handleDeleteCat = async (id) => {
    try { await deleteCategory(user.uid, id); toast.success('Categoría eliminada.') }
    catch { toast.error('Error al eliminar.') }
  }

  const shownCats = categories.filter(c => c.type === catTab || (!c.type && catTab === 'expense'))

  const handleLogout = async () => {
    try { await logOut(); navigate('/') }
    catch { toast.error('Error al cerrar sesión.') }
  }

  const label   = 'text-brand-muted text-xs mb-1 block'
  const section = 'mb-7'

  return (
    <div className="p-5 md:p-7 max-w-2xl mx-auto">
      <div className="mb-7">
        <h1 className="font-sora font-bold text-2xl text-brand-text">Configuración</h1>
        <p className="text-brand-muted text-sm">{user?.email}</p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`card ${section}`}>
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-brand-violet" />
          <h2 className="font-sora font-semibold text-sm text-brand-text">Perfil</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className={label}>Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-base" placeholder="Tu nombre" />
          </div>
          <div>
            <label className={label}>Moneda</label>
            <div className="relative">
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="input-base appearance-none cursor-pointer pr-8">
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
            </div>
          </div>
          <button onClick={saveProfile} disabled={savingProfile}
            className="btn-primary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
            {savingProfile && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Guardar cambios
          </button>
        </div>
      </motion.div>

      {/* Wallets */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className={`card ${section}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-brand-violet" />
            <h2 className="font-sora font-semibold text-sm text-brand-text">Billeteras</h2>
          </div>
          <button onClick={openNewWallet} className="flex items-center gap-1.5 text-brand-violet text-xs hover:underline">
            <Plus size={13} /> Nueva
          </button>
        </div>
        <div className="space-y-2">
          {wallets.map(w => (
            <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: w.color }} />
              <span className="text-brand-text text-sm flex-1">{w.name}</span>
              <span className="text-brand-muted text-xs font-sora">${w.balance?.toLocaleString('es-AR') ?? 0}</span>
              <div className="flex gap-1">
                <button onClick={() => openEditWallet(w)} className="p-1 rounded hover:bg-white/10 text-brand-muted hover:text-brand-text transition-colors"><Edit3 size={12} /></button>
                <button onClick={() => setDeleteWalletId(w.id)} className="p-1 rounded hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {wallets.length === 0 && (
            <p className="text-brand-muted text-sm text-center py-4">Sin billeteras. <button onClick={openNewWallet} className="text-brand-violet hover:underline">Crear una →</button></p>
          )}
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className={`card ${section}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-brand-violet" />
            <h2 className="font-sora font-semibold text-sm text-brand-text">Categorías</h2>
          </div>
          <button onClick={openNewCat} className="flex items-center gap-1.5 text-brand-violet text-xs hover:underline">
            <Plus size={13} /> Nueva
          </button>
        </div>

        {/* Tab expense / income */}
        <div className="flex p-[3px] rounded-[10px] mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[['expense', 'Gastos'], ['income', 'Ingresos']].map(([v, lbl]) => (
            <button key={v} onClick={() => setCatTab(v)}
              className="flex-1 py-1.5 rounded-[7px] text-[11px] font-semibold font-dm transition-all cursor-pointer"
              style={catTab === v
                ? { background: 'rgba(255,255,255,0.10)', color: '#F0F0F5' }
                : { color: 'rgba(255,255,255,0.40)' }
              }>
              {lbl}
            </button>
          ))}
        </div>

        {/* Category list */}
        <div className="space-y-1.5">
          {shownCats.map(cat => {
            const Icon = Icons[cat.icon] ?? Icons.MoreHorizontal
            return (
              <div key={cat.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.03]">
                <div className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0"
                  style={{ background: (cat.color ?? '#7C6EFF') + '28', color: cat.color ?? '#7C6EFF' }}>
                  <Icon size={13} strokeWidth={1.8} />
                </div>
                <span className="text-brand-text text-sm flex-1">{cat.name}</span>
                {cat.isDefault
                  ? <span className="text-[10px] text-brand-muted px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.05)' }}>Por defecto</span>
                  : <button onClick={() => setDeleteCatId(cat.id)} className="p-1 rounded hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                }
              </div>
            )
          })}
          {shownCats.length === 0 && (
            <p className="text-brand-muted text-sm text-center py-4">Sin categorías. <button onClick={openNewCat} className="text-brand-violet hover:underline">Crear una →</button></p>
          )}
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </motion.div>

      {/* ── Wallet modal ── */}
      <Modal open={walletModal} onClose={() => setWalletModal(false)} title={editingWallet ? 'Editar billetera' : 'Nueva billetera'} size="sm">
        <div className="space-y-4">
          <div>
            <label className={label}>Nombre *</label>
            <input value={wForm.name} onChange={e => setWForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Efectivo, Mercado Pago..." className="input-base" autoFocus />
          </div>
          <div>
            <label className={label}>Saldo</label>
            <input type="number" value={wForm.balance} onChange={e => setWForm(f => ({ ...f, balance: e.target.value }))} placeholder="0" className="input-base" />
          </div>
          <div>
            <label className={label}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {walletColors.map(c => (
                <button key={c} onClick={() => setWForm(f => ({ ...f, color: c }))} className="w-8 h-8 rounded-full transition-all cursor-pointer"
                  style={{ background: c, outline: wForm.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setWalletModal(false)} className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
            <button onClick={saveWallet} disabled={savingWallet} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {savingWallet && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Category modal ── */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Nueva categoría">
        <div className="space-y-4">
          {/* Type */}
          <div className="flex p-[3px] rounded-[10px]" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {[['expense', 'Gasto'], ['income', 'Ingreso']].map(([v, lbl]) => (
              <button key={v} onClick={() => setCForm(f => ({ ...f, type: v }))}
                className="flex-1 py-2 rounded-[7px] text-xs font-semibold font-dm transition-all cursor-pointer"
                style={cForm.type === v ? { background: 'rgba(255,255,255,0.10)', color: '#F0F0F5' } : { color: 'rgba(255,255,255,0.40)' }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className={label}>Nombre *</label>
            <input value={cForm.name} onChange={e => setCForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Mascota, Deporte..." className="input-base" autoFocus />
          </div>

          {/* Color */}
          <div>
            <label className={label}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {CAT_COLORS.map(c => (
                <button key={c} onClick={() => setCForm(f => ({ ...f, color: c }))} className="w-7 h-7 rounded-full transition-all cursor-pointer"
                  style={{ background: c, outline: cForm.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className={label}>Ícono</label>
            <IconPicker value={cForm.icon} onChange={icon => setCForm(f => ({ ...f, icon }))} />
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
              style={{ background: cForm.color + '28', color: cForm.color }}>
              {(() => { const Icon = Icons[cForm.icon] ?? Icons.MoreHorizontal; return <Icon size={16} strokeWidth={1.8} /> })()}
            </div>
            <span className="font-sora font-semibold text-sm text-brand-text">{cForm.name || 'Vista previa'}</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-dm"
              style={{ background: cForm.color + '22', color: cForm.color, border: `1px solid ${cForm.color}40` }}>
              {cForm.type === 'expense' ? 'Gasto' : 'Ingreso'}
            </span>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setCatModal(false)} className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
            <button onClick={saveCat} disabled={savingCat} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {savingCat && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Crear
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteWalletId} onClose={() => setDeleteWalletId(null)} onConfirm={() => handleDeleteWallet(deleteWalletId)}
        title="Eliminar billetera" message="¿Eliminás esta billetera? Las transacciones asociadas no se eliminarán." />

      <ConfirmModal open={!!deleteCatId} onClose={() => setDeleteCatId(null)} onConfirm={() => handleDeleteCat(deleteCatId)}
        title="Eliminar categoría" message="¿Eliminás esta categoría? Las transacciones que la usan quedarán sin categoría." />
    </div>
  )
}
