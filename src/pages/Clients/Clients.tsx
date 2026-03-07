import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Phone, Mail, Edit, Trash2, Loader } from 'lucide-react'
import styles from './Clients.module.css'
import { clientsApi } from '@/lib/api/clients'
import { useModalContext } from '@/context/ModalContext'
import CreateFormModal, { type FieldConfig } from '@/components/CreateFormModal/CreateFormModal'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal/ConfirmDeleteModal'
import type { Client } from '@/types'

const CLIENT_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Nombre del Cliente', placeholder: 'Ej. Fabian Rodríguez', required: true },
  { key: 'identity_card', label: 'Cédula', placeholder: 'Ej. 1052416157', type: 'text' },
  { key: 'email', label: 'Correo Electrónico', placeholder: 'Ej. fabian@gmail.com', type: 'email' },
  { key: 'phone', label: 'Teléfono', placeholder: 'Ej. 3133120107', type: 'tel' },
]

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<{ id: number; name: string } | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const limit = 10
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { openModal: contextOpenModal, closeModal: contextCloseModal } = useModalContext()

  const loadClients = async (searchValue = search, pageNum = 1) => {
    setLoading(true)
    try {
      const response = await clientsApi.getClients({
        skip: (pageNum - 1) * limit,
        limit,
        ...(searchValue && { search: searchValue }),
      })
      setClients(response.data.items || [])
      setHasNext(response.data.has_next || false)
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to load clients:', err)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      loadClients(search, 1)
    }, 300)
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [search])

  useEffect(() => {
    loadClients(search, page)
  }, [page, reloadTrigger])

  useEffect(() => {
    if (isCreateModalOpen || isEditModalOpen || clientToDelete) {
      contextOpenModal()
    } else {
      contextCloseModal()
    }
  }, [isCreateModalOpen, isEditModalOpen, clientToDelete, contextOpenModal, contextCloseModal])

  async function submitCreateClient(values: Record<string, string>) {
    const payload = {
      name: values.name,
      ...(values.identity_card && { identity_card: values.identity_card }),
      ...(values.email && { email: values.email }),
      ...(values.phone && { phone: values.phone }),
    }
    const response = await clientsApi.createClient(payload)
    return response.data
  }

  function handleClientCreated() {
    setIsCreateModalOpen(false)
    setReloadTrigger(prev => prev + 1)
  }

  async function submitEditClient(values: Record<string, string>) {
    if (!editingClient) return editingClient
    const payload = {
      name: values.name,
      ...(values.identity_card && { identity_card: values.identity_card }),
      ...(values.email && { email: values.email }),
      ...(values.phone && { phone: values.phone }),
    }
    const response = await clientsApi.updateClient(editingClient.id, payload)
    return response.data
  }

  function handleClientEdited() {
    setIsEditModalOpen(false)
    setEditingClient(null)
    setReloadTrigger(prev => prev + 1)
  }

  function openEditModal(client: Client) {
    setEditingClient(client)
    setIsEditModalOpen(true)
  }

  async function handleDeleteClient() {
    if (!clientToDelete) return
    await clientsApi.deleteClient(clientToDelete.id)
    setClientToDelete(null)
    setReloadTrigger(prev => prev + 1)
  }

  const editFormValues: Record<string, string> = editingClient
    ? {
        name: editingClient.name,
        identity_card: editingClient.identity_card || '',
        email: editingClient.email || '',
        phone: editingClient.phone || '',
      }
    : {
        name: '',
        identity_card: '',
        email: '',
        phone: '',
      }

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>
            <span>CLI</span>
            <span className={styles.breadcrumbDivider}>/</span>
            <span className={styles.breadcrumbActive}>Lista</span>
          </div>
          <h1 className={styles.pageTitle}>Clientes</h1>
        </div>
        <button className={styles.newClientBtn} onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} strokeWidth={2.5} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Command Bar (replacing searchCard) */}
      <div className={styles.commandBar}>
        <div className={styles.controlsBar}>
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar cliente por nombre, cédula o contacto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <Loader size={24} className={styles.spinner} />
          <p>Cargando clientes...</p>
        </div>
      ) : (
        <>
          {/* Cards grid */}
          <div className={styles.gridContainer}>
            {clients.map(c => (
              <div key={c.id} className={styles.clientCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.clientInfo}>
                    <div className={styles.clientName}>{c.name}</div>
                    {c.identity_card && <div className={styles.clientIdCard}>ID: {c.identity_card}</div>}
                  </div>
                  <div className={styles.actionButtons}>
                    <button className={styles.actionBtn} onClick={() => openEditModal(c)} title="Editar">
                      <Edit size={14} />
                    </button>
                    <button className={styles.deleteActionBtn} onClick={() => setClientToDelete({ id: c.id, name: c.name })} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.detailsList}>
                  {c.email && (
                    <div className={styles.detailItem}>
                      <Mail size={14} className={styles.detailIcon} />
                      <span>{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className={styles.detailItem}>
                      <Phone size={14} className={styles.detailIcon} />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <span className={styles.dateLabel}>Creado:</span>
                    <span className={styles.dateValue}>{formatDate(c.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {clients.length === 0 && !loading && (
            <div className={styles.emptyState}>No se encontraron clientes.</div>
          )}

          {/* Pagination */}
          {(page > 1 || hasNext) && (
            <div className={styles.paginationContainer}>
              <button
                className={styles.paginationBtn}
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              <span className={styles.paginationInfo}>Página {page}</span>
              <button
                className={styles.paginationBtn}
                disabled={!hasNext || loading}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateFormModal
          title="Crear Nuevo Cliente"
          fields={CLIENT_FIELDS}
          onSubmit={submitCreateClient}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleClientCreated}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingClient && (
        <CreateFormModal
          title={`Editar Cliente: ${editingClient.name}`}
          fields={CLIENT_FIELDS}
          initialValues={editFormValues}
          onSubmit={submitEditClient}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingClient(null)
          }}
          onCreated={handleClientEdited}
        />
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <ConfirmDeleteModal
          productName={clientToDelete.name}
          onConfirm={handleDeleteClient}
          onClose={() => setClientToDelete(null)}
        />
      )}
    </div>
  )
}
