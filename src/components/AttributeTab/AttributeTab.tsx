import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Loader, Pencil, Trash2 } from 'lucide-react'
import styles from './AttributeTab.module.css'
import CreateEntityModal, { type EntityType } from '@/components/CreateEntityModal/CreateEntityModal'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal/ConfirmDeleteModal'
import { useModalContext } from '@/context/ModalContext'
import type { FilterOption } from '@/types'

interface ColumnConfig {
  key: string
  label: string
}

interface AttributeTabProps {
  entityType: EntityType
  columns: ColumnConfig[]
  fetchFn: (params: { search?: string; skip?: number; limit?: number }) => Promise<{ data: { items: FilterOption[] } }>
  updateFn: (id: number, data: Record<string, string>) => Promise<unknown>
  deleteFn: (id: number) => Promise<unknown>
}

const newEntityLabel: Record<EntityType, string> = {
  category: 'Nueva Categoría',
  brand: 'Nueva Marca',
  material: 'Nuevo Material',
  measurementUnit: 'Nueva Unidad',
}

export default function AttributeTab({ entityType, columns, fetchFn, deleteFn }: AttributeTabProps) {
  const { openModal: contextOpenModal, closeModal: contextCloseModal } = useModalContext()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<FilterOption[]>([])
  const [loading, setLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<FilterOption | null>(null)
  const [deletingItem, setDeletingItem] = useState<FilterOption | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetchFn({ search: search || undefined, skip: 0, limit: 50 })
        setItems(response.data.items || [])
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [search, fetchFn, refreshKey])

  // Sync modal state with global context for blur effect
  useEffect(() => {
    const anyOpen = showCreateModal || editingItem !== null || deletingItem !== null
    if (anyOpen) { contextOpenModal() } else { contextCloseModal() }
  }, [showCreateModal, editingItem, deletingItem, contextOpenModal, contextCloseModal])

  function handleCreated() {
    setShowCreateModal(false)
    setEditingItem(null)
    setRefreshKey(k => k + 1)
  }

  async function handleDeleteConfirm() {
    await deleteFn(deletingItem!.id)
    setDeletingItem(null)
    setRefreshKey(k => k + 1)
  }

  function getInitialValues(item: FilterOption): Record<string, string> {
    const values: Record<string, string> = { name: item.name }
    if ('description' in item && item.description) values.description = String(item.description)
    if ('logo_url' in item && item.logo_url) values.logo_url = String(item.logo_url)
    if ('abbreviation' in item && item.abbreviation) values.abbreviation = String(item.abbreviation)
    return values
  }

  return (
    <div className={styles.tableSection}>
      <div className={styles.commandBar}>
        <div className={styles.controlsBar}>
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.actionWrapper}>
            <button className={styles.newBtn} onClick={() => setShowCreateModal(true)}>
              <Plus size={15} strokeWidth={2.5} />
              <span>{newEntityLabel[entityType]}</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>
            <Loader size={20} className={styles.spinner} />
            <p>Cargando...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      {columns.map(col => (
                        <td key={col.key}>{(item as unknown as Record<string, unknown>)[col.key] as string || '-'}</td>
                      ))}
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.iconBtn}
                            title="Editar"
                            onClick={() => setEditingItem(item)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className={styles.iconBtnDestructive}
                            title="Eliminar"
                            onClick={() => setDeletingItem(item)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length === 0 && (
              <div className={styles.emptyState}>No se encontraron registros.</div>
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <CreateEntityModal
          type={entityType}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {editingItem && (
        <CreateEntityModal
          type={entityType}
          entityId={editingItem.id}
          initialValues={getInitialValues(editingItem)}
          onClose={() => setEditingItem(null)}
          onCreated={handleCreated}
        />
      )}

      {deletingItem && (
        <ConfirmDeleteModal
          productName={deletingItem.name}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingItem(null)}
        />
      )}
    </div>
  )
}
