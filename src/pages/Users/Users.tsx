import { useState, useEffect, useRef } from 'react'
import { Plus, Shield, User as UserIcon, Loader, Trash2, Edit2 } from 'lucide-react'
import styles from './Users.module.css'
import PageHeader from '@/components/PageHeader/PageHeader'
import CommandBar from '@/components/CommandBar/CommandBar'
import { usersApi, type CreateUserInput, type UpdateUserInput } from '@/lib/api/users'
import { useModalContext } from '@/context/ModalContext'
import CreateFormModal, { type FieldConfig } from '@/components/CreateFormModal/CreateFormModal'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal/ConfirmDeleteModal'
import type { User, PaginatedResponse } from '@/types'

const colors = ['#FACC15', '#2563EB', '#16A34A', '#D97706', '#7C3AED']

const ROLE_OPTIONS = [
  { value: 'usuario', label: 'Usuario' },
  { value: 'administrador', label: 'Administrador' },
]

const USER_CREATE_FIELDS: FieldConfig[] = [
  { key: 'full_name', label: 'Nombre Completo', placeholder: 'Ej. Fabian Ramos', required: true },
  { key: 'email', label: 'Correo Electrónico', placeholder: 'Ej. fabian@gmail.com', type: 'email', required: true },
  { key: 'password', label: 'Contraseña', placeholder: 'Ej. ••••••••', type: 'password', required: true },
  { key: 'role', label: 'Rol', type: 'select', options: ROLE_OPTIONS, required: true },
]

const USER_EDIT_FIELDS: FieldConfig[] = [
  { key: 'full_name', label: 'Nombre Completo', placeholder: 'Ej. Fabian Ramos', required: true },
  { key: 'email', label: 'Correo Electrónico', placeholder: 'Ej. fabian@gmail.com', type: 'email', required: true },
  { key: 'password', label: 'Nueva Contraseña', placeholder: 'Dejar en blanco para no cambiar', type: 'password', required: false },
  { key: 'role', label: 'Rol', type: 'select', options: ROLE_OPTIONS, required: true },
]

export default function Users() {
  const { openModal: contextOpenModal, closeModal: contextCloseModal } = useModalContext()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const limit = 10

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null)
  const [togglegingUserId, setTogglingUserId] = useState<number | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (isCreateModalOpen || isEditModalOpen || userToDelete) {
      contextOpenModal()
    } else {
      contextCloseModal()
    }
  }, [isCreateModalOpen, isEditModalOpen, userToDelete, contextOpenModal, contextCloseModal])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1)
      loadUsers(1, search)
    }, 300)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [search])

  useEffect(() => {
    loadUsers(page, search)
  }, [page, reloadTrigger])

  async function loadUsers(p: number, searchVal: string) {
    setLoading(true)
    try {
      const response = await usersApi.getUsers({
        skip: (p - 1) * limit,
        limit,
        ...(searchVal && { search: searchVal }),
      })
      const data = response.data as PaginatedResponse<User>
      setUsers(data.items || [])
      setHasNext(p < (data.pages || 1))
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  async function submitCreateUser(values: Record<string, string>) {
    const createData: CreateUserInput = {
      full_name: values.full_name,
      email: values.email,
      password: values.password,
      is_superuser: values.role === 'administrador',
    }
    const result = await usersApi.createUser(createData)
    return result.data
  }

  function handleUserCreated() {
    setIsCreateModalOpen(false)
    setReloadTrigger(prev => prev + 1)
  }

  function openEditModal(user: User) {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  async function submitEditUser(values: Record<string, string>) {
    if (!editingUser) throw new Error('No user selected')
    const updateData: UpdateUserInput = {
      full_name: values.full_name,
      email: values.email,
      is_superuser: values.role === 'administrador',
    }
    if (values.password?.trim()) {
      updateData.password = values.password
    }
    const result = await usersApi.updateUser(editingUser.id, updateData)
    return result.data
  }

  function handleUserEdited() {
    setIsEditModalOpen(false)
    setEditingUser(null)
    setReloadTrigger(prev => prev + 1)
  }

  async function handleDeleteUser() {
    if (!userToDelete) return
    try {
      await usersApi.deleteUser(userToDelete.id)
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'FOREIGN_KEY_VIOLATION') {
        throw new Error('No se puede eliminar el usuario porque está asociado a una venta.')
      }
      throw err
    }
    setUserToDelete(null)
    setReloadTrigger(prev => prev + 1)
  }

  async function handleToggleActive(user: User) {
    setTogglingUserId(user.id)
    try {
      await usersApi.updateUser(user.id, { is_active: !user.is_active })
      setUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u)
      )
    } finally {
      setTogglingUserId(null)
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        prefix="USR"
        activeLabel="Gestión"
        title="Usuarios"
        action={
          <button className={styles.newUserBtn} onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Nuevo Usuario
          </button>
        }
      />

      {/* Table Section */}
      <div className={styles.tableSection}>
        <CommandBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Buscar usuario..."
        />

        <div className={styles.tableCard}>
        {loading && users.length === 0 ? (
          <div className={styles.loadingContainer}>
            <Loader size={20} className={styles.spinner} />
            <span>Cargando usuarios...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="data-table w-full min-w-[900px]">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={user.id}>
                      <td>
                        <div className={styles.userCell}>
                          <div
                            className={styles.avatar}
                            style={{ background: colors[i % colors.length] }}
                          >
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className={styles.userName}>{user.full_name}</span>
                        </div>
                      </td>
                      <td><span className={styles.emailCell}>{user.email}</span></td>
                      <td>
                        <div className={styles.roleCell}>
                          {user.is_superuser
                            ? <Shield size={12} className={styles.adminIcon} />
                            : <UserIcon size={12} className={styles.userIcon} />
                          }
                          <span className={`badge ${user.is_superuser ? 'badge--warning' : 'badge--neutral'}`}>
                            {user.is_superuser ? 'Administrador' : 'Usuario'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className={styles.stateToggle}
                          onClick={() => handleToggleActive(user)}
                          disabled={togglegingUserId === user.id}
                          title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {togglegingUserId === user.id ? (
                            <Loader size={16} className={styles.toggleSpinner} />
                          ) : (
                            <div className={`${styles.toggleSwitch} ${user.is_active ? styles.toggleActive : ''}`} />
                          )}
                        </button>
                      </td>
                      <td>
                        <div className={styles.actionsContainer}>
                          <button
                            className={styles.editBtn}
                            onClick={() => openEditModal(user)}
                            title="Editar usuario"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => setUserToDelete({ id: user.id, name: user.full_name })}
                            title="Eliminar usuario"
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

            {/* Pagination */}
            {(page > 1 || hasNext) && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </button>
                <span className={styles.pageInfo}>Página {page}</span>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasNext}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateFormModal
          title="Nuevo Usuario"
          fields={USER_CREATE_FIELDS}
          onSubmit={submitCreateUser}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleUserCreated}
        />
      )}

      {isEditModalOpen && editingUser && (
        <CreateFormModal
          title="Editar Usuario"
          fields={USER_EDIT_FIELDS}
          onSubmit={submitEditUser}
          onClose={() => setIsEditModalOpen(false)}
          onCreated={handleUserEdited}
          initialValues={{
            full_name: editingUser.full_name,
            email: editingUser.email,
            password: '',
            role: editingUser.is_superuser ? 'administrador' : 'usuario',
          }}
        />
      )}

      {userToDelete && (
        <ConfirmDeleteModal
          productName={userToDelete.name}
          onConfirm={handleDeleteUser}
          onClose={() => setUserToDelete(null)}
        />
      )}
    </div>
  )
}
