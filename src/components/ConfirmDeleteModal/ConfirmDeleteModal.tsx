import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader, Trash2, X } from 'lucide-react'
import styles from './ConfirmDeleteModal.module.css'

interface ConfirmDeleteModalProps {
  productName: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function ConfirmDeleteModal({ productName, onConfirm, onClose }: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setIsDeleting(true)
    setError(null)
    try {
      await onConfirm()
    } catch {
      setError('Error al eliminar el producto. Intenta nuevamente.')
      setIsDeleting(false)
    }
  }

  return createPortal(
    <div className={styles.backdrop} onClick={isDeleting ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Trash2 size={18} className={styles.titleIcon} />
            <h2 className={styles.title}>Eliminar Producto</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button" disabled={isDeleting}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.message}>
            ¿Estás seguro que deseas eliminar <strong>"{productName}"</strong>?
          </p>
          <p className={styles.warning}>Esta acción no puede deshacerse.</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} type="button" disabled={isDeleting}>
            Cancelar
          </button>
          <button className={styles.deleteBtn} onClick={handleConfirm} type="button" disabled={isDeleting}>
            {isDeleting ? (
              <><Loader size={14} className={styles.spinner} /> Eliminando...</>
            ) : (
              <><Trash2 size={14} /> Eliminar</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
