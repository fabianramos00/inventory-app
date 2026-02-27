import { Plus, Search, Shield, User as UserIcon } from 'lucide-react'
import styles from './Users.module.css'

type Role = 'admin' | 'manager' | 'employee'

const mockUsers = [
  { id: 1, name: 'María Rodríguez', email: 'mrodriguez@ferreteria.pe', role: 'admin' as Role, active: true, lastSeen: 'Hace 5 min' },
  { id: 2, name: 'Carlos Mendoza', email: 'cmendoza@ferreteria.pe', role: 'manager' as Role, active: true, lastSeen: 'Hace 1h' },
  { id: 3, name: 'Luis Paredes', email: 'lparedes@ferreteria.pe', role: 'employee' as Role, active: true, lastSeen: 'Hace 2h' },
  { id: 4, name: 'Ana Torres', email: 'atorres@ferreteria.pe', role: 'employee' as Role, active: false, lastSeen: 'Hace 3 días' },
  { id: 5, name: 'Roberto Salas', email: 'rsalas@ferreteria.pe', role: 'employee' as Role, active: true, lastSeen: 'Ayer' },
]

const roleConfig: Record<Role, { label: string; cls: string }> = {
  admin: { label: 'Administrador', cls: 'badge--warning' },
  manager: { label: 'Gerente', cls: 'badge--neutral' },
  employee: { label: 'Empleado', cls: 'badge--neutral' },
}

const colors = ['#FACC15', '#2563EB', '#16A34A', '#D97706', '#7C3AED']

export default function Users() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className="bin-label mb-1 inline-block">USR / Gestión</span>
          <h2 className={styles.title}>Usuarios</h2>
        </div>
        <button className={styles.headerActions}>
          <Plus size={13} /> Nuevo Usuario
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchCard}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input type="text" className={styles.searchInput} placeholder="Buscar usuario..." />
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className="overflow-x-auto w-full">
          <table className="data-table w-full min-w-[700px]">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Última actividad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((u, i) => (
              <tr key={u.id}>
                <td>
                  <div className={styles.userCell}>
                    <div
                      className={styles.avatar}
                      style={{ background: colors[i % colors.length] }}
                    >
                      {u.name.charAt(0)}
                    </div>
                    <span className={styles.userName}>{u.name}</span>
                  </div>
                </td>
                <td><span className={styles.emailCell}>{u.email}</span></td>
                <td>
                  <div className={styles.roleCell}>
                    {u.role === 'admin'
                      ? <Shield size={12} className={styles.adminIcon} />
                      : <UserIcon size={12} className={styles.userIcon} />
                    }
                    <span className={`badge ${roleConfig[u.role].cls}`}>{roleConfig[u.role].label}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${u.active ? 'badge--success' : 'badge--neutral'}`}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td><span className={styles.lastActivityCell}>{u.lastSeen}</span></td>
                <td>
                  <div className={styles.actionsContainer}>
                    <button className={styles.editBtn}>
                      Editar
                    </button>
                    <button className={styles.toggleStatusBtn}>
                      {u.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
