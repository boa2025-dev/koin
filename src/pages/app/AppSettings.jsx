import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Wallet, Palette, Globe, Trash2, Plus, ChevronDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../services/auth'
import { logOut } from '../../services/auth'
import { getUserDoc, updateUserDoc } from '../../services/user'
import { useWallets, addWallet, updateWallet, deleteWallet } from '../../services/wallets'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import useAppStore from '../../store/useAppStore'
import toast from 'react-hot-toast'

const currencies = ['ARS', 'USD', 'EUR', 'CLP', 'BRL', 'MXN']
const walletColors = ['#7C6EFF', '#2FFFA0', '#FF6B6B', '#4ECDC4', '#F7DC6F', '#E91E63', '#3498DB', '#E67E22']

export default function AppSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { userDoc, setUserDoc } = useAppStore()
  const { wallets } = useWallets(user?.uid)

  const [name, setName] = useState(userDoc?.name ?? '')
  const [currency, setCurrency] = useState(userDoc?.currency ?? 'ARS')
  const [savingProfile, setSavingProfile] = useState(false)

  const [walletModal, setWalletModal] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)
  const [wForm, setWForm] = useState({ name: '', balance: '', color: '#7C6EFF' })
  const [deleteWalletId, setDeleteWalletId] = useState(null)
  const [savingWallet, setSavingWallet] = useState(false)

  useEffect(() => {
    if (userDoc) {
      setName(userDoc.name ?? '')
      setCurrency(userDoc.currency ?? 'ARS')
    }
  }, [userDoc])

  const saveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    try {
      await updateUserDoc(user.uid, { name, currency })
      setUserDoc({ ...userDoc, name, currency })
      toast.success('Perfil actualizado.')
    } catch {
      toast.error('Error al guardar.')
    } finally {
      setSavingProfile(false)
    }
  }

  const openNewWallet = () => {
    setEditingWallet(null)
    setWForm({ name: '', balance: '', color: '#7C6EFF' })
    setWalletModal(true)
  }
  const openEditWallet = (w) => {
    setEditingWallet(w)
    setWForm({ name: w.name, balance: String(w.balance ?? 0), color: w.color ?? '#7C6EFF' })
    setWalletModal(true)
  }
  const saveWallet = async () => {
    if (!wForm.name) { toast.error('Ingresá un nombre.'); return }
    setSavingWallet(true)
    try {
      const data = { name: wForm.name, balance: parseFloat(wForm.balance) || 0, color: wForm.color }
      if (editingWallet) {
        await updateWallet(user.uid, editingWallet.id, data)
        toast.success('Billetera actualizada.')
      } else {
        await addWallet(user.uid, data)
        toast.success('Billetera agregada.')
      }
      setWalletModal(false)
    } catch {
      toast.error('Error al guardar.')
    } finally {
      setSavingWallet(false)
    }
  }
  const handleDeleteWallet = async (id) => {
    try {
      await deleteWallet(user.uid, id)
      toast.success('Billetera eliminada.')
    } catch {
      toast.error('Error al eliminar.')
    }
  }

  const handleLogout = async () => {
    await logOut()
    navigate('/')
    toast.success('Sesión cerrada.')
  }

  const section = 'mb-7'
  const label = 'text-brand-muted text-xs mb-1 block'

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
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-base"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className={label}>Moneda</label>
            <div className="relative">
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="input-base appearance-none cursor-pointer pr-8"
              >
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
            </div>
          </div>
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="btn-primary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {savingProfile ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Guardar cambios
          </button>
        </div>
      </motion.div>

      {/* Wallets */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={`card ${section}`}>
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
            <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] group">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: w.color }} />
              <span className="text-brand-text text-sm flex-1">{w.name}</span>
              <span className="text-brand-muted text-xs font-sora">${w.balance?.toLocaleString('es-AR') ?? 0}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditWallet(w)} className="p-1 rounded hover:bg-white/10 text-brand-muted hover:text-brand-text transition-colors">
                  <User size={12} />
                </button>
                <button onClick={() => setDeleteWalletId(w.id)} className="p-1 rounded hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {wallets.length === 0 && (
            <p className="text-brand-muted text-sm text-center py-4">Sin billeteras. <button onClick={openNewWallet} className="text-brand-violet hover:underline">Crear una →</button></p>
          )}
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </motion.div>

      {/* Wallet modal */}
      <Modal open={walletModal} onClose={() => setWalletModal(false)} title={editingWallet ? 'Editar billetera' : 'Nueva billetera'} size="sm">
        <div className="space-y-4">
          <div>
            <label className={label}>Nombre *</label>
            <input
              value={wForm.name}
              onChange={e => setWForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Efectivo, Mercado Pago..."
              className="input-base"
              autoFocus
            />
          </div>
          <div>
            <label className={label}>Saldo</label>
            <input
              type="number"
              value={wForm.balance}
              onChange={e => setWForm(f => ({ ...f, balance: e.target.value }))}
              placeholder="0"
              className="input-base"
            />
          </div>
          <div>
            <label className={label}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {walletColors.map(c => (
                <button
                  key={c}
                  onClick={() => setWForm(f => ({ ...f, color: c }))}
                  className="w-8 h-8 rounded-full transition-all cursor-pointer"
                  style={{ background: c, outline: wForm.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setWalletModal(false)} className="btn-ghost flex-1 py-2.5 text-sm">Cancelar</button>
            <button
              onClick={saveWallet}
              disabled={savingWallet}
              className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {savingWallet ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteWalletId}
        onClose={() => setDeleteWalletId(null)}
        onConfirm={() => handleDeleteWallet(deleteWalletId)}
        title="Eliminar billetera"
        message="¿Eliminás esta billetera? Las transacciones asociadas no se eliminarán."
      />
    </div>
  )
}
