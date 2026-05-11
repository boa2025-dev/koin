import Modal from './Modal'

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Eliminar', danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-brand-muted text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-ghost text-sm py-2 px-4">
          Cancelar
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={`font-dm font-medium px-4 py-2 rounded-xl text-sm transition-all active:scale-95 cursor-pointer ${
            danger
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'btn-primary'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
