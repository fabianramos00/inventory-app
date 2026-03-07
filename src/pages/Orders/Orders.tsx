import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader, Eye, Trash2, ChevronDown, Calendar } from 'lucide-react'
import styles from './Orders.module.css'
import { ordersApi } from '@/lib/api/orders'
import { providersApi } from '@/lib/api/providers'
import { useModalContext } from '@/context/ModalContext'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal/ConfirmDeleteModal'
import type { Order, FilterOption } from '@/types'

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  sent: 'Enviado',
  received: 'Recibido',
  cancelled: 'Cancelado',
}

const statusBadge: Record<string, string> = {
  pending: 'badge--warning',
  sent: 'badge--warning',
  received: 'badge--success',
  cancelled: 'badge--destructive',
}

const paymentStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
}

const paymentStatusBadge: Record<string, string> = {
  pending: 'badge--destructive',
  paid: 'badge--success',
}


function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const limit = 10
  const [orderToDelete, setOrderToDelete] = useState<{ id: number; label: string } | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const { openModal: contextOpenModal, closeModal: contextCloseModal } = useModalContext()

  // Filter state
  const [selectedProvider, setSelectedProvider] = useState<number | ''>('')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [minDate, setMinDate] = useState('')
  const [maxDate, setMaxDate] = useState('')

  // Dropdown state
  const [providerOptions, setProviderOptions] = useState<FilterOption[]>([])
  const [providerSearch, setProviderSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [providerLoading, setProviderLoading] = useState(false)

  const providerRef = useRef<HTMLDivElement>(null)
  const paymentStatusRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const providerTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (providerTimeoutRef.current) clearTimeout(providerTimeoutRef.current)
    providerTimeoutRef.current = setTimeout(async () => {
      if (openDropdown !== 'provider') return
      setProviderLoading(true)
      try {
        const response = await providersApi.getProviders({ search: providerSearch || undefined, skip: 0, limit: 10 })
        setProviderOptions((response.data.items || []).map(p => ({ id: p.id, name: p.name })))
      } catch {
        setProviderOptions([])
      } finally {
        setProviderLoading(false)
      }
    }, 300)
    return () => { if (providerTimeoutRef.current) clearTimeout(providerTimeoutRef.current) }
  }, [providerSearch, openDropdown])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const refs = [providerRef, paymentStatusRef, statusRef]
      if (refs.every(r => !r.current?.contains(target))) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (orderToDelete) contextOpenModal()
    else contextCloseModal()
  }, [orderToDelete, contextOpenModal, contextCloseModal])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const params: Record<string, unknown> = { skip: (page - 1) * limit, limit }
        if (selectedProvider) params.provider_id = selectedProvider
        if (selectedPaymentStatus) params.payment_status = selectedPaymentStatus
        if (selectedStatus) params.status = selectedStatus
        if (minDate) params.min_date = minDate
        if (maxDate) params.max_date = maxDate

        const response = await ordersApi.getOrders(params)
        if (cancelled) return
        setOrders(response.data.items || [])
        setHasNext(response.data.has_next)
      } catch {
        if (!cancelled) setOrders([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, selectedProvider, selectedPaymentStatus, selectedStatus, minDate, maxDate, reloadTrigger])

  async function handleDeleteConfirm() {
    await ordersApi.deleteOrder(orderToDelete!.id)
    setOrderToDelete(null)
    setReloadTrigger(t => t + 1)
  }

  const selectedProviderName = providerOptions.find(p => p.id === selectedProvider)?.name || 'Proveedor'

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>
            <span>PED</span>
            <span className={styles.breadcrumbDivider}>/</span>
            <span className={styles.breadcrumbActive}>Registro</span>
          </div>
          <h1 className={styles.pageTitle}>Pedidos de Compra</h1>
        </div>
        <button className={styles.newOrderBtn} onClick={() => navigate('/orders/create')}>
          <Plus size={16} strokeWidth={2.5} />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      <div className={styles.tableSection}>
        <div className={styles.commandBar}>
          <div className={styles.controlsBar}>

            {/* Proveedor */}
            <div className={styles.dynamicDropdown} ref={providerRef}>
              <button
                className={`${styles.dropdownTrigger} ${selectedProvider ? styles.filterActive : ''}`}
                onClick={() => openDropdown === 'provider' ? setOpenDropdown(null) : (setOpenDropdown('provider'), setProviderSearch(''))}
              >
                {selectedProviderName}
                <ChevronDown size={14} />
              </button>
              {openDropdown === 'provider' && (
                <div className={styles.dropdownContent}>
                  <input
                    type="text"
                    className={styles.dropdownSearch}
                    placeholder="Buscar proveedor..."
                    value={providerSearch}
                    onChange={e => setProviderSearch(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.dropdownOptions}>
                    <div className={styles.dropdownOption} onClick={() => { setSelectedProvider(''); setOpenDropdown(null); setPage(1) }}>
                      Todos los Proveedores
                    </div>
                    {providerLoading ? (
                      <div className={styles.dropdownOption} style={{ justifyContent: 'center' }}>
                        <Loader size={14} className={styles.loadingSpinner} />
                      </div>
                    ) : (
                      providerOptions.map(p => (
                        <div
                          key={p.id}
                          className={`${styles.dropdownOption} ${selectedProvider === p.id ? styles.active : ''}`}
                          onClick={() => { setSelectedProvider(p.id); setProviderSearch(''); setOpenDropdown(null); setPage(1) }}
                        >
                          {p.name}
                        </div>
                      ))
                    )}
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
                    {(['pending', 'paid'] as const).map(s => (
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

            {/* Estado */}
            <div className={styles.dynamicDropdown} ref={statusRef}>
              <button
                className={`${styles.dropdownTrigger} ${selectedStatus ? styles.filterActive : ''}`}
                onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              >
                {selectedStatus ? statusLabel[selectedStatus] : 'Estado'}
                <ChevronDown size={14} />
              </button>
              {openDropdown === 'status' && (
                <div className={styles.dropdownContent}>
                  <div className={styles.dropdownOptions}>
                    <div className={styles.dropdownOption} onClick={() => { setSelectedStatus(''); setOpenDropdown(null); setPage(1) }}>
                      Todos
                    </div>
                    {(['pending', 'sent', 'received', 'cancelled'] as const).map(s => (
                      <div
                        key={s}
                        className={`${styles.dropdownOption} ${selectedStatus === s ? styles.active : ''}`}
                        onClick={() => { setSelectedStatus(s); setOpenDropdown(null); setPage(1) }}
                      >
                        {statusLabel[s]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fecha inicio */}
            <div className={`${styles.dateWrapper} ${minDate ? styles.filterActive : ''}`}>
              <Calendar size={13} className={styles.dateIcon} />
              <input
                type="date"
                className={styles.dateInput}
                value={minDate}
                onChange={e => { setMinDate(e.target.value); setPage(1) }}
                title="Fecha inicio"
              />
            </div>

            {/* Fecha fin */}
            <div className={`${styles.dateWrapper} ${maxDate ? styles.filterActive : ''}`}>
              <Calendar size={13} className={styles.dateIcon} />
              <input
                type="date"
                className={styles.dateInput}
                value={maxDate}
                onChange={e => { setMaxDate(e.target.value); setPage(1) }}
                title="Fecha fin"
              />
            </div>

          </div>
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.loadingState}>
              <Loader size={24} className={styles.loadingSpinner} />
              <p>Cargando pedidos...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full">
                <table className="data-table w-full min-w-[640px]">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Proveedor</th>
                      <th>Total</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Pago</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td>
                          <button className={styles.codeLink} onClick={() => navigate(`/orders/${o.id}`)} title="Ver pedido">
                            #{o.id}
                          </button>
                        </td>
                        <td><span className={styles.customerCell}>{o.provider.name}</span></td>
                        <td><span className={styles.totalCell}>$ {o.total_amount.toFixed(2)}</span></td>
                        <td><span className={styles.dateCell}>{formatDate(o.order_date)}</span></td>
                        <td>
                          <span className={styles[statusBadge[o.status] ?? 'badge--warning']}>
                            {statusLabel[o.status] ?? o.status}
                          </span>
                        </td>
                        <td>
                          <span className={styles[paymentStatusBadge[o.payment_status] ?? 'badge--warning']}>
                            {paymentStatusLabel[o.payment_status] ?? o.payment_status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionCell}>
                            <button
                              className={styles.actionBtn}
                              onClick={() => navigate(`/orders/${o.id}`)}
                              title="Ver pedido"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className={styles.deleteActionBtn}
                              onClick={() => setOrderToDelete({ id: o.id, label: `Pedido #${o.id} — ${o.provider.name}` })}
                              title="Eliminar pedido"
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

              {orders.length === 0 && (
                <div className={styles.emptyState}>No se encontraron pedidos.</div>
              )}

              {(page > 1 || hasNext) && (
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
            </>
          )}
        </div>
      </div>
      {orderToDelete && (
        <ConfirmDeleteModal
          productName={orderToDelete.label}
          onConfirm={handleDeleteConfirm}
          onClose={() => setOrderToDelete(null)}
        />
      )}
    </div>
  )
}
