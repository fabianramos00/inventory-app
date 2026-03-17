import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, DollarSign, ShoppingCart, Clock, Truck, Loader, Eye, ChevronDown, Calendar, Trash2 } from 'lucide-react'
import DataTable from '@/components/DataTable/DataTable'
import styles from './Sales.module.css'
import PageHeader from '@/components/PageHeader/PageHeader'
import CommandBar from '@/components/CommandBar/CommandBar'
import DataCard from '@/components/DataCard/DataCard'
import { salesApi } from '@/lib/api/sales'
import { PAGE_LIMIT } from '@/lib/constants'
import { usersApi } from '@/lib/api/users'
import { useModalContext } from '@/context/ModalContext'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal/ConfirmDeleteModal'
import type { Sale, FilterOption } from '@/types'

const paymentStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  partial: 'Parcial',
}

const paymentStatusBadge: Record<string, string> = {
  pending: 'badge--destructive',
  paid: 'badge--success',
  partial: 'badge--warning',
}

const deliveryStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  delivered: 'Entregado',
}

const deliveryStatusBadge: Record<string, string> = {
  pending: 'badge--warning',
  partial: 'badge--warning',
  delivered: 'badge--success',
}

const paymentMethodLabel: Record<string, string> = {
  cash: 'Efectivo',
  credit: 'Crédito',
  debit: 'Débito',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Sales() {
  const navigate = useNavigate()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ unpaid_count: 0, undelivered_count: 0, total_amount_sum: 0, amount_paid_sum: 0 })
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const limit = PAGE_LIMIT
  const [saleToDelete, setSaleToDelete] = useState<{ id: number; label: string } | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const { openModal: contextOpenModal, closeModal: contextCloseModal } = useModalContext()

  // Filter state
  const [selectedUser, setSelectedUser] = useState<number | ''>('')
  const [selectedClient, setSelectedClient] = useState<number | ''>('')
  const [noClient, setNoClient] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState('')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Dropdown options (API-driven)
  const [userOptions, setUserOptions] = useState<FilterOption[]>([])
  const [clientOptions, setClientOptions] = useState<FilterOption[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  const [clientLoading, setClientLoading] = useState(false)

  const userRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<HTMLDivElement>(null)
  const paymentMethodRef = useRef<HTMLDivElement>(null)
  const deliveryStatusRef = useRef<HTMLDivElement>(null)
  const paymentStatusRef = useRef<HTMLDivElement>(null)
  const userTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const clientTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (userTimeoutRef.current) clearTimeout(userTimeoutRef.current)
    userTimeoutRef.current = setTimeout(async () => {
      if (openDropdown !== 'user') return
      setUserLoading(true)
      try {
        const response = await usersApi.getUsers({ search: userSearch || undefined, skip: 0, limit: 10 })
        setUserOptions((response.data.items || []).map(u => ({ id: u.id, name: u.full_name })))
      } catch {
        setUserOptions([])
      } finally {
        setUserLoading(false)
      }
    }, 300)
    return () => { if (userTimeoutRef.current) clearTimeout(userTimeoutRef.current) }
  }, [userSearch, openDropdown])

  useEffect(() => {
    if (clientTimeoutRef.current) clearTimeout(clientTimeoutRef.current)
    clientTimeoutRef.current = setTimeout(async () => {
      if (openDropdown !== 'client') return
      setClientLoading(true)
      try {
        const response = await salesApi.getClients({ search: clientSearch || undefined, skip: 0, limit: 10 })
        setClientOptions(response.data.items || [])
      } catch {
        setClientOptions([])
      } finally {
        setClientLoading(false)
      }
    }, 300)
    return () => { if (clientTimeoutRef.current) clearTimeout(clientTimeoutRef.current) }
  }, [clientSearch, openDropdown])

  useEffect(() => {
    let cancelled = false
    salesApi.getStats()
      .then(r => { if (!cancelled) setStats(r.data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [reloadTrigger])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const refs = [userRef, clientRef, paymentMethodRef, deliveryStatusRef, paymentStatusRef]
      if (refs.every(r => !r.current?.contains(target))) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const params: Record<string, unknown> = { skip: (page - 1) * limit, limit }
        if (selectedUser) params.user_id = selectedUser
        if (noClient) {
          params.no_client = true
        } else if (selectedClient) {
          params.client_id = selectedClient
        }
        if (selectedPaymentMethod) params.payment_method = selectedPaymentMethod
        if (selectedDeliveryStatus) params.delivery_status = selectedDeliveryStatus
        if (selectedPaymentStatus) params.payment_status = selectedPaymentStatus
        if (startDate) params.start_date = startDate
        if (endDate) params.end_date = endDate

        const response = await salesApi.getSales(params)
        if (cancelled) return
        setSales(response.data.items || [])
        setHasNext(response.data.has_next)
      } catch {
        if (!cancelled) setSales([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, selectedUser, selectedClient, noClient, selectedPaymentMethod, selectedDeliveryStatus, selectedPaymentStatus, startDate, endDate, reloadTrigger])

  useEffect(() => {
    if (saleToDelete) contextOpenModal()
    else contextCloseModal()
  }, [saleToDelete, contextOpenModal, contextCloseModal])

  async function handleDeleteConfirm() {
    await salesApi.deleteSale(saleToDelete!.id)
    setSaleToDelete(null)
    setReloadTrigger(t => t + 1)
  }

  const selectedUserName = userOptions.find(u => u.id === selectedUser)?.name || 'Usuario'
  const selectedClientName = noClient ? 'Sin cliente' : (clientOptions.find(c => c.id === selectedClient)?.name || 'Cliente')
  const clientFilterActive = noClient || !!selectedClient

  return (
    <div className={styles.container}>
      <PageHeader
        prefix="VNT"
        activeLabel="Gestión"
        title="Ventas"
        action={
          <button className="btn-new" onClick={() => navigate('/sales/create')}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Nueva Venta</span>
          </button>
        }
      />

      <div className={styles.kpiStrip}>
        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>Total ventas</div>
            <div className={styles.kpiIconWrapperSuccess}><DollarSign size={16} /></div>
          </div>
          <div className={styles.kpiValue} style={{ color: 'var(--success)' }}>
            <span className={styles.currencySymbol}>$</span>
            {stats.total_amount_sum.toLocaleString('es-PE', { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>Total cobrado</div>
            <div className={styles.kpiIconWrapperAccent}><ShoppingCart size={16} /></div>
          </div>
          <div className={styles.kpiValue}>
            <span className={styles.currencySymbol}>$</span>
            {stats.amount_paid_sum.toLocaleString('es-PE', { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>Sin pagar</div>
            <div className={styles.kpiIconWrapperDestructive}><Clock size={16} /></div>
          </div>
          <div className={styles.kpiValue} style={{ color: 'var(--destructive)' }}>
            {stats.unpaid_count}
          </div>
        </div>

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>Sin entregar</div>
            <div className={styles.kpiIconWrapperWarning}><Truck size={16} /></div>
          </div>
          <div className={styles.kpiValue} style={{ color: 'var(--warning)' }}>
            {stats.undelivered_count}
          </div>
        </div>
      </div>

      <div className={styles.tableSection}>
        <CommandBar search="" onSearchChange={() => {}}>

            {/* Usuario */}
            <div className={styles.dynamicDropdown} ref={userRef}>
              <button
                className={`${styles.dropdownTrigger} ${selectedUser ? styles.filterActive : ''}`}
                onClick={() => openDropdown === 'user' ? setOpenDropdown(null) : (setOpenDropdown('user'), setUserSearch(''))}
              >
                {selectedUserName}
                <ChevronDown size={14} />
              </button>
              {openDropdown === 'user' && (
                <div className={styles.dropdownContent}>
                  <input
                    type="text"
                    className={styles.dropdownSearch}
                    placeholder="Buscar usuario..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.dropdownOptions}>
                    <div className={styles.dropdownOption} onClick={() => { setSelectedUser(''); setOpenDropdown(null); setPage(1) }}>
                      Todos los Usuarios
                    </div>
                    {userLoading ? (
                      <div className={styles.dropdownOption} style={{ justifyContent: 'center' }}>
                        <Loader size={14} className={styles.loadingSpinner} />
                      </div>
                    ) : (
                      userOptions.map(u => (
                        <div
                          key={u.id}
                          className={`${styles.dropdownOption} ${selectedUser === u.id ? styles.active : ''}`}
                          onClick={() => { setSelectedUser(u.id); setUserSearch(''); setOpenDropdown(null); setPage(1) }}
                        >
                          {u.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cliente */}
            <div className={styles.dynamicDropdown} ref={clientRef}>
              <button
                className={`${styles.dropdownTrigger} ${clientFilterActive ? styles.filterActive : ''}`}
                onClick={() => openDropdown === 'client' ? setOpenDropdown(null) : (setOpenDropdown('client'), setClientSearch(''))}
              >
                {selectedClientName}
                <ChevronDown size={14} />
              </button>
              {openDropdown === 'client' && (
                <div className={styles.dropdownContent}>
                  <input
                    type="text"
                    className={styles.dropdownSearch}
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.dropdownOptions}>
                    <div className={styles.dropdownOption} onClick={() => { setSelectedClient(''); setNoClient(false); setOpenDropdown(null); setPage(1) }}>
                      Todos los Clientes
                    </div>
                    <div
                      className={`${styles.dropdownOption} ${noClient ? styles.active : ''}`}
                      onClick={() => { setSelectedClient(''); setNoClient(true); setOpenDropdown(null); setPage(1) }}
                    >
                      Sin cliente
                    </div>
                    {clientLoading ? (
                      <div className={styles.dropdownOption} style={{ justifyContent: 'center' }}>
                        <Loader size={14} className={styles.loadingSpinner} />
                      </div>
                    ) : (
                      clientOptions.map(c => (
                        <div
                          key={c.id}
                          className={`${styles.dropdownOption} ${selectedClient === c.id ? styles.active : ''}`}
                          onClick={() => { setSelectedClient(c.id); setNoClient(false); setClientSearch(''); setOpenDropdown(null); setPage(1) }}
                        >
                          {c.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Método de pago */}
            <div className={styles.dynamicDropdown} ref={paymentMethodRef}>
              <button
                className={`${styles.dropdownTrigger} ${selectedPaymentMethod ? styles.filterActive : ''}`}
                onClick={() => setOpenDropdown(openDropdown === 'payment_method' ? null : 'payment_method')}
              >
                {selectedPaymentMethod ? paymentMethodLabel[selectedPaymentMethod] : 'Método pago'}
                <ChevronDown size={14} />
              </button>
              {openDropdown === 'payment_method' && (
                <div className={styles.dropdownContent}>
                  <div className={styles.dropdownOptions}>
                    <div className={styles.dropdownOption} onClick={() => { setSelectedPaymentMethod(''); setOpenDropdown(null); setPage(1) }}>
                      Todos
                    </div>
                    {(['cash', 'credit', 'debit'] as const).map(m => (
                      <div
                        key={m}
                        className={`${styles.dropdownOption} ${selectedPaymentMethod === m ? styles.active : ''}`}
                        onClick={() => { setSelectedPaymentMethod(m); setOpenDropdown(null); setPage(1) }}
                      >
                        {paymentMethodLabel[m]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Estado entrega */}
            <div className={styles.dynamicDropdown} ref={deliveryStatusRef}>
              <button
                className={`${styles.dropdownTrigger} ${selectedDeliveryStatus ? styles.filterActive : ''}`}
                onClick={() => setOpenDropdown(openDropdown === 'delivery_status' ? null : 'delivery_status')}
              >
                {selectedDeliveryStatus ? deliveryStatusLabel[selectedDeliveryStatus] : 'Entrega'}
                <ChevronDown size={14} />
              </button>
              {openDropdown === 'delivery_status' && (
                <div className={styles.dropdownContent}>
                  <div className={styles.dropdownOptions}>
                    <div className={styles.dropdownOption} onClick={() => { setSelectedDeliveryStatus(''); setOpenDropdown(null); setPage(1) }}>
                      Todos
                    </div>
                    {(['pending', 'partial', 'delivered'] as const).map(s => (
                      <div
                        key={s}
                        className={`${styles.dropdownOption} ${selectedDeliveryStatus === s ? styles.active : ''}`}
                        onClick={() => { setSelectedDeliveryStatus(s); setOpenDropdown(null); setPage(1) }}
                      >
                        {deliveryStatusLabel[s]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Estado pago */}
            <div className={styles.dynamicDropdown} ref={paymentStatusRef}>
              <button
                className={`${styles.dropdownTrigger} ${selectedPaymentStatus ? styles.filterActive : ''}`}
                onClick={() => setOpenDropdown(openDropdown === 'payment_status' ? null : 'payment_status')}
              >
                {selectedPaymentStatus ? paymentStatusLabel[selectedPaymentStatus] : 'Estado pago'}
                <ChevronDown size={14} />
              </button>
              {openDropdown === 'payment_status' && (
                <div className={styles.dropdownContent}>
                  <div className={styles.dropdownOptions}>
                    <div className={styles.dropdownOption} onClick={() => { setSelectedPaymentStatus(''); setOpenDropdown(null); setPage(1) }}>
                      Todos
                    </div>
                    {(['paid', 'pending', 'partial'] as const).map(s => (
                      <div
                        key={s}
                        className={`${styles.dropdownOption} ${selectedPaymentStatus === s ? styles.active : ''}`}
                        onClick={() => { setSelectedPaymentStatus(s); setOpenDropdown(null); setPage(1) }}
                      >
                        {paymentStatusLabel[s]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fecha inicio */}
            <div className={`${styles.dateWrapper} ${startDate ? styles.filterActive : ''}`}>
              <Calendar size={13} className={styles.dateIcon} />
              <input
                type="date"
                className={styles.dateInput}
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1) }}
                title="Fecha inicio"
              />
            </div>

            {/* Fecha fin */}
            <div className={`${styles.dateWrapper} ${endDate ? styles.filterActive : ''}`}>
              <Calendar size={13} className={styles.dateIcon} />
              <input
                type="date"
                className={styles.dateInput}
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setPage(1) }}
                title="Fecha fin"
              />
            </div>

        </CommandBar>

        <DataCard>
          <DataTable
            loading={loading}
            empty={sales.length === 0}
            loadingText="Cargando ventas..."
            emptyText="No se encontraron ventas."
            minWidth="760px"
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Deuda</th>
                <th>Pago</th>
                <th>Entrega</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td>
                    <button className={styles.codeLink} onClick={() => navigate(`/sales/${s.id}`)} title="Ver venta">
                      #{s.id}
                    </button>
                  </td>
                  <td><span className={styles.customerCell}>{s.client?.name ?? <span className={styles.emptyCell}>Sin cliente</span>}</span></td>
                  <td><span className={styles.totalCell}>$ {s.total_amount.toFixed(2)}</span></td>
                  <td><span className={styles.amountCell}>$ {s.amount_paid.toFixed(2)}</span></td>
                  <td><span className={`${styles.debtCell} ${s.debt_amount > 0 ? styles.debtCellActive : ''}`}>$ {s.debt_amount.toFixed(2)}</span></td>
                  <td>
                    <span className={styles[paymentStatusBadge[s.payment_status] ?? 'badge--warning']}>
                      {paymentStatusLabel[s.payment_status] ?? s.payment_status}
                    </span>
                  </td>
                  <td>
                    <span className={styles[deliveryStatusBadge[s.delivery_status] ?? 'badge--warning']}>
                      {deliveryStatusLabel[s.delivery_status] ?? s.delivery_status}
                    </span>
                  </td>
                  <td><span className={styles.userCell}>{s.created_by.full_name}</span></td>
                  <td><span className={styles.dateCell}>{formatDate(s.created_at)}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        className="action-btn"
                        onClick={() => navigate(`/sales/${s.id}`)}
                        title="Ver venta"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="action-btn action-btn--destructive"
                        onClick={() => setSaleToDelete({ id: s.id, label: `Venta #${s.id}${s.client ? ` — ${s.client.name}` : ''}` })}
                        title="Eliminar venta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          {!loading && sales.length > 0 && (page > 1 || hasNext) && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                Anterior
              </button>
              <span className={styles.pageInfo}>Página {page}</span>
              <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={!hasNext}>
                Siguiente
              </button>
            </div>
          )}
        </DataCard>
      </div>
      {saleToDelete && (
        <ConfirmDeleteModal
          productName={saleToDelete.label}
          onConfirm={handleDeleteConfirm}
          onClose={() => setSaleToDelete(null)}
        />
      )}
    </div>
  )
}
