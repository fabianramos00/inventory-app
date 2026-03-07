import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Phone, Mail, Edit, Trash2, Loader } from 'lucide-react'
import styles from './Providers.module.css'
import { providersApi } from '@/lib/api/providers'
import { useModalContext } from '@/context/ModalContext'
import CreateFormModal, { type FieldConfig } from '@/components/CreateFormModal/CreateFormModal'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal/ConfirmDeleteModal'
import type { Provider } from '@/types'

const PROVIDER_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Nombre del Proveedor', placeholder: 'Ej. Distribuidora Metálica', required: true },
  { key: 'contact_info', label: 'Persona de Contacto', placeholder: 'Ej. Juan Pérez', type: 'text' },
  { key: 'email', label: 'Correo Electrónico', placeholder: 'Ej. correo@proveedor.pe', type: 'email' },
  { key: 'phone', label: 'Teléfono', placeholder: 'Ej. +51 999 123 456', type: 'tel' },
]

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [providerToDelete, setProviderToDelete] = useState<{ id: number; name: string } | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const limit = 10
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { openModal: contextOpenModal, closeModal: contextCloseModal } = useModalContext()

  const loadProviders = async (searchValue = search, pageNum = 1) => {
    setLoading(true)
    try {
      const response = await providersApi.getProviders({
        skip: (pageNum - 1) * limit,
        limit,
        ...(searchValue && { search: searchValue }),
      })
      setProviders(response.data.items || [])
      setTotalPages(response.data.pages || 1)
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to load providers:', err)
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      loadProviders(search, 1)
    }, 300)
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [search])

  useEffect(() => {
    loadProviders(search, page)
  }, [page, reloadTrigger])

  useEffect(() => {
    if (isCreateModalOpen || isEditModalOpen || providerToDelete) {
      contextOpenModal()
    } else {
      contextCloseModal()
    }
  }, [isCreateModalOpen, isEditModalOpen, providerToDelete, contextOpenModal, contextCloseModal])

  async function submitCreateProvider(values: Record<string, string>) {
    const payload = {
      name: values.name,
      ...(values.contact_info && { contact_info: values.contact_info }),
      ...(values.email && { email: values.email }),
      ...(values.phone && { phone: values.phone }),
    }
    const response = await providersApi.createProvider(payload)
    return response.data
  }

  function handleProviderCreated() {
    setIsCreateModalOpen(false)
    setReloadTrigger(prev => prev + 1)
  }

  async function submitEditProvider(values: Record<string, string>) {
    if (!editingProvider) return editingProvider
    const payload = {
      name: values.name,
      ...(values.contact_info && { contact_info: values.contact_info }),
      ...(values.email && { email: values.email }),
      ...(values.phone && { phone: values.phone }),
    }
    const response = await providersApi.updateProvider(editingProvider.id, payload)
    return response.data
  }

  function handleProviderEdited() {
    setIsEditModalOpen(false)
    setEditingProvider(null)
    setReloadTrigger(prev => prev + 1)
  }

  function openEditModal(provider: Provider) {
    setEditingProvider(provider)
    setIsEditModalOpen(true)
  }

  async function handleDeleteProvider() {
    if (!providerToDelete) return
    await providersApi.deleteProvider(providerToDelete.id)
    setProviderToDelete(null)
    setReloadTrigger(prev => prev + 1)
  }

  const editFormValues: Record<string, string> = editingProvider
    ? {
        name: editingProvider.name,
        contact_info: editingProvider.contact_info || '',
        email: editingProvider.email || '',
        phone: editingProvider.phone || '',
      }
    : {
        name: '',
        contact_info: '',
        email: '',
        phone: '',
      }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className="bin-label mb-1 inline-block">PROV / Lista</span>
          <h2 className={styles.title}>Proveedores</h2>
        </div>
        <button className={styles.headerActions} onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={13} /> Nuevo Proveedor
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchCard}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar proveedor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && <div className={styles.loadingContainer}><Loader size={20} className={styles.spinner} /> Cargando proveedores...</div>}

      {/* Cards grid */}
      {!loading && (
        <>
          <div className={styles.gridContainer}>
            {providers.map(p => (
              <div key={p.id} className={styles.providerCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.providerInfo}>
                    <div className={styles.providerName}>{p.name}</div>
                    {p.contact_info && <div className={styles.providerContact}>{p.contact_info}</div>}
                  </div>
                  <div className={styles.actionButtons}>
                    <button className={styles.actionBtn} onClick={() => openEditModal(p)} title="Editar">
                      <Edit size={14} />
                    </button>
                    <button className={styles.deleteActionBtn} onClick={() => setProviderToDelete({ id: p.id, name: p.name })} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.detailsList}>
                  {p.email && (
                    <div className={styles.detailItem}>
                      <Mail size={12} className={styles.detailIcon} />
                      {p.email}
                    </div>
                  )}
                  {p.phone && (
                    <div className={styles.detailItem}>
                      <Phone size={12} className={styles.detailIcon} />
                      {p.phone}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className={styles.paginationContainer}>
            <button
              className={styles.paginationBtn}
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </button>
            <span className={styles.paginationInfo}>Página {page} de {totalPages}</span>
            <button
              className={styles.paginationBtn}
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateFormModal
          title="Crear Nuevo Proveedor"
          fields={PROVIDER_FIELDS}
          onSubmit={submitCreateProvider}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleProviderCreated}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingProvider && (
        <CreateFormModal
          title={`Editar Proveedor: ${editingProvider.name}`}
          fields={PROVIDER_FIELDS}
          initialValues={editFormValues}
          onSubmit={submitEditProvider}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingProvider(null)
          }}
          onCreated={handleProviderEdited}
        />
      )}

      {/* Delete Confirmation Modal */}
      {providerToDelete && (
        <ConfirmDeleteModal
          productName={providerToDelete.name}
          onConfirm={handleDeleteProvider}
          onClose={() => setProviderToDelete(null)}
        />
      )}
    </div>
  )
}
