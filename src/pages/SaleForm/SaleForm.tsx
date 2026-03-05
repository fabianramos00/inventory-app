import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Search, X, Loader, ChevronDown, Package, Plus, Pencil, Check, Trash2 } from 'lucide-react'
import styles from './SaleForm.module.css'
import { salesApi } from '@/lib/api/sales'
import { inventoryApi } from '@/lib/api/inventory'
import { useModalContext } from '@/context/ModalContext'
import CreateClientModal from '@/components/CreateClientModal/CreateClientModal'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal/ConfirmDeleteModal'
import type { Product, Sale, SaleItem, FilterOption, CreateSaleInput, PaymentStatus, PaymentMethod } from '@/types'

interface SaleItemView extends SaleItem {
  product_category: string
  product_brand: string
  product_material: string
}

const paymentStatusLabel: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', partial: 'Parcial',
}
const paymentStatusBadge: Record<string, string> = {
  pending: 'badge--destructive', paid: 'badge--success', partial: 'badge--warning',
}
const deliveryStatusLabel: Record<string, string> = {
  pending: 'Pendiente', partial: 'Parcial', delivered: 'Entregado',
}
const deliveryStatusBadge: Record<string, string> = {
  pending: 'badge--warning', partial: 'badge--warning', delivered: 'badge--success',
}
const paymentMethodLabel: Record<string, string> = {
  cash: 'Efectivo', credit: 'Crédito', debit: 'Débito',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface SaleItemDraft {
  product_id: number
  product_name: string
  product_sku: string
  product_default_price: number
  product_category: string
  product_brand: string
  product_material: string
  quantity: number
  delivered_quantity: number
  unit_price: string
}

export default function SaleForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isCreateMode = !id

  // View mode state
  const [sale, setSale] = useState<Sale | null>(null)
  const [saleItems, setSaleItems] = useState<SaleItemView[]>([])
  const [pageLoading, setPageLoading] = useState(!isCreateMode)

  // View mode edit/delete
  const [isEditingItems, setIsEditingItems] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editingItems, setEditingItems] = useState<{ id: number; quantity: string; delivered_quantity: string; unit_price: string }[]>([])
  const [pendingItems, setPendingItems] = useState<{
    product_id: number; product_name: string; product_sku: string
    product_default_price: number; product_category: string; product_brand: string; product_material: string
    quantity: string; delivered_quantity: string; unit_price: string
  }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [savingItemId, setSavingItemId] = useState<number | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('')
  const [editAmountPaid, setEditAmountPaid] = useState('0')
  const [editClientId, setEditClientId] = useState<number | ''>('')
  const [editClientOptions, setEditClientOptions] = useState<FilterOption[]>([])
  const [editClientSearch, setEditClientSearch] = useState('')
  const [editClientOpen, setEditClientOpen] = useState(false)
  const [editClientLoading, setEditClientLoading] = useState(false)
  const editClientRef = useRef<HTMLDivElement>(null)
  const editClientTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const editPaymentMethodRef = useRef<HTMLDivElement>(null)
  const [editOpenDropdown, setEditOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    if (isCreateMode) return

    const load = async () => {
      try {
        const [saleRes, itemsRes] = await Promise.all([
          salesApi.getSale(Number(id)),
          salesApi.getSaleItems(Number(id), { skip: 0, limit: 100 }),
        ])
        setSale(saleRes.data)
        setSaleItems(itemsRes.data.items.map(item => ({
          ...item,
          product_category: item.category_name ?? '',
          product_brand: item.brand_name ?? '',
          product_material: item.material_name ?? '',
        })))
      } catch {
        navigate('/sales')
      } finally {
        setPageLoading(false)
      }
    }
    load()
  }, [id, isCreateMode, navigate])

  useEffect(() => {
    if (editClientTimeout.current) clearTimeout(editClientTimeout.current)
    if (!editClientOpen) return
    editClientTimeout.current = setTimeout(async () => {
      setEditClientLoading(true)
      try {
        const res = await salesApi.getClients({ search: editClientSearch || undefined, skip: 0, limit: 10 })
        setEditClientOptions(res.data.items || [])
      } catch {
        setEditClientOptions([])
      } finally {
        setEditClientLoading(false)
      }
    }, 300)
    return () => { if (editClientTimeout.current) clearTimeout(editClientTimeout.current) }
  }, [editClientSearch, editClientOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (!editClientRef.current?.contains(target)) setEditClientOpen(false)
      if (!editPaymentMethodRef.current?.contains(target)) setEditOpenDropdown(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleStartEditItems() {
    if (!sale) return
    setEditingItems(saleItems.map(item => ({
      id: item.id,
      quantity: String(item.quantity),
      delivered_quantity: String(item.delivered_quantity),
      unit_price: String(item.unit_price),
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
    if (!sale) return
    setEditPaymentMethod(sale.payment_method ?? '')
    setEditAmountPaid(String(sale.amount_paid))
    setEditClientId(sale.client?.id ?? '')
    if (sale.client) setEditClientOptions([sale.client])
    setIsEditingDetails(true)
  }

  function handleCancelEditDetails() {
    setIsEditingDetails(false)
    setEditOpenDropdown(null)
    setEditClientOpen(false)
  }

  async function handleSaveDetails() {
    if (!sale) return
    setIsSaving(true)
    try {
      const res = await salesApi.updateSale(sale.id, {
        payment_method: (editPaymentMethod as PaymentMethod) || null,
        amount_paid: parseFloat(editAmountPaid) || 0,
        client_id: editClientId || null,
      })
      setSale(res.data)
      setIsEditingDetails(false)
    } catch {
      // keep editing so user can retry
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteSale() {
    if (!sale) return
    await salesApi.deleteSale(sale.id)
    navigate('/sales')
  }

  function updateEditingItem(itemId: number, field: 'quantity' | 'delivered_quantity' | 'unit_price', value: string) {
    setEditingItems(prev => prev.map(e => e.id === itemId ? { ...e, [field]: value } : e))
  }

  async function handleSaveItemField(itemId: number) {
    if (!sale) return
    const editItem = editingItems.find(e => e.id === itemId)
    if (!editItem) return
    setSavingItemId(itemId)
    try {
      const res = await salesApi.updateSaleItem(sale.id, itemId, {
        quantity: parseFloat(editItem.quantity) || 1,
        delivered_quantity: parseFloat(editItem.delivered_quantity) || 0,
        unit_price: editItem.unit_price !== '' ? parseFloat(editItem.unit_price) || null : null,
      })
      setSale(res.data)
      const qty = parseFloat(editItem.quantity) || 1
      const price = editItem.unit_price !== '' ? parseFloat(editItem.unit_price) || 0 : 0
      setSaleItems(prev => prev.map(item => item.id === itemId ? {
        ...item,
        quantity: qty,
        delivered_quantity: parseFloat(editItem.delivered_quantity) || 0,
        unit_price: price,
        subtotal: qty * price,
      } : item))
    } catch {
      // keep editing
    } finally {
      setSavingItemId(null)
    }
  }

  async function handleDeleteItem(itemId: number) {
    if (!sale) return
    setDeletingItemId(itemId)
    try {
      const res = await salesApi.deleteSaleItem(sale.id, itemId)
      setSale(res.data)
      setSaleItems(prev => prev.filter(item => item.id !== itemId))
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
    if (saleItems.some(i => i.product_id === product.id) || pendingItems.some(p => p.product_id === product.id)) return
    const defaultPrice = product.sale_price ?? product.price ?? 0
    setPendingItems(prev => [...prev, {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      product_default_price: defaultPrice,
      product_category: product.category?.name ?? '',
      product_brand: product.brand?.name ?? '',
      product_material: product.material?.name ?? '',
      quantity: '1',
      delivered_quantity: '1',
      unit_price: defaultPrice > 0 ? String(defaultPrice) : '',
    }])
  }

  function updatePendingItem(productId: number, field: 'quantity' | 'delivered_quantity' | 'unit_price', value: string) {
    setPendingItems(prev => prev.map(p => p.product_id === productId ? { ...p, [field]: value } : p))
  }

  function handleDiscardPendingItem(productId: number) {
    setPendingItems(prev => prev.filter(p => p.product_id !== productId))
  }

  async function handleSavePendingItem(productId: number) {
    if (!sale) return
    const pending = pendingItems.find(p => p.product_id === productId)
    if (!pending) return
    try {
      const res = await salesApi.addSaleItem(sale.id, {
        product_id: pending.product_id,
        quantity: parseFloat(pending.quantity) || 1,
        delivered_quantity: parseFloat(pending.delivered_quantity) || 0,
        unit_price: pending.unit_price !== '' ? parseFloat(pending.unit_price) || null : null,
      })
      setSale(res.data)
      const itemsRes = await salesApi.getSaleItems(sale.id, { skip: 0, limit: 100 })
      const freshItems = itemsRes.data.items.map(item => ({
        ...item,
        product_category: item.category_name ?? '',
        product_brand: item.brand_name ?? '',
        product_material: item.material_name ?? '',
      }))
      setSaleItems(freshItems)
      const newItem = freshItems.find(i => i.product_id === productId)
      if (newItem) {
        setEditingItems(prev => [...prev, {
          id: newItem.id,
          quantity: pending.quantity,
          delivered_quantity: pending.delivered_quantity,
          unit_price: pending.unit_price,
        }])
      }
      setPendingItems(prev => prev.filter(p => p.product_id !== productId))
    } catch {
      // keep pending so user can retry
    }
  }

  // Items
  const [items, setItems] = useState<SaleItemDraft[]>([])

  // Product search
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [productLoading, setProductLoading] = useState(false)
  const productSearchRef = useRef<HTMLDivElement>(null)
  const productSearchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Sale details
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [amountPaid, setAmountPaid] = useState('0')

  // Client dropdown
  const [clientId, setClientId] = useState<number | ''>('')
  const [clientOptions, setClientOptions] = useState<FilterOption[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [clientOpen, setClientOpen] = useState(false)
  const [clientLoading, setClientLoading] = useState(false)
  const clientRef = useRef<HTMLDivElement>(null)
  const clientTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Static form dropdowns
  const [openFormDropdown, setOpenFormDropdown] = useState<string | null>(null)
  const paymentStatusRef = useRef<HTMLDivElement>(null)
  const paymentMethodRef = useRef<HTMLDivElement>(null)

  // Create client modal
  const [showCreateClient, setShowCreateClient] = useState(false)
  const { openModal: contextOpenModal, closeModal: contextCloseModal } = useModalContext()

  useEffect(() => {
    if (showCreateClient || showDeleteModal) contextOpenModal()
    else contextCloseModal()
  }, [showCreateClient, showDeleteModal, contextOpenModal, contextCloseModal])

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Product search debounce + API
  useEffect(() => {
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
        const response = await inventoryApi.getProducts({ search: productSearch, skip: 0, limit: 8 })
        setProductResults(response.data.items || [])
      } catch {
        setProductResults([])
      } finally {
        setProductLoading(false)
      }
    }, 300)
    return () => { if (productSearchTimeout.current) clearTimeout(productSearchTimeout.current) }
  }, [productSearch])

  // Client search debounce + API
  useEffect(() => {
    if (clientTimeout.current) clearTimeout(clientTimeout.current)
    if (!clientOpen) return
    clientTimeout.current = setTimeout(async () => {
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
    return () => { if (clientTimeout.current) clearTimeout(clientTimeout.current) }
  }, [clientSearch, clientOpen])

  // Click outside to close dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (!productSearchRef.current?.contains(target)) setProductSearchOpen(false)
      if (!clientRef.current?.contains(target)) setClientOpen(false)
      if (!paymentStatusRef.current?.contains(target) && !paymentMethodRef.current?.contains(target)) {
        setOpenFormDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
      product_default_price: product.sale_price ?? product.price ?? 0,
      product_category: product.category?.name ?? '',
      product_brand: product.brand?.name ?? '',
      product_material: product.material?.name ?? '',
      quantity: 1,
      delivered_quantity: 1,
      unit_price: '',
    }])
    setProductSearch('')
    setProductSearchOpen(false)
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof Pick<SaleItemDraft, 'quantity' | 'delivered_quantity' | 'unit_price'>, value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const estimatedTotal = items.reduce((acc, item) => {
    const price = item.unit_price !== '' ? parseFloat(item.unit_price) || 0 : item.product_default_price
    return acc + price * Number(item.quantity)
  }, 0)

  const amountPaidError = (() => {
    const paid = parseFloat(amountPaid)
    if (!isNaN(paid) && estimatedTotal > 0 && paid > estimatedTotal)
      return `máx. $ ${estimatedTotal.toFixed(2)}`
    return null
  })()

  const hasLiveErrors = !!amountPaidError || items.some(item => Number(item.delivered_quantity) > Number(item.quantity))

  const selectedClientName = clientOptions.find(c => c.id === clientId)?.name || 'Sin cliente'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)
    setApiError(null)

    if (items.length === 0) {
      setValidationError('Agrega al menos un producto a la venta.')
      return
    }
    for (const item of items) {
      if (!item.quantity || item.quantity < 1) {
        setValidationError('Todos los ítems deben tener una cantidad mayor a 0.')
        return
      }
      if (item.delivered_quantity > item.quantity) {
        setValidationError(`La cantidad entregada de "${item.product_name}" no puede superar la cantidad (${item.quantity}).`)
        return
      }
    }
    const paid = parseFloat(amountPaid) || 0
    if (paid > estimatedTotal) {
      setValidationError(`El monto pagado ($${paid.toFixed(2)}) no puede superar el total estimado ($${estimatedTotal.toFixed(2)}).`)
      return
    }

    setIsSubmitting(true)
    try {
      const payload: CreateSaleInput = {
        payment_status: paymentStatus,
        payment_method: (paymentMethod as PaymentMethod) || null,
        amount_paid: paid,
        client_id: clientId || null,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          delivered_quantity: item.delivered_quantity,
          unit_price: item.unit_price !== '' ? parseFloat(item.unit_price) || null : null,
        })),
      }
      await salesApi.createSale(payload)
      navigate('/sales')
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Error al crear la venta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const parseNum = (str: string, fallback: number) => {
    const n = parseFloat(str)
    return Number.isFinite(n) ? n : fallback
  }

  const displayTotal = isEditingItems
    ? saleItems.reduce((sum, item) => {
        const ei = editingItems.find(e => e.id === item.id)
        const price = ei ? parseNum(ei.unit_price, item.unit_price) : item.unit_price
        const qty = ei ? parseNum(ei.quantity, item.quantity) : item.quantity
        return sum + price * qty
      }, 0) + pendingItems.reduce((sum, p) => {
        const price = p.unit_price !== '' ? parseNum(p.unit_price, p.product_default_price) : p.product_default_price
        return sum + price * parseNum(p.quantity, 0)
      }, 0)
    : sale?.total_amount ?? 0

  const displayDebt = displayTotal - (isEditingDetails ? parseNum(editAmountPaid, 0) : sale?.amount_paid ?? 0)

  if (!isCreateMode) {
    if (pageLoading || !sale) {
      return (
        <div className={styles.pageContainer}>
          <div className={styles.loadingState}>
            <Loader size={24} className={styles.spinner} />
            <p>Cargando venta...</p>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <button type="button" onClick={() => navigate('/sales')} className={styles.backButton} title="Volver a ventas">
            <ChevronLeft size={20} />
          </button>
          <div className={styles.headerContent}>
            <div className={styles.breadcrumb}>
              <span>VNT</span>
              <span className={styles.breadcrumbDivider}>/</span>
              <span className={styles.breadcrumbActive}>Venta #{sale.id}</span>
            </div>
            <h1 className={styles.pageTitle}>
              {sale.client?.name ?? 'Sin cliente'}
            </h1>
          </div>
          <div className={styles.headerActions}>
            <button type="button" onClick={() => setShowDeleteModal(true)} className={styles.deleteButton}>
              <Trash2 size={15} />
              Eliminar
            </button>
          </div>
        </div>

        <div className={styles.sectionsGrid}>
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
                          className={`${styles.productOption} ${saleItems.some(i => i.product_id === p.id) || pendingItems.some(pi => pi.product_id === p.id) ? styles.productOptionAdded : ''}`}
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
                            <span className={styles.productOptionPrice}>$ {(p.sale_price ?? p.price ?? 0).toFixed(2)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {saleItems.length === 0 && pendingItems.length === 0 ? (
              <div className={styles.emptyItems}>
                <Package size={28} className={styles.emptyIcon} />
                <p>Sin productos registrados</p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {saleItems.map(item => {
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
                            <div className={styles.itemTags}>
                              {item.product_category && <span className={styles.itemTag}>{item.product_category}</span>}
                              {item.product_brand && <span className={styles.itemTag}>{item.product_brand}</span>}
                              {item.product_material && <span className={styles.itemTag}>{item.product_material}</span>}
                            </div>
                          </div>
                          <div className={styles.itemEditActions}>
                            <button
                              type="button"
                              className={styles.itemSaveBtn}
                              onClick={() => handleSaveItemField(item.id)}
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
                            <label className={styles.itemFieldLabel}>Cant. entregada</label>
                            <input
                              type="number"
                              className={`${styles.inputField} ${styles.mono} ${parseNum(editItem.delivered_quantity, 0) > parseNum(editItem.quantity, Infinity) ? styles.inputFieldError : ''}`}
                              min={0}
                              value={editItem.delivered_quantity}
                              onChange={e => updateEditingItem(item.id, 'delivered_quantity', e.target.value)}
                            />
                            {parseNum(editItem.delivered_quantity, 0) > parseNum(editItem.quantity, Infinity) && (
                              <span className={styles.fieldError}>máx. {editItem.quantity}</span>
                            )}
                          </div>
                          <div className={styles.itemField}>
                            <label className={styles.itemFieldLabel}>Precio unit.</label>
                            <input
                              type="number"
                              className={`${styles.inputField} ${styles.mono}`}
                              min={0}
                              step="0.01"
                              value={editItem.unit_price}
                              onChange={e => updateEditingItem(item.id, 'unit_price', e.target.value)}
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
                          <div className={styles.itemTags}>
                            {item.product_category && <span className={styles.itemTag}>{item.product_category}</span>}
                            {item.product_brand && <span className={styles.itemTag}>{item.product_brand}</span>}
                            {item.product_material && <span className={styles.itemTag}>{item.product_material}</span>}
                          </div>
                        </div>
                      </div>
                      <div className={styles.itemFieldsRowFour}>
                        <div className={styles.itemField}>
                          <span className={styles.itemFieldLabel}>Cantidad</span>
                          <span className={styles.mono}>{item.quantity}</span>
                        </div>
                        <div className={styles.itemField}>
                          <span className={styles.itemFieldLabel}>Entregado</span>
                          <span className={styles.mono}>{item.delivered_quantity}</span>
                        </div>
                        <div className={styles.itemField}>
                          <span className={styles.itemFieldLabel}>P. unit.</span>
                          <span className={styles.mono}>$ {item.unit_price.toFixed(2)}</span>
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
                        <label className={styles.itemFieldLabel}>Cant. entregada</label>
                        <input
                          type="number"
                          className={`${styles.inputField} ${styles.mono}`}
                          min={0}
                          value={pending.delivered_quantity}
                          onChange={e => updatePendingItem(pending.product_id, 'delivered_quantity', e.target.value)}
                        />
                      </div>
                      <div className={styles.itemField}>
                        <label className={styles.itemFieldLabel}>Precio unit.</label>
                        <input
                          type="number"
                          className={`${styles.inputField} ${styles.mono}`}
                          min={0}
                          step="0.01"
                          placeholder={pending.product_default_price > 0 ? String(pending.product_default_price) : '0.00'}
                          value={pending.unit_price}
                          onChange={e => updatePendingItem(pending.product_id, 'unit_price', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className={styles.rightColumn}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Resumen</h2>
              <dl className={styles.fieldList}>
                <div className={styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Ítems</dt>
                  <dd className={`${styles.fieldValue} ${styles.mono}`}>{saleItems.length}</dd>
                </div>
                <div className={styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Total</dt>
                  <dd className={`${styles.fieldValue} ${styles.mono} ${styles.totalValue}`}>$ {displayTotal.toFixed(2)}</dd>
                </div>
                <div className={styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Deuda</dt>
                  <dd className={`${styles.fieldValue} ${styles.mono}`} style={{ color: displayDebt > 0 ? 'var(--destructive)' : 'var(--success)' }}>
                    $ {displayDebt.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Detalles de Venta</h2>
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
                        disabled={isSaving || parseNum(editAmountPaid, 0) > displayTotal}
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

                {/* Cliente */}
                <div className={isEditingDetails ? styles.fieldRowEditing : styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Cliente</dt>
                  {isEditingDetails ? (
                    <dd className={styles.fieldValueFull}>
                      <div className={styles.selectDropdown} ref={editClientRef}>
                        <button
                          type="button"
                          className={`${styles.selectTrigger} ${editClientId ? styles.selectTriggerActive : ''}`}
                          onClick={() => { setEditClientOpen(o => !o); setEditClientSearch('') }}
                        >
                          <span>{editClientOptions.find(c => c.id === editClientId)?.name ?? 'Sin cliente'}</span>
                          <ChevronDown size={13} />
                        </button>
                        {editClientOpen && (
                          <div className={styles.selectContent}>
                            <input type="text" className={styles.selectSearch} placeholder="Buscar cliente..." value={editClientSearch} onChange={e => setEditClientSearch(e.target.value)} autoFocus />
                            <div className={styles.selectOptions}>
                              <div className={styles.selectOption} onClick={() => { setEditClientId(''); setEditClientOpen(false) }}>Sin cliente</div>
                              {editClientLoading ? (
                                <div className={styles.selectOption} style={{ justifyContent: 'center' }}><Loader size={13} className={styles.spinner} /></div>
                              ) : editClientOptions.map(c => (
                                <div key={c.id} className={`${styles.selectOption} ${editClientId === c.id ? styles.selectOptionActive : ''}`} onClick={() => { setEditClientId(c.id); setEditClientOpen(false) }}>{c.name}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </dd>
                  ) : (
                    <dd className={styles.fieldValue}>{sale.client?.name ?? <span style={{ color: 'var(--ink-3)' }}>Sin cliente</span>}</dd>
                  )}
                </div>

                {/* Estado pago (read-only) */}
                <div className={styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Estado pago</dt>
                  <dd className={styles.fieldValue}>
                    <span className={`badge ${paymentStatusBadge[sale.payment_status] ?? 'badge--warning'}`}>
                      {paymentStatusLabel[sale.payment_status] ?? sale.payment_status}
                    </span>
                  </dd>
                </div>

                {/* Estado entrega (read-only) */}
                <div className={styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Estado entrega</dt>
                  <dd className={styles.fieldValue}>
                    <span className={`badge ${deliveryStatusBadge[sale.delivery_status] ?? 'badge--warning'}`}>
                      {deliveryStatusLabel[sale.delivery_status] ?? sale.delivery_status}
                    </span>
                  </dd>
                </div>

                {/* Método pago */}
                <div className={isEditingDetails ? styles.fieldRowEditing : styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Método pago</dt>
                  {isEditingDetails ? (
                    <dd className={styles.fieldValueFull}>
                      <div className={styles.selectDropdown} ref={editPaymentMethodRef}>
                        <button
                          type="button"
                          className={`${styles.selectTrigger} ${editPaymentMethod ? styles.selectTriggerActive : ''}`}
                          onClick={() => setEditOpenDropdown(editOpenDropdown === 'payment_method' ? null : 'payment_method')}
                        >
                          <span>{{ '': 'Sin especificar', cash: 'Efectivo', debit: 'Débito', credit: 'Crédito' }[editPaymentMethod] ?? 'Sin especificar'}</span>
                          <ChevronDown size={13} />
                        </button>
                        {editOpenDropdown === 'payment_method' && (
                          <div className={styles.selectContent}>
                            <div className={styles.selectOptions}>
                              {([['', 'Sin especificar'], ['cash', 'Efectivo'], ['debit', 'Débito'], ['credit', 'Crédito']] as const).map(([val, label]) => (
                                <div key={val} className={`${styles.selectOption} ${editPaymentMethod === val ? styles.selectOptionActive : ''}`} onClick={() => { setEditPaymentMethod(val); setEditOpenDropdown(null) }}>{label}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </dd>
                  ) : (
                    <dd className={styles.fieldValue}>
                      {sale.payment_method ? paymentMethodLabel[sale.payment_method] : <span style={{ color: 'var(--ink-3)' }}>Sin especificar</span>}
                    </dd>
                  )}
                </div>

                {/* Monto pagado */}
                <div className={isEditingDetails ? styles.fieldRowEditing : styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Monto pagado</dt>
                  {isEditingDetails ? (
                    <dd className={styles.fieldValueFull}>
                      <input
                        type="number"
                        className={`${styles.inputField} ${styles.mono} ${parseNum(editAmountPaid, 0) > displayTotal ? styles.inputFieldError : ''}`}
                        min={0}
                        step="0.01"
                        value={editAmountPaid}
                        onChange={e => setEditAmountPaid(e.target.value)}
                      />
                      {parseNum(editAmountPaid, 0) > displayTotal && (
                        <span className={styles.fieldError}>máx. $ {displayTotal.toFixed(2)}</span>
                      )}
                    </dd>
                  ) : (
                    <dd className={`${styles.fieldValue} ${styles.mono}`}>$ {sale.amount_paid.toFixed(2)}</dd>
                  )}
                </div>

                <div className={styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Registrado por</dt>
                  <dd className={styles.fieldValue}>{sale.created_by.full_name}</dd>
                </div>
                <div className={styles.fieldRow}>
                  <dt className={styles.fieldLabel}>Fecha</dt>
                  <dd className={`${styles.fieldValue} ${styles.mono}`}>{formatDate(sale.created_at)}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      {showDeleteModal && (
        <ConfirmDeleteModal
          productName={`Venta #${sale.id}`}
          onConfirm={handleDeleteSale}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <button type="button" onClick={() => navigate('/sales')} className={styles.backButton} title="Volver a ventas">
          <ChevronLeft size={20} />
        </button>
        <div className={styles.headerContent}>
          <div className={styles.breadcrumb}>
            <span>VNT</span>
            <span className={styles.breadcrumbDivider}>/</span>
            <span className={styles.breadcrumbActive}>Nueva Venta</span>
          </div>
          <h1 className={styles.pageTitle}>Crear Venta</h1>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={() => navigate('/sales')} className={styles.cancelButton}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting || hasLiveErrors} className={styles.saveButton}>
            {isSubmitting ? <><Loader size={15} className={styles.spinner} /> Guardando...</> : 'Guardar Venta'}
          </button>
        </div>
      </div>

      {apiError && <div className={styles.errorBox}>{apiError}</div>}
      {validationError && <div className={styles.errorBox}>{validationError}</div>}

      <div className={styles.sectionsGrid}>

        {/* Left: Items */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Productos</h2>

          {/* Product search */}
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
                  <div className={`${styles.productOption} ${styles.productOptionEmpty}`}>
                    Sin resultados
                  </div>
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
                        <span className={styles.productOptionPrice}>$ {(p.sale_price ?? p.price ?? 0).toFixed(2)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Items list */}
          {items.length === 0 ? (
            <div className={styles.emptyItems}>
              <Package size={28} className={styles.emptyIcon} />
              <p>Busca y selecciona productos para agregar a la venta</p>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {items.map((item, index) => {
                const deliveredError = Number(item.delivered_quantity) > Number(item.quantity)
                  ? `máx. ${item.quantity}`
                  : null
                return (
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
                          onChange={e => {
                            updateItem(index, 'quantity', e.target.value);
                            updateItem(index, 'delivered_quantity', e.target.value);
                          }}
                        />
                      </div>
                      <div className={styles.itemField}>
                        <label className={styles.itemFieldLabel}>Cant. entregada</label>
                        <input
                          type="number"
                          className={`${styles.inputField} ${styles.mono} ${deliveredError ? styles.inputFieldError : ''}`}
                          min={0}
                          value={item.delivered_quantity}
                          onChange={e => updateItem(index, 'delivered_quantity', e.target.value)}
                        />
                        {deliveredError && <span className={styles.fieldError}>{deliveredError}</span>}
                      </div>
                      <div className={styles.itemField}>
                        <label className={styles.itemFieldLabel}>Precio unit.</label>
                        <input
                          type="number"
                          className={`${styles.inputField} ${styles.mono}`}
                          min={0}
                          step="0.01"
                          placeholder={item.product_default_price.toFixed(2)}
                          value={item.unit_price}
                          onChange={e => updateItem(index, 'unit_price', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Right: Summary + Details */}
        <div className={styles.rightColumn}>

          {/* Summary */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Resumen</h2>
            <dl className={styles.fieldList}>
              <div className={styles.fieldRow}>
                <dt className={styles.fieldLabel}>Ítems</dt>
                <dd className={`${styles.fieldValue} ${styles.mono}`}>{items.length}</dd>
              </div>
              <div className={styles.fieldRow}>
                <dt className={styles.fieldLabel}>Total estimado</dt>
                <dd className={`${styles.fieldValue} ${styles.mono} ${styles.totalValue}`}>
                  $ {estimatedTotal.toFixed(2)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Sale details */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Detalles de Venta</h2>
            <dl className={styles.fieldList}>

              {/* Cliente */}
              <div className={styles.fieldRowEditing}>
                <dt className={styles.fieldLabel}>Cliente</dt>
                <dd className={styles.fieldValueFull}>
                  <div className={styles.selectWithAction}>
                    <div className={styles.selectDropdown} ref={clientRef}>
                      <button
                        type="button"
                        className={`${styles.selectTrigger} ${clientId ? styles.selectTriggerActive : ''}`}
                        onClick={() => { setClientOpen(o => !o); setClientSearch('') }}
                      >
                        <span>{selectedClientName}</span>
                        <ChevronDown size={13} />
                      </button>
                      {clientOpen && (
                        <div className={styles.selectContent}>
                          <input
                            type="text"
                            className={styles.selectSearch}
                            placeholder="Buscar cliente..."
                            value={clientSearch}
                            onChange={e => setClientSearch(e.target.value)}
                            autoFocus
                          />
                          <div className={styles.selectOptions}>
                            <div className={styles.selectOption} onClick={() => { setClientId(''); setClientOpen(false) }}>
                              Sin cliente
                            </div>
                            {clientLoading ? (
                              <div className={`${styles.selectOption}`} style={{ justifyContent: 'center' }}>
                                <Loader size={13} className={styles.spinner} />
                              </div>
                            ) : (
                              clientOptions.map(c => (
                                <div
                                  key={c.id}
                                  className={`${styles.selectOption} ${clientId === c.id ? styles.selectOptionActive : ''}`}
                                  onClick={() => { setClientId(c.id); setClientOpen(false) }}
                                >
                                  {c.name}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.addClientBtn}
                      onClick={() => { setClientOpen(false); setShowCreateClient(true) }}
                      title="Crear nuevo cliente"
                    >
                      <Plus size={14} />
                    </button>
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
                      className={`${styles.selectTrigger} ${paymentStatus !== 'pending' ? styles.selectTriggerActive : ''}`}
                      onClick={() => setOpenFormDropdown(openFormDropdown === 'payment_status' ? null : 'payment_status')}
                    >
                      <span>{{ pending: 'Pendiente', paid: 'Pagado', partial: 'Parcial' }[paymentStatus]}</span>
                      <ChevronDown size={13} />
                    </button>
                    {openFormDropdown === 'payment_status' && (
                      <div className={styles.selectContent}>
                        <div className={styles.selectOptions}>
                          {(['pending', 'paid', 'partial'] as const).map(s => (
                            <div
                              key={s}
                              className={`${styles.selectOption} ${paymentStatus === s ? styles.selectOptionActive : ''}`}
                              onClick={() => { setPaymentStatus(s); setOpenFormDropdown(null) }}
                            >
                              {{ pending: 'Pendiente', paid: 'Pagado', partial: 'Parcial' }[s]}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </dd>
              </div>

              {/* Método pago */}
              <div className={styles.fieldRowEditing}>
                <dt className={styles.fieldLabel}>Método pago</dt>
                <dd className={styles.fieldValueFull}>
                  <div className={styles.selectDropdown} ref={paymentMethodRef}>
                    <button
                      type="button"
                      className={`${styles.selectTrigger} ${paymentMethod ? styles.selectTriggerActive : ''}`}
                      onClick={() => setOpenFormDropdown(openFormDropdown === 'payment_method' ? null : 'payment_method')}
                    >
                      <span>{{ '': 'Sin especificar', cash: 'Efectivo', debit: 'Débito', credit: 'Crédito' }[paymentMethod] ?? 'Sin especificar'}</span>
                      <ChevronDown size={13} />
                    </button>
                    {openFormDropdown === 'payment_method' && (
                      <div className={styles.selectContent}>
                        <div className={styles.selectOptions}>
                          {([['', 'Sin especificar'], ['cash', 'Efectivo'], ['debit', 'Débito'], ['credit', 'Crédito']] as const).map(([val, label]) => (
                            <div
                              key={val}
                              className={`${styles.selectOption} ${paymentMethod === val ? styles.selectOptionActive : ''}`}
                              onClick={() => { setPaymentMethod(val); setOpenFormDropdown(null) }}
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </dd>
              </div>

              {/* Monto pagado */}
              <div className={styles.fieldRowEditing}>
                <dt className={styles.fieldLabel}>Monto pagado</dt>
                <dd className={styles.fieldValueFull}>
                  <input
                    type="number"
                    className={`${styles.inputField} ${styles.mono} ${amountPaidError ? styles.inputFieldError : ''}`}
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                  />
                  {amountPaidError && <span className={styles.fieldError}>{amountPaidError}</span>}
                </dd>
              </div>

            </dl>
          </section>
        </div>
      </div>
      {showCreateClient && (
        <CreateClientModal
          onClose={() => setShowCreateClient(false)}
          onCreated={client => {
            setClientOptions(prev => [client, ...prev.filter(c => c.id !== client.id)])
            setClientId(client.id)
            setShowCreateClient(false)
          }}
        />
      )}
    </form>
  )
}
