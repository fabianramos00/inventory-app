import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader, X } from 'lucide-react'
import { salesApi } from '@/lib/api/sales'
import styles from '../CreateEntityModal/CreateEntityModal.module.css'

interface CreateClientModalProps {
  onClose: () => void
  onCreated: (client: { id: number; name: string }) => void
}

export default function CreateClientModal({ onClose, onCreated }: CreateClientModalProps) {
  const [name, setName] = useState('')
  const [identityCard, setIdentityCard] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await salesApi.createClient({
        name: name.trim(),
        identity_card: identityCard.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      onCreated(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Agregar Cliente</h2>
          <button className={styles.modalCloseButton} onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>
        {error && <div className={styles.modalError}>{error}</div>}
        <div className={styles.modalForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Nombre</label>
            <input
              type="text"
              className={styles.inputField}
              placeholder="Nombre del cliente"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Cédula de identidad (opcional)</label>
            <input
              type="text"
              className={styles.inputField}
              placeholder="Número de cédula"
              value={identityCard}
              onChange={e => setIdentityCard(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Correo electrónico (opcional)</label>
            <input
              type="email"
              className={styles.inputField}
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Teléfono (opcional)</label>
            <input
              type="tel"
              className={styles.inputField}
              placeholder="Número de teléfono"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.modalCancelBtn} onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className={styles.modalSaveBtn}
            onClick={handleSave}
            disabled={loading}
            type="button"
          >
            {loading ? <><Loader size={14} className={styles.spinner} /> Guardando...</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
