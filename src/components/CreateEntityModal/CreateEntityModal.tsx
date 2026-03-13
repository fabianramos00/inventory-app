import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader, X } from 'lucide-react'
import { inventoryApi } from '@/lib/api/inventory'
import type { FilterOption } from '@/types'
import styles from './CreateEntityModal.module.css'

export type EntityType = 'material' | 'category' | 'brand' | 'measurementUnit'

interface CreateEntityModalProps {
  type: EntityType
  onClose: () => void
  onCreated: (entity: FilterOption) => void
  entityId?: number
  initialValues?: Record<string, string>
}

const entityCreateConfig: Record<EntityType, { title: string }> = {
  material: { title: 'Agregar Material' },
  category: { title: 'Agregar Categoría' },
  brand: { title: 'Agregar Marca' },
  measurementUnit: { title: 'Agregar Unidad de Medida' },
}

const entityEditConfig: Record<EntityType, { title: string }> = {
  material: { title: 'Editar Material' },
  category: { title: 'Editar Categoría' },
  brand: { title: 'Editar Marca' },
  measurementUnit: { title: 'Editar Unidad de Medida' },
}

export default function CreateEntityModal({ type, onClose, onCreated, entityId, initialValues }: CreateEntityModalProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [extra, setExtra] = useState(initialValues?.description ?? initialValues?.logo_url ?? initialValues?.abbreviation ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditMode = entityId !== undefined

  async function handleSave() {
    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (type === 'measurementUnit' && !extra.trim()) {
      setError('La abreviatura es requerida')
      return
    }
    setLoading(true)
    setError(null)
    try {
      let response
      if (isEditMode) {
        if (type === 'material') {
          response = await inventoryApi.updateMaterial(entityId, { name })
        } else if (type === 'category') {
          response = await inventoryApi.updateCategory(entityId, { name, description: extra || undefined })
        } else if (type === 'brand') {
          response = await inventoryApi.updateBrand(entityId, { name, logo_url: extra || undefined })
        } else {
          response = await inventoryApi.updateMeasurementUnit(entityId, { name, abbreviation: extra })
        }
      } else {
        if (type === 'material') {
          response = await inventoryApi.createMaterial({ name })
        } else if (type === 'category') {
          response = await inventoryApi.createCategory({ name, description: extra || undefined })
        } else if (type === 'brand') {
          response = await inventoryApi.createBrand({ name, logo_url: extra || undefined })
        } else {
          response = await inventoryApi.createMeasurementUnit({ name, abbreviation: extra })
        }
      }
      onCreated(response.data)
    } catch (err) {
      const createMsgs: Record<EntityType, string> = {
        material: 'Error al crear material',
        category: 'Error al crear categoría',
        brand: 'Error al crear marca',
        measurementUnit: 'Error al crear unidad de medida',
      }
      const editMsgs: Record<EntityType, string> = {
        material: 'Error al actualizar material',
        category: 'Error al actualizar categoría',
        brand: 'Error al actualizar marca',
        measurementUnit: 'Error al actualizar unidad de medida',
      }
      setError(err instanceof Error ? err.message : (isEditMode ? editMsgs : createMsgs)[type])
    } finally {
      setLoading(false)
    }
  }

  const { title } = isEditMode ? entityEditConfig[type] : entityCreateConfig[type]

  return createPortal(
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.modalCloseButton} onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>
        {error && <div className={styles.modalError}>{error}</div>}
        <div className={styles.modalForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              {type === 'measurementUnit' ? 'Nombre' : 'Nombre'}
            </label>
            <input
              type="text"
              className={styles.inputField}
              placeholder={
                type === 'material' ? 'Nombre del material' :
                type === 'category' ? 'Nombre de la categoría' :
                type === 'brand' ? 'Nombre de la marca' :
                'Centímetros'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          {type === 'category' && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Descripción (opcional)</label>
              <textarea
                className={styles.inputField}
                placeholder="Descripción de la categoría"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                rows={3}
                style={{ fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
          )}
          {type === 'brand' && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Logo URL (opcional)</label>
              <input
                type="url"
                className={styles.inputField}
                placeholder="https://ejemplo.com/logo.png"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
              />
            </div>
          )}
          {type === 'measurementUnit' && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Abreviatura</label>
              <input
                type="text"
                className={styles.inputField}
                placeholder="cm"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
              />
            </div>
          )}
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
