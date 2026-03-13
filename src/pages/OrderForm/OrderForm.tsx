import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Search, X, Loader, ChevronDown, Package, Pencil, Check, Trash2, Plus } from 'lucide-react'
import styles from './OrderForm.module.css'
import PageHeader from '@/components/PageHeader/PageHeader'
import { ordersApi } from '@/lib/api/orders'
import { inventoryApi } from '@/lib/api/inventory'
import { providersApi } from '@/lib/api/providers'
import { useModalContext } from '@/context/ModalContext'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal/ConfirmDeleteModal'
import CreateFormModal, { type FieldConfig } from '@/components/CreateFormModal/CreateFormModal'
import type { Product, Order, OrderItem, OrderStatus, OrderPaymentStatus, FilterOption, CreateOrderInput } from '@/types'

const statusLabel: Record<string, string> = {
  pending: 'Pendiente', sent: 'Enviado', received: 'Recibido', cancelled: 'Cancelado',
}
const statusBadge: Record<string, string> = {
  pending: 'badge--warning', sent: 'badge--warning', received: 'badge--success', cancelled: 'badge--destructive',
}
const paymentStatusLabel: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado',
}
const paymentStatusBadge: Record<string, string> = {
  pending: 'badge--destructive', paid: 'badge--success',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface OrderItemDraft {
  product_id: number
  product_name: string
  product_sku: string
  product_category: string
  product_brand: string
  product_material: string
  quantity: number
  unit_cost: string
  supplier_sku: string
}

const PROVIDER_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Nombre', placeholder: 'Nombre del proveedor', required: true },
  { key: 'contact_info', label: 'Información de contacto (opcional)', placeholder: 'Persona de contacto u otra info' },
  { key: 'email', label: 'Correo electrónico (opcional)', placeholder: 'correo@ejemplo.com', type: 'email' },
  { key: 'phone', label: 'Teléfono (opcional)', placeholder: 'Número de teléfono', type: 'tel' },
]

export default function OrderForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isCreateMode = !id

  // View mode state
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [pageLoading, setPageLoading] = useState(!isCreateMode)

  // View mode scoped edit: items
  const [isEditingItems, setIsEditingItems] = useState(false)
  const [editingItems, setEditingItems] = useState<{ id: number; quantity: string; unit_cost: string; supplier_sku: string }[]>([])
  const [pendingItems, setPendingItems] = useState<{
    product_id: number; product_name: string; product_sku: string
    product_category: string; product_brand: string; product_material: string
    quantity: string; unit_cost: string; supplier_sku: string
  }[]>([])
  const [savingItemId, setSavingItemId] = useState<number | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)

  // View mode scoped edit: details
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editProviderId, setEditProviderId] = useState<number | ''>('')
  const [editProviderOptions, setEditProviderOptions] = useState<FilterOption[]>([])
  const [editProviderSearch, setEditProviderSearch] = useState('')
  const [editProviderOpen, setEditProviderOpen] = useState(false)
  const [editProviderLoading, setEditProviderLoading] = useState(false)
  const [editStatus, setEditStatus] = useState<OrderStatus>('pending')
  const [editPaymentStatus, setEditPaymentStatus] = useState<OrderPaymentStatus>('pending')
  const [editOpenDropdown, setEditOpenDropdown] = useState<string | null>(null)
  const editProviderRef = useRef<HTMLDivElement>(null)
  const editStatusRef = useRef<HTMLDivElement>(null)
  const editPaymentStatusRef = useRef<HTMLDivElement>(null)
  const editProviderTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateProvider, setShowCreateProvider] = useState(false)
  const { openModal: contextOpenModal, closeModal: contextCloseModal } = useModalContext()

  // Create mode state
  const [items, setItems] = useState<OrderItemDraft[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [productLoading, setProductLoading] = useState(false)
  const productSearchRef = useRef<HTMLDivElement>(null)
  const productSearchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [providerId, setProviderId] = useState<number | ''>('')
  const [providerOptions, setProviderOptions] = useState<FilterOption[]>([])
  const [providerSearch, setProviderSearch] = useState('')
  const [providerOpen, setProviderOpen] = useState(false)
  const [providerLoading, setProviderLoading] = useState(false)
  const providerRef = useRef<HTMLDivElement>(null)
  const providerTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pending')
  const [orderPaymentStatus, setOrderPaymentStatus] = useState<OrderPaymentStatus>('pending')
  const [openFormDropdown, setOpenFormDropdown] = useState<string | null>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const paymentStatusRef = useRef<HTMLDivElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // ─── Load order in view mode ───────────────────────────────────────────────
  useEffect(() => {
    if (isCreateMode) return
    const load = async () => {
      try {
        const [orderRes, itemsRes] = await Promise.all([
          ordersApi.getOrder(Number(id)),
          ordersApi.getOrderItems(Number(id), { skip: 0, limit: 100 }),
        ])
        setOrder(orderRes.data)
        setOrderItems(itemsRes.data.items)
      } catch {
        navigate('/orders')
      } finally {
        setPageLoading(false)
      }
    }
    load()
  }, [id, isCreateMode, navigate])

  useEffect(() => {
    if (showDeleteModal || showCreateProvider) contextOpenModal()
    else contextCloseModal()
  }, [showDeleteModal, showCreateProvider, contextOpenModal, contextCloseModal])

  // ─── Edit provider search (view mode) ─────────────────────────────────────
  useEffect(() => {
    if (editProviderTimeout.current) clearTimeout(editProviderTimeout.current)
    if (!editProviderOpen) return
    editProviderTimeout.current = setTimeout(async () => {
      setEditProviderLoading(true)
      try {
        const res = await providersApi.getProviders({ search: editProviderSearch || undefined, skip: 0, limit: 10 })
        setEditProviderOptions((res.data.items || []).map(p => ({ id: p.id, name: p.name })))
      } catch {
        setEditProviderOptions([])
      } finally {
        setEditProviderLoading(false)
      }
    }, 300)
    return () => { if (editProviderTimeout.current) clearTimeout(editProviderTimeout.current) }
  }, [editProviderSearch, editProviderOpen])

  // ─── Click-outside for view mode dropdowns ────────────────────────────────
  useEffect(() => {
    if (isCreateMode) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (!editProviderRef.current?.contains(target)) setEditProviderOpen(false)
      if (!editStatusRef.current?.contains(target) && !editPaymentStatusRef.current?.contains(target)) {
        setEditOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isCreateMode])

  // ─── Create mode: provider search ─────────────────────────────────────────
  useEffect(() => {
    if (!isCreateMode) return
    if (providerTimeout.current) clearTimeout(providerTimeout.current)
    if (!providerOpen) return
    providerTimeout.current = setTimeout(async () => {
      setProviderLoading(true)
      try {
        const res = await providersApi.getProviders({ search: providerSearch || undefined, skip: 0, limit: 10 })
        setProviderOptions((res.data.items || []).map(p => ({ id: p.id, name: p.name })))
      } catch {
        setProviderOptions([])
      } finally {
        setProviderLoading(false)
      }
    }, 300)
    return () => { if (providerTimeout.current) clearTimeout(providerTimeout.current) }
  }, [providerSearch, providerOpen, isCreateMode])

  // ─── Create mode: product search ──────────────────────────────────────────
  useEffect(() => {
    if (!isCreateMode) return
    if (productSearchTimeout.current) clearTimeout(productSearchTimeout.current)
    if (!productSearch.trim()) {
      setProductResults([])
      setProductSearchOpen(false)
      return
    }
    productSearchTimeout.current = setTimeout(async () => {
      setProductLoading(true)
      setProductSearchOpen(true)
      try {
        const res = await inventoryApi.getProducts({ search: productSearch, skip: 0, limit: 8 })
        setProductResults(res.data.items || [])
      } catch {
        setProductResults([])
      } finally {
        setProductLoading(false)
      }
    }, 300)
    return () => { if (productSearchTimeout.current) clearTimeout(productSearchTimeout.current) }
  }, [productSearch, isCreateMode])

  // ─── Create mode: click-outside for dropdowns ─────────────────────────────
  useEffect(() => {
    if (!isCreateMode) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (!productSearchRef.current?.contains(target)) setProductSearchOpen(false)
      if (!providerRef.current?.contains(target)) setProviderOpen(false)
      if (!statusRef.current?.contains(target) && !paymentStatusRef.current?.contains(target)) {
        setOpenFormDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isCreateMode])

  // ─── View mode: edit items ─────────────────────────────────────────────────
  function handleStartEditItems() {
    setEditingItems(orderItems.map(item => ({
      id: item.id,
      quantity: String(item.quantity),
      unit_cost: String(item.unit_cost),
      supplier_sku: item.supplier_sku ?? '',
    })))
    setIsEditingItems(true)
  }

  function handleCancelEditItems() {
    setIsEditingItems(false)
    setEditingItems([])
    setPendingItems([])
    setProductSearch('')
    setProductSearchOpen(false)
  }

  function handleStartEditDetails() {
    if (!order) return
    setEditProviderId(order.provider_id)
    setEditProviderOptions([{ id: order.provider.id, name: order.provider.name }])
    setEditStatus(order.status)
    setEditPaymentStatus(order.payment_status)
    setIsEditingDetails(true)
  }

  function handleCancelEditDetails() {
    setIsEditingDetails(false)
    setEditOpenDropdown(null)
    setEditProviderOpen(false)
  }

  async function handleSaveDetails() {
    if (!order) return
    setIsSaving(true)
    try {
      const res = await ordersApi.updateOrder(order.id, {
        provider_id: editProviderId || undefined,
        status: editStatus,
        payment_status: editPaymentStatus,
      })
      setOrder(res.data)
      setIsEditingDetails(false)
    } catch {
      // keep editing so user can retry
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteOrder() {
    if (!order) return
    await ordersApi.deleteOrder(order.id)
    navigate('/orders')
  }

  async function submitCreateProvider(v: Record<string, string>) {
    const res = await providersApi.createProvider({
      name: v.name,
      ...(v.contact_info && { contact_info: v.contact_info }),
      ...(v.email && { email: v.email }),
      ...(v.phone && { phone: v.phone }),
    })
    return { id: res.data.id, name: res.data.name }
  }

  function handleProviderCreated(provider: { id: number; name: string }) {
    setProviderOptions(prev => [provider, ...prev.filter(p => p.id !== provider.id)])
    setProviderId(provider.id)
    setEditProviderOptions(prev => [provider, ...prev.filter(p => p.id !== provider.id)])
    setEditProviderId(provider.id)
    setShowCreateProvider(false)
  }

  function updateEditingItem(itemId: number, field: 'quantity' | 'unit_cost' | 'supplier_sku', value: string) {
    setEditingItems(prev => prev.map(e => e.id === itemId ? { ...e, [field]: value } : e))
  }

  async function handleSaveItem(itemId: number) {
    if (!order) return
    const editItem = editingItems.find(e => e.id === itemId)
    if (!editItem) return
    setSavingItemId(itemId)
    try {
      const res = await ordersApi.updateOrderItem(order.id, itemId, {
        quantity: parseFloat(editItem.quantity) || 1,
        unit_cost: parseFloat(editItem.unit_cost) || 0,
        supplier_sku: editItem.supplier_sku || undefined,
      })
      setOrder(res.data)
      const qty = parseFloat(editItem.quantity) || 1
      const cost = parseFloat(editItem.unit_cost) || 0
      setOrderItems(prev => prev.map(item => item.id === itemId ? {
        ...item,
        quantity: qty,
        unit_cost: cost,
        subtotal: qty * cost,
        supplier_sku: editItem.supplier_sku || null,
      } : item))
    } catch {
      // keep editing
    } finally {
      setSavingItemId(null)
    }
  }

  async function handleDeleteItem(itemId: number) {
    if (!order) return
    setDeletingItemId(itemId)
    try {
      const res = await ordersApi.deleteOrderItem(order.id, itemId)
      setOrder(res.data)
      setOrderItems(prev => prev.filter(item => item.id !== itemId))
      setEditingItems(prev => prev.filter(e => e.id !== itemId))
    } catch {
      // keep item
    } finally {
      setDeletingItemId(null)
    }
  }

  function handleAddPendingItem(product: Product) {
    setProductSearch('')
    setProductSearchOpen(false)
    if (orderItems.some(i => i.product_id === product.id) || pendingItems.some(p => p.product_id === product.id)) return
    setPendingItems(prev => [...prev, {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      product_category: product.category?.name ?? '',
      product_brand: product.brand?.name ?? '',
      product_material: product.material?.name ?? '',
      quantity: '1',
      unit_cost: product.cost ? String(product.cost) : '',
      supplier_sku: '',
    }])
  }

  function updatePendingItem(productId: number, field: 'quantity' | 'unit_cost' | 'supplier_sku', value: string) {
    setPendingItems(prev => prev.map(p => p.product_id === productId ? { ...p, [field]: value } : p))
  }

  function handleDiscardPendingItem(productId: number) {
    setPendingItems(prev => prev.filter(p => p.product_id !== productId))
  }

  async function handleSavePendingItem(productId: number) {
    if (!order) return
    const pending = pendingItems.find(p => p.product_id === productId)
    if (!pending) return
    try {
      const res = await ordersApi.addOrderItem(order.id, {
        product_id: pending.product_id,
        quantity: parseFloat(pending.quantity) || 1,
        unit_cost: parseFloat(pending.unit_cost) || 0,
        supplier_sku: pending.supplier_sku || undefined,
      })
      setOrder(res.data)
      const itemsRes = await ordersApi.getOrderItems(order.id, { skip: 0, limit: 100 })
      const freshItems = itemsRes.data.items
      setOrderItems(freshItems)
      const newItem = freshItems.find(i => i.product_id === productId)
      if (newItem) {
        setEditingItems(prev => [...prev, {
          id: newItem.id,
          quantity: pending.quantity,
          unit_cost: pending.unit_cost,
          supplier_sku: pending.supplier_sku,
        }])
      }
      setPendingItems(prev => prev.filter(p => p.product_id !== productId))
    } catch {
      // keep pending so user can retry
    }
  }

  // ─── Create mode: items management ────────────────────────────────────────
  function addProduct(product: Product) {
    if (items.some(i => i.product_id === product.id)) {
      setProductSearch('')
      setProductSearchOpen(false)
      return
    }
    setItems(prev => [...prev, {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      product_category: product.category?.name ?? '',
      product_brand: product.brand?.name ?? '',
      product_material: product.material?.name ?? '',
      quantity: 1,
      unit_cost: product.cost ? String(product.cost) : '',
      supplier_sku: '',
    }])
    setProductSearch('')
    setProductSearchOpen(false)
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof Pick<OrderItemDraft, 'quantity' | 'unit_cost' | 'supplier_sku'>, value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const estimatedTotal = items.reduce((acc, item) => {
    const cost = item.unit_cost !== '' ? parseFloat(item.unit_cost) || 0 : 0
    return acc + cost * Number(item.quantity)
  }, 0)

  const selectedProviderName = providerOptions.find(p => p.id === providerId)?.name || 'Sin proveedor'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)
    setApiError(null)

    if (!providerId) {
      setValidationError('Selecciona un proveedor.')
      return
    }
    if (items.length === 0) {
      setValidationError('Agrega al menos un producto al pedido.')
      return
    }
    for (const item of items) {
      if (!item.quantity || item.quantity < 1) {
        setValidationError('Todos los ítems deben tener una cantidad mayor a 0.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payload: CreateOrderInput = {
        provider_id: providerId as number,
        status: orderStatus,
        payment_status: orderPaymentStatus,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost !== '' ? parseFloat(item.unit_cost) || 0 : 0,
          supplier_sku: item.supplier_sku || undefined,
        })),
      }
      await ordersApi.createOrder(payload)
      navigate('/orders')
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Error al crear el pedido.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const parseNum = (str: string, fallback: number) => {
    const n = parseFloat(str)
    return Number.isFinite(n) ? n : fallback
  }

  const displayTotal = isEditingItems
    ? orderItems.reduce((sum, item) => {
        const ei = editingItems.find(e => e.id === item.id)
        const cost = ei ? parseNum(ei.unit_cost, item.unit_cost) : item.unit_cost
        const qty = ei ? parseNum(ei.quantity, item.quantity) : item.quantity
        return sum + cost * qty
      }, 0) + pendingItems.reduce((sum, p) => {
        return sum + parseNum(p.unit_cost, 0) * parseNum(p.quantity, 0)
      }, 0)
    : order?.total_amount ?? 0

  // ─── View mode rendering ───────────────────────────────────────────────────
  if (!isCreateMode) {
    if (pageLoading || !order) {
      return (
        <div className={styles.pageContainer}>
          <div className={styles.loadingState}>
            <Loader size={24} className={styles.spinner} />
            <p>Cargando pedido...</p>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <button type="button" onClick={() => navigate('/orders')} className={styles.backButton} title="Volver a pedidos">
            <ChevronLeft size={20} />
          </button>
          <PageHeader
            prefix="PED"
            activeLabel={`Pedido #${order.id}`}
            title={order.provider.name}
          />
          <div className={styles.headerActions}>
            <button type="button" onClick={() => setShowDeleteModal(true)} className={styles.deleteButton}>
              <Trash2 size={15} />
              Eliminar
            </button>
          </div>
        </div>

        <div className={styles.sectionsGrid}>
          {/* Productos card */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Productos</h2>
              <div className={styles.cardActions}>
                {isEditingItems ? (
                  <button type="button" onClick={handleCancelEditItems} className={styles.cancelButton}>
                    <X size={15} />
                    Cancelar
                  </button>
                ) : (
                  <button type="button" onClick={handleStartEditItems} className={styles.editButton}>
                    <Pencil size={15} />
                    Editar
                  </button>
                )}
              </div>
            </div>

            {isEditingItems && (
              <div className={styles.productSearchWrapper} ref={productSearchRef}>
                <div className={styles.productSearchField}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.productSearchInput}
                    placeholder="Agregar producto por nombre o SKU..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    autoComplete="off"
                  />
                  {productLoading && <Loader size={13} className={styles.searchSpinner} />}
                </div>
                {productSearchOpen && (
                  <div className={styles.productResults}>
                    {productLoading ? (
                      <div className={styles.productOption} style={{ justifyContent: 'center' }}>
                        <Loader size={14} className={styles.spinner} />
                      </div>
                    ) : productResults.length === 0 ? (
                      <div className={`${styles.productOption} ${styles.productOptionEmpty}`}>Sin resultados</div>
                    ) : (
                      productResults.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className={`${styles.productOption} ${orderItems.some(i => i.product_id === p.id) || pendingItems.some(pi => pi.product_id === p.id) ? styles.productOptionAdded : ''}`}
                          onClick={() => handleAddPendingItem(p)}
                        >
                          <div className={styles.productOptionInfo}>
                            <span className={styles.productOptionName}>{p.name}</span>
                            {p.size_value && <span className={styles.productOptionSize}>{p.size_value} {p.measurement_unit?.abbreviation}</span>}
                            <div className={styles.productOptionTags}>
                              {p.category?.name && <span className={styles.productOptionTag}>{p.category.name}</span>}
                              {p.brand?.name && <span className={styles.productOptionTag}>{p.brand.name}</span>}
                              {p.material?.name && <span className={styles.productOptionTag}>{p.material.name}</span>}
                            </div>
                          </div>
                          <div className={styles.productOptionMeta}>
                            <span className={styles.productOptionSku}>{p.sku}</span>
                            <span className={styles.productOptionPrice}>$ {(p.cost ?? 0).toFixed(2)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {orderItems.length === 0 && pendingItems.length === 0 ? (
              <div className={styles.emptyItems}>
                <Package size={28} className={styles.emptyIcon} />
                <p>Sin productos registrados</p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {orderItems.map(item => {
                  if (isEditingItems) {
                    const editItem = editingItems.find(e => e.id === item.id)
                    if (!editItem) return null
                    return (
                      <div key={item.id} className={styles.itemCard}>
                        <div className={styles.itemHeader}>
                          <div className={styles.itemIdentity}>
                            <div className={styles.itemNameRow}>
                              <span className={styles.itemName}>{item.product_name}</span>
                              {item.product_sku && <span className={styles.itemSku}>{item.product_sku}</span>}
                            </div>
                          </div>
                          <div className={styles.itemEditActions}>
                            <button
                              type="button"
                              className={styles.itemSaveBtn}
                              onClick={() => handleSaveItem(item.id)}
                              disabled={savingItemId === item.id || deletingItemId === item.id}
                              title="Guardar cambios"
                            >
                              {savingItemId === item.id
                                ? <Loader size={13} className={styles.spinner} />
                                : <Check size={13} />}
                            </button>
                            <button
                              type="button"
                              className={styles.removeBtn}
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={deletingItemId === item.id || savingItemId === item.id}
                              title="Eliminar ítem"
                            >
                              {deletingItemId === item.id
                                ? <Loader size={13} className={styles.spinner} />
                                : <X size={14} />}
                            </button>
                          </div>
                        </div>
                        <div className={styles.itemFieldsRow}>
                          <div className={styles.itemField}>
                            <label className={styles.itemFieldLabel}>Cantidad</label>
                            <input
                              type="number"
                              className={`${styles.inputField} ${styles.mono}`}
                              min={1}
                              value={editItem.quantity}
                              onChange={e => updateEditingItem(item.id, 'quantity', e.target.value)}
                            />
                          </div>
                          <div className={styles.itemField}>
                            <label className={styles.itemFieldLabel}>Costo unit.</label>
                            <input
                              type="number"
                              className={`${styles.inputField} ${styles.mono}`}
                              min={0}
                              step="0.01"
                              value={editItem.unit_cost}
                              onChange={e => updateEditingItem(item.id, 'unit_cost', e.target.value)}
                            />
                          </div>
                          <div className={styles.itemField}>
                            <label className={styles.itemFieldLabel}>SKU prov.</label>
                            <input
                              type="text"
                              className={styles.inputField}
                              placeholder="Opcional"
                              value={editItem.supplier_sku}
                              onChange={e => updateEditingItem(item.id, 'supplier_sku', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div key={item.id} className={styles.itemCard}>
                      <div className={styles.itemHeader}>
                        <div className={styles.itemIdentity}>
                          <div className={styles.itemNameRow}>
                            <span className={styles.itemName}>{item.product_name}</span>
                            {item.product_sku && <span className={styles.itemSku}>{item.product_sku}</span>}
                          </div>
                        </div>
                      </div>
                      <div className={styles.itemFieldsRowFour}>
                        <div className={styles.itemField}>
                          <span className={styles.itemFieldLabel}>Cantidad</span>
                          <span className={styles.mono}>{item.quantity}</span>
                        </div>
                        <div className={styles.itemField}>
                          <span className={styles.itemFieldLabel}>Costo unit.</span>
                          <span className={styles.mono}>$ {item.unit_cost.toFixed(2)}</span>
                        </div>
                        <div className={styles.itemField}>
                          <span className={styles.itemFieldLabel}>SKU prov.</span>
                          <span className={`${styles.mono} ${!item.supplier_sku ? styles.emptyFieldValue : ''}`}>
                            {item.supplier_sku || '—'}
                          </span>
                        </div>
                        <div className={styles.itemField}>
                          <span className={styles.itemFieldLabel}>Subtotal</span>
                          <span className={styles.mono}>$ {item.subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {isEditingItems && pendingItems.map(pending => (
                  <div key={pending.product_id} className={`${styles.itemCard} ${styles.itemCardPending}`}>
                    <div className={styles.itemHeader}>
                      <div className={styles.itemIdentity}>
                        <div className={styles.itemNameRow}>
                          <span className={styles.itemName}>{pending.product_name}</span>
                          {pending.product_sku && <span className={styles.itemSku}>{pending.product_sku}</span>}
                        </div>
                        <div className={styles.itemTags}>
                          {pending.product_category && <span className={styles.itemTag}>{pending.product_category}</span>}
                          {pending.product_brand && <span className={styles.itemTag}>{pending.product_brand}</span>}
                          {pending.product_material && <span className={styles.itemTag}>{pending.product_material}</span>}
                        </div>
                      </div>
                      <div className={styles.itemEditActions}>
                        <button type="button" className={styles.itemSaveBtn} onClick={() => handleSavePendingItem(pending.product_id)} title="Guardar ítem">
                          <Check size={13} />
                        </button>
                        <button type="button" className={styles.removeBtn} onClick={() => handleDiscardPendingItem(pending.product_id)} title="Descartar">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.itemFieldsRow}>
                      <div className={styles.itemField}>
                        <label className={styles.itemFieldLabel}>Cantidad</label>
                        <input
                          type="number"
                          className={`${styles.inputField} ${styles.mono}`}
                          min={1}
                          value={pending.quantity}
                          onChange={e => updatePendingItem(pending.product_id, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className={styles.itemField}>
                        <label className={styles.itemFieldLabel}>Costo unit.</label>
                        <input
                          type="number"
                          className={`${styles.inputField} ${styles.mono}`}
                          min={0}
                          step="0.01"
                          value={pending.unit_cost}
                          onChange={e => updatePendingItem(pending.product_id, 'unit_cost', e.target.value)}
                        />
                      </div>
                      <div className={styles.itemField}>
                        <label className={styles.itemFieldLabel}>SKU prov.</label>
                        <input
                          type="text"
                          className={styles.inputField}
                          placeholder="Opcional"
                          value={pending.supplier_sku}
                          onChange={e => updatePendingItem(pending.product_id, 'supplier_sku', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className={styles.rightColumn}>
            {/* Resumen */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Resumen</h2>
              <dl className={styles.fieldList}>
                <div className={styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Ítems</dt>
                  <dd className={`${styles.fieldValue} ${styles.mono}`}>{orderItems.length}</dd>
                </div>
                <div className={styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Total</dt>
                  <dd className={`${styles.fieldValue} ${styles.mono} ${styles.totalValue}`}>$ {displayTotal.toFixed(2)}</dd>
                </div>
              </dl>
            </section>

            {/* Detalles */}
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Detalles del Pedido</h2>
                <div className={styles.cardActions}>
                  {isEditingDetails ? (
                    <>
                      <button type="button" onClick={handleCancelEditDetails} className={styles.cancelButton}>
                        <X size={15} />
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDetails}
                        disabled={isSaving || !editProviderId}
                        className={styles.saveButton}
                      >
                        {isSaving ? <><Loader size={15} className={styles.spinner} /> Guardando...</> : <><Check size={15} /> Guardar</>}
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={handleStartEditDetails} className={styles.editButton}>
                      <Pencil size={15} />
                      Editar
                    </button>
                  )}
                </div>
              </div>
              <dl className={styles.fieldList}>

                {/* Proveedor */}
                <div className={isEditingDetails ? styles.fieldRowEditing : styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Proveedor</dt>
                  {isEditingDetails ? (
                    <dd className={styles.fieldValueFull}>
                      <div className={styles.selectWithAction}>
                        <div className={styles.selectDropdown} ref={editProviderRef}>
                          <button
                            type="button"
                            className={`${styles.selectTrigger} ${editProviderId ? styles.selectTriggerActive : ''}`}
                            onClick={() => { setEditProviderOpen(o => !o); setEditProviderSearch('') }}
                          >
                            <span>{editProviderOptions.find(p => p.id === editProviderId)?.name ?? 'Seleccionar proveedor'}</span>
                            <ChevronDown size={13} />
                          </button>
                          {editProviderOpen && (
                            <div className={styles.selectContent}>
                              <input type="text" className={styles.selectSearch} placeholder="Buscar proveedor..." value={editProviderSearch} onChange={e => setEditProviderSearch(e.target.value)} autoFocus />
                              <div className={styles.selectOptions}>
                                {editProviderLoading ? (
                                  <div className={styles.selectOption} style={{ justifyContent: 'center' }}><Loader size={13} className={styles.spinner} /></div>
                                ) : editProviderOptions.map(p => (
                                  <div key={p.id} className={`${styles.selectOption} ${editProviderId === p.id ? styles.selectOptionActive : ''}`} onClick={() => { setEditProviderId(p.id); setEditProviderOpen(false) }}>{p.name}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className={styles.addClientBtn}
                          onClick={() => { setEditProviderOpen(false); setShowCreateProvider(true) }}
                          title="Crear nuevo proveedor"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </dd>
                  ) : (
                    <dd className={styles.fieldValue}>{order.provider.name}</dd>
                  )}
                </div>

                {/* Estado */}
                <div className={isEditingDetails ? styles.fieldRowEditing : styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Estado</dt>
                  {isEditingDetails ? (
                    <dd className={styles.fieldValueFull}>
                      <div className={styles.selectDropdown} ref={editStatusRef}>
                        <button
                          type="button"
                          className={`${styles.selectTrigger} ${styles.selectTriggerActive}`}
                          onClick={() => setEditOpenDropdown(editOpenDropdown === 'status' ? null : 'status')}
                        >
                          <span>{statusLabel[editStatus]}</span>
                          <ChevronDown size={13} />
                        </button>
                        {editOpenDropdown === 'status' && (
                          <div className={styles.selectContent}>
                            <div className={styles.selectOptions}>
                              {(['pending', 'sent', 'received', 'cancelled'] as const).map(s => (
                                <div key={s} className={`${styles.selectOption} ${editStatus === s ? styles.selectOptionActive : ''}`} onClick={() => { setEditStatus(s); setEditOpenDropdown(null) }}>
                                  {statusLabel[s]}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </dd>
                  ) : (
                    <dd className={styles.fieldValue}>
                      <span className={`badge ${statusBadge[order.status] ?? 'badge--warning'}`}>
                        {statusLabel[order.status] ?? order.status}
                      </span>
                    </dd>
                  )}
                </div>

                {/* Estado pago */}
                <div className={isEditingDetails ? styles.fieldRowEditing : styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Estado pago</dt>
                  {isEditingDetails ? (
                    <dd className={styles.fieldValueFull}>
                      <div className={styles.selectDropdown} ref={editPaymentStatusRef}>
                        <button
                          type="button"
                          className={`${styles.selectTrigger} ${styles.selectTriggerActive}`}
                          onClick={() => setEditOpenDropdown(editOpenDropdown === 'payment_status' ? null : 'payment_status')}
                        >
                          <span>{paymentStatusLabel[editPaymentStatus]}</span>
                          <ChevronDown size={13} />
                        </button>
                        {editOpenDropdown === 'payment_status' && (
                          <div className={styles.selectContent}>
                            <div className={styles.selectOptions}>
                              {(['pending', 'paid'] as const).map(s => (
                                <div key={s} className={`${styles.selectOption} ${editPaymentStatus === s ? styles.selectOptionActive : ''}`} onClick={() => { setEditPaymentStatus(s); setEditOpenDropdown(null) }}>
                                  {paymentStatusLabel[s]}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </dd>
                  ) : (
                    <dd className={styles.fieldValue}>
                      <span className={`badge ${paymentStatusBadge[order.payment_status] ?? 'badge--warning'}`}>
                        {paymentStatusLabel[order.payment_status] ?? order.payment_status}
                      </span>
                    </dd>
                  )}
                </div>

                <div className={styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Fecha</dt>
                  <dd className={`${styles.fieldValue} ${styles.mono}`}>{formatDate(order.order_date)}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>

        {showDeleteModal && (
          <ConfirmDeleteModal
            productName={`Pedido #${order.id} — ${order.provider.name}`}
            onConfirm={handleDeleteOrder}
            onClose={() => setShowDeleteModal(false)}
          />
        )}
        {showCreateProvider && (
          <CreateFormModal
            title="Agregar Proveedor"
            fields={PROVIDER_FIELDS}
            onSubmit={submitCreateProvider}
            onClose={() => setShowCreateProvider(false)}
            onCreated={handleProviderCreated}
          />
        )}
      </div>
    )
  }

  // ─── Create mode rendering ─────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <button type="button" onClick={() => navigate('/orders')} className={styles.backButton} title="Volver a pedidos">
          <ChevronLeft size={20} />
        </button>
        <PageHeader
          prefix="PED"
          activeLabel="Nuevo Pedido"
          title="Crear Pedido"
        />
        <div className={styles.headerActions}>
          <button type="button" onClick={() => navigate('/orders')} className={styles.cancelButton}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className={styles.saveButton}>
            {isSubmitting ? <><Loader size={15} className={styles.spinner} /> Guardando...</> : 'Guardar Pedido'}
          </button>
        </div>
      </div>

      {apiError && <div className={styles.errorBox}>{apiError}</div>}
      {validationError && <div className={styles.errorBox}>{validationError}</div>}

      <div className={styles.sectionsGrid}>
        {/* Left: Items */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Productos</h2>

          <div className={styles.productSearchWrapper} ref={productSearchRef}>
            <div className={styles.productSearchField}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.productSearchInput}
                placeholder="Buscar producto por nombre o SKU..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                autoComplete="off"
              />
              {productLoading && <Loader size={13} className={styles.searchSpinner} />}
            </div>
            {productSearchOpen && (
              <div className={styles.productResults}>
                {productLoading ? (
                  <div className={styles.productOption} style={{ justifyContent: 'center' }}>
                    <Loader size={14} className={styles.spinner} />
                  </div>
                ) : productResults.length === 0 ? (
                  <div className={`${styles.productOption} ${styles.productOptionEmpty}`}>Sin resultados</div>
                ) : (
                  productResults.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`${styles.productOption} ${items.some(i => i.product_id === p.id) ? styles.productOptionAdded : ''}`}
                      onClick={() => addProduct(p)}
                    >
                      <div className={styles.productOptionInfo}>
                        <span className={styles.productOptionName}>{p.name}</span>
                        {p.size_value && <span className={styles.productOptionSize}>{p.size_value} {p.measurement_unit?.abbreviation}</span>}
                        <div className={styles.productOptionTags}>
                          {p.category?.name && <span className={styles.productOptionTag}>{p.category.name}</span>}
                          {p.brand?.name && <span className={styles.productOptionTag}>{p.brand.name}</span>}
                          {p.material?.name && <span className={styles.productOptionTag}>{p.material.name}</span>}
                        </div>
                      </div>
                      <div className={styles.productOptionMeta}>
                        <span className={styles.productOptionSku}>{p.sku}</span>
                        <span className={styles.productOptionPrice}>$ {(p.cost ?? 0).toFixed(2)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyItems}>
              <Package size={28} className={styles.emptyIcon} />
              <p>Busca y selecciona productos para agregar al pedido</p>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {items.map((item, index) => (
                <div key={item.product_id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <div className={styles.itemIdentity}>
                      <div className={styles.itemNameRow}>
                        <span className={styles.itemName}>{item.product_name}</span>
                        <span className={styles.itemSku}>{item.product_sku}</span>
                      </div>
                      <div className={styles.itemTags}>
                        {item.product_category && <span className={styles.itemTag}>{item.product_category}</span>}
                        {item.product_brand && <span className={styles.itemTag}>{item.product_brand}</span>}
                        {item.product_material && <span className={styles.itemTag}>{item.product_material}</span>}
                      </div>
                    </div>
                    <button type="button" className={styles.removeBtn} onClick={() => removeItem(index)} title="Quitar producto">
                      <X size={14} />
                    </button>
                  </div>
                  <div className={styles.itemFieldsRow}>
                    <div className={styles.itemField}>
                      <label className={styles.itemFieldLabel}>Cantidad</label>
                      <input
                        type="number"
                        className={`${styles.inputField} ${styles.mono}`}
                        min={1}
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className={styles.itemField}>
                      <label className={styles.itemFieldLabel}>Costo unit.</label>
                      <input
                        type="number"
                        className={`${styles.inputField} ${styles.mono}`}
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={item.unit_cost}
                        onChange={e => updateItem(index, 'unit_cost', e.target.value)}
                      />
                    </div>
                    <div className={styles.itemField}>
                      <label className={styles.itemFieldLabel}>SKU prov.</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        placeholder="Opcional"
                        value={item.supplier_sku}
                        onChange={e => updateItem(index, 'supplier_sku', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Resumen + Detalles */}
        <div className={styles.rightColumn}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Resumen</h2>
            <dl className={styles.fieldList}>
              <div className={styles.fieldRow}>
                <dt className={styles.fieldLabel}>Ítems</dt>
                <dd className={`${styles.fieldValue} ${styles.mono}`}>{items.length}</dd>
              </div>
              <div className={styles.fieldRow}>
                <dt className={styles.fieldLabel}>Total estimado</dt>
                <dd className={`${styles.fieldValue} ${styles.mono} ${styles.totalValue}`}>$ {estimatedTotal.toFixed(2)}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Detalles del Pedido</h2>
            <dl className={styles.fieldList}>

              {/* Proveedor */}
              <div className={styles.fieldRowEditing}>
                <dt className={styles.fieldLabel}>Proveedor *</dt>
                <dd className={styles.fieldValueFull}>
                  <div className={styles.selectWithAction}>
                    <div className={styles.selectDropdown} ref={providerRef}>
                      <button
                        type="button"
                        className={`${styles.selectTrigger} ${providerId ? styles.selectTriggerActive : ''}`}
                        onClick={() => { setProviderOpen(o => !o); setProviderSearch('') }}
                      >
                        <span>{selectedProviderName}</span>
                        <ChevronDown size={13} />
                      </button>
                      {providerOpen && (
                        <div className={styles.selectContent}>
                          <input type="text" className={styles.selectSearch} placeholder="Buscar proveedor..." value={providerSearch} onChange={e => setProviderSearch(e.target.value)} autoFocus />
                          <div className={styles.selectOptions}>
                            {providerLoading ? (
                              <div className={styles.selectOption} style={{ justifyContent: 'center' }}><Loader size={13} className={styles.spinner} /></div>
                            ) : providerOptions.map(p => (
                              <div key={p.id} className={`${styles.selectOption} ${providerId === p.id ? styles.selectOptionActive : ''}`} onClick={() => { setProviderId(p.id); setProviderOpen(false) }}>{p.name}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.addClientBtn}
                      onClick={() => { setProviderOpen(false); setShowCreateProvider(true) }}
                      title="Crear nuevo proveedor"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </dd>
              </div>

              {/* Estado */}
              <div className={styles.fieldRowEditing}>
                <dt className={styles.fieldLabel}>Estado</dt>
                <dd className={styles.fieldValueFull}>
                  <div className={styles.selectDropdown} ref={statusRef}>
                    <button
                      type="button"
                      className={`${styles.selectTrigger} ${styles.selectTriggerActive}`}
                      onClick={() => setOpenFormDropdown(openFormDropdown === 'status' ? null : 'status')}
                    >
                      <span>{statusLabel[orderStatus]}</span>
                      <ChevronDown size={13} />
                    </button>
                    {openFormDropdown === 'status' && (
                      <div className={styles.selectContent}>
                        <div className={styles.selectOptions}>
                          {(['pending', 'sent', 'received', 'cancelled'] as const).map(s => (
                            <div key={s} className={`${styles.selectOption} ${orderStatus === s ? styles.selectOptionActive : ''}`} onClick={() => { setOrderStatus(s); setOpenFormDropdown(null) }}>
                              {statusLabel[s]}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </dd>
              </div>

              {/* Estado pago */}
              <div className={styles.fieldRowEditing}>
                <dt className={styles.fieldLabel}>Estado pago</dt>
                <dd className={styles.fieldValueFull}>
                  <div className={styles.selectDropdown} ref={paymentStatusRef}>
                    <button
                      type="button"
                      className={`${styles.selectTrigger} ${styles.selectTriggerActive}`}
                      onClick={() => setOpenFormDropdown(openFormDropdown === 'payment_status' ? null : 'payment_status')}
                    >
                      <span>{paymentStatusLabel[orderPaymentStatus]}</span>
                      <ChevronDown size={13} />
                    </button>
                    {openFormDropdown === 'payment_status' && (
                      <div className={styles.selectContent}>
                        <div className={styles.selectOptions}>
                          {(['pending', 'paid'] as const).map(s => (
                            <div key={s} className={`${styles.selectOption} ${orderPaymentStatus === s ? styles.selectOptionActive : ''}`} onClick={() => { setOrderPaymentStatus(s); setOpenFormDropdown(null) }}>
                              {paymentStatusLabel[s]}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </dd>
              </div>

            </dl>
          </section>
        </div>
      </div>
      {showCreateProvider && (
        <CreateFormModal
          title="Agregar Proveedor"
          fields={PROVIDER_FIELDS}
          onSubmit={submitCreateProvider}
          onClose={() => setShowCreateProvider(false)}
          onCreated={handleProviderCreated}
        />
      )}
    </form>
  )
}
