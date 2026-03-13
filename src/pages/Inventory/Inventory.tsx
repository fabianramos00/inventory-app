import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, AlertCircle, DollarSign, Package, Grid, ChevronDown, Loader, Eye, Trash2 } from 'lucide-react'
import styles from './Inventory.module.css'
import PageHeader from '@/components/PageHeader/PageHeader'
import CommandBar from '@/components/CommandBar/CommandBar'
import DataCard from '@/components/DataCard/DataCard'
import { inventoryApi } from '@/lib/api/inventory'
import { useModalContext } from '@/context/ModalContext'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal/ConfirmDeleteModal'
import AttributeTab from '@/components/AttributeTab/AttributeTab'
import DataTable from '@/components/DataTable/DataTable'
import type { Product } from '@/types'
import type { FieldConfig } from '@/components/CreateFormModal/CreateFormModal'

interface AttributeTabConfig {
  key: string
  label: string
  columns: Array<{ key: string; label: string }>
  fields: FieldConfig[]
  createTitle: string
  editTitle: string
  fetchFn: (params: { search?: string; skip?: number; limit?: number }) => Promise<{ data: { items: { id: number; name: string }[] } }>
  createFn: (data: unknown) => Promise<unknown>
  updateFn: (id: number, data: unknown) => Promise<unknown>
  deleteFn: (id: number) => Promise<unknown>
}

const ATTRIBUTE_TABS: AttributeTabConfig[] = [
  {
    key: 'categorias',
    label: 'Categorías',
    columns: [{ key: 'name', label: 'Nombre' }, { key: 'description', label: 'Descripción' }],
    fields: [
      { key: 'name', label: 'Nombre', placeholder: 'Nombre de la categoría', required: true },
      { key: 'description', label: 'Descripción (opcional)', type: 'textarea', placeholder: 'Descripción de la categoría' },
    ],
    createTitle: 'Nueva Categoría',
    editTitle: 'Editar Categoría',
    fetchFn: inventoryApi.getCategories,
    createFn: (data) => inventoryApi.createCategory(data as { name: string; description?: string }),
    updateFn: (id, data) => inventoryApi.updateCategory(id, data as { name: string; description?: string }),
    deleteFn: inventoryApi.deleteCategory,
  },
  {
    key: 'marcas',
    label: 'Marcas',
    columns: [{ key: 'name', label: 'Nombre' }, { key: 'logo_url', label: 'Logo URL' }],
    fields: [
      { key: 'name', label: 'Nombre', placeholder: 'Nombre de la marca', required: true },
      { key: 'logo_url', label: 'Logo URL (opcional)', type: 'url', placeholder: 'https://ejemplo.com/logo.png' },
    ],
    createTitle: 'Nueva Marca',
    editTitle: 'Editar Marca',
    fetchFn: inventoryApi.getBrands,
    createFn: (data) => inventoryApi.createBrand(data as { name: string; logo_url?: string }),
    updateFn: (id, data) => inventoryApi.updateBrand(id, data as { name: string; logo_url?: string }),
    deleteFn: inventoryApi.deleteBrand,
  },
  {
    key: 'materiales',
    label: 'Materiales',
    columns: [{ key: 'name', label: 'Nombre' }],
    fields: [
      { key: 'name', label: 'Nombre', placeholder: 'Nombre del material', required: true },
    ],
    createTitle: 'Nuevo Material',
    editTitle: 'Editar Material',
    fetchFn: inventoryApi.getMaterials,
    createFn: (data) => inventoryApi.createMaterial(data as { name: string }),
    updateFn: (id, data) => inventoryApi.updateMaterial(id, data as { name: string }),
    deleteFn: inventoryApi.deleteMaterial,
  },
  {
    key: 'unidades',
    label: 'Unidades de Medida',
    columns: [{ key: 'name', label: 'Nombre' }, { key: 'abbreviation', label: 'Abreviatura' }],
    fields: [
      { key: 'name', label: 'Nombre', placeholder: 'Centímetros', required: true },
      { key: 'abbreviation', label: 'Abreviatura', placeholder: 'cm', required: true },
    ],
    createTitle: 'Nueva Unidad',
    editTitle: 'Editar Unidad',
    fetchFn: inventoryApi.getMeasurementUnits,
    createFn: (data) => inventoryApi.createMeasurementUnit(data as { name: string; abbreviation: string }),
    updateFn: (id, data) => inventoryApi.updateMeasurementUnit(id, data as { name: string; abbreviation: string }),
    deleteFn: inventoryApi.deleteMeasurementUnit,
  },
]

interface FilterOption {
  id: number
  name: string
}

const statusMap: Record<string, string> = {
  low_stock: 'badge--destructive',
  in_stock: 'badge--success',
  out_of_stock: 'badge--danger',
}

const statusLabel: Record<string, string> = {
  low_stock: 'Stock Bajo',
  in_stock: 'En Stock',
  out_of_stock: 'Sin Stock',
}

export default function Inventory() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'productos'
  const { openModal: contextOpenModal, closeModal: contextCloseModal } = useModalContext()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('')
  const [selectedMaterial, setSelectedMaterial] = useState<number | ''>()
  const [selectedBrand, setSelectedBrand] = useState<number | ''>()
  const [selectedAvailability, setSelectedAvailability] = useState('all')

  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    totalValue: 0,
  })

  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([])
  const [materialOptions, setMaterialOptions] = useState<FilterOption[]>([])
  const [brandOptions, setBrandOptions] = useState<FilterOption[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  const [materialSearch, setMaterialSearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [materialLoading, setMaterialLoading] = useState(false)
  const [brandLoading, setBrandLoading] = useState(false)

  const categoryRef = useRef<HTMLDivElement>(null)
  const materialRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const estadoRef = useRef<HTMLDivElement>(null)
  const categoryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const materialTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const brandTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current)

    categoryTimeoutRef.current = setTimeout(async () => {
      if (!openDropdown || openDropdown !== 'category') return

      setCategoryLoading(true)
      try {
        const response = await inventoryApi.getCategories({
          search: categorySearch || undefined,
          skip: 0,
          limit: 10,
        })
        setCategoryOptions(response.data.items || [])
      } catch (error) {
        console.error('Error loading categories:', error)
        setCategoryOptions([])
      } finally {
        setCategoryLoading(false)
      }
    }, 300)

    return () => {
      if (categoryTimeoutRef.current) clearTimeout(categoryTimeoutRef.current)
    }
  }, [categorySearch, openDropdown])

  useEffect(() => {
    if (materialTimeoutRef.current) clearTimeout(materialTimeoutRef.current)

    materialTimeoutRef.current = setTimeout(async () => {
      if (!openDropdown || openDropdown !== 'material') return

      setMaterialLoading(true)
      try {
        const response = await inventoryApi.getMaterials({
          search: materialSearch || undefined,
          skip: 0,
          limit: 10,
        })
        setMaterialOptions(response.data.items || [])
      } catch (error) {
        console.error('Error loading materials:', error)
        setMaterialOptions([])
      } finally {
        setMaterialLoading(false)
      }
    }, 300)

    return () => {
      if (materialTimeoutRef.current) clearTimeout(materialTimeoutRef.current)
    }
  }, [materialSearch, openDropdown])

  useEffect(() => {
    if (brandTimeoutRef.current) clearTimeout(brandTimeoutRef.current)

    brandTimeoutRef.current = setTimeout(async () => {
      if (!openDropdown || openDropdown !== 'marca') return

      setBrandLoading(true)
      try {
        const response = await inventoryApi.getBrands({
          search: brandSearch || undefined,
          skip: 0,
          limit: 10,
        })
        setBrandOptions(response.data.items || [])
      } catch (error) {
        console.error('Error loading brands:', error)
        setBrandOptions([])
      } finally {
        setBrandLoading(false)
      }
    }, 300)

    return () => {
      if (brandTimeoutRef.current) clearTimeout(brandTimeoutRef.current)
    }
  }, [brandSearch, openDropdown])

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        const skip = (page - 1) * limit
        const params: Record<string, unknown> = {
          skip,
          limit,
        }

        if (search) params.search = search
        if (selectedCategory) params.category_id = selectedCategory
        if (selectedMaterial) params.material_id = selectedMaterial
        if (selectedBrand) params.brand_id = selectedBrand
        if (selectedAvailability !== 'all') params.stock_status = selectedAvailability

        const response = await inventoryApi.getProducts(params)
        const items = response.data.items || []
        setProducts(items)
        setTotal(response.data.total || 0)
      } catch (error) {
        console.error('Error loading products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [search, selectedCategory, selectedMaterial, selectedBrand, selectedAvailability, page, limit, refreshKey])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutsideCategory = !categoryRef.current?.contains(target)
      const isOutsideMaterial = !materialRef.current?.contains(target)
      const isOutsideBrand = !brandRef.current?.contains(target)
      const isOutsideAvailability = !estadoRef.current?.contains(target)

      if (isOutsideCategory && isOutsideMaterial && isOutsideBrand && isOutsideAvailability) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await inventoryApi.getStats()
        const data = response.data as any
        setStats({
          totalProducts: data.total_products || 0,
          totalStock: data.total_stock || 0,
          lowStockCount: data.low_stock_count || 0,
          totalValue: data.total_inventory_value || 0,
        })
      } catch (error) {
        console.error('Error loading stats:', error)
        setStats({
          totalProducts: 0,
          totalStock: 0,
          lowStockCount: 0,
          totalValue: 0,
        })
      }
    }
    loadStats()
  }, [refreshKey])

  useEffect(() => {
    if (productToDelete) { contextOpenModal() } else { contextCloseModal() }
  }, [productToDelete, contextOpenModal, contextCloseModal])

  const totalPages = Math.ceil(total / limit)
  const selectedCategorieName = categoryOptions.find(c => c.id === selectedCategory)?.name || 'Categoría'
  const selectedMaterialName = materialOptions.find(m => m.id === selectedMaterial)?.name || 'Material'
  const selectedBrandName = brandOptions.find(b => b.id === selectedBrand)?.name || 'Marca'
  const selectedAvailabilityName = selectedAvailability === 'all' ? 'Disponibilidad' : statusLabel[selectedAvailability]

  async function handleDeleteConfirm() {
    await inventoryApi.deleteProduct(productToDelete!.id)
    setProductToDelete(null)
    setRefreshKey(k => k + 1)
  }

  const getProductStatus = (stock: number, threshold: number) => {
    if (stock === 0) return 'out_of_stock'
    return stock <= threshold ? 'low_stock' : 'in_stock'
  }

  const activeLabelMap: Record<string, string> = {
    productos: 'Productos',
    ...Object.fromEntries(ATTRIBUTE_TABS.map(t => [t.key, t.label])),
  }

  return (
    <div className={styles.container}>
      <PageHeader
        prefix="INV"
        activeLabel={activeLabelMap[activeTab] ?? 'Productos'}
        title="Inventario Principal"
        action={
          <button
            className="btn-new"
            onClick={() => navigate('/inventory/create')}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Nuevo Producto</span>
          </button>
        }
      />

      <div className={styles.kpiStrip}>
        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>Total Productos</div>
            <div className={styles.kpiIconWrapperAccent}>
              <Grid size={16} />
            </div>
          </div>
          <div className={styles.kpiValue}>{stats.totalProducts}</div>
        </div>

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>Total Stock</div>
            <div className={styles.kpiIconWrapperWarning}>
              <Package size={16} />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ color: 'var(--warning)' }}>{stats.totalStock}</div>
        </div>

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>Stock Bajo</div>
            <div className={styles.kpiIconWrapperDestructive}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ color: 'var(--destructive)' }}>{stats.lowStockCount}</div>
        </div>

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiLabel}>Valor Total</div>
            <div className={styles.kpiIconWrapperSuccess}>
              <DollarSign size={16} />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ color: 'var(--success)' }}>
            <span className={styles.currencySymbol}>$</span>
            {stats.totalValue.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <nav className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'productos' ? styles.tabActive : ''}`}
          onClick={() => setSearchParams({})}
        >
          Productos
        </button>
        {ATTRIBUTE_TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setSearchParams({ tab: tab.key })}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab !== 'productos' && (() => {
        const tabConfig = ATTRIBUTE_TABS.find(t => t.key === activeTab)
        if (!tabConfig) return null
        return (
          <AttributeTab
            key={activeTab}
            fetchFn={tabConfig.fetchFn}
            searchKey="name"
            onSuccess={() => {}}
            columns={tabConfig.columns}
            fields={tabConfig.fields}
            createTitle={tabConfig.createTitle}
            editTitle={tabConfig.editTitle}
            searchLabel={tabConfig.label}
            createFn={tabConfig.createFn}
            updateFn={tabConfig.updateFn}
            deleteFn={tabConfig.deleteFn}
          />
        )
      })()}

      {activeTab === 'productos' && <>
      <div className={styles.tableSection}>
        <CommandBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Nombre o ID..."
        >

            <div className={styles.dynamicDropdown} ref={categoryRef}>
              <button
                className={`${styles.dropdownTrigger} ${selectedCategory ? styles.filterActive : ''}`}
                onClick={() => {
                  if (openDropdown === 'category') {
                    setOpenDropdown(null)
                  } else {
                    setOpenDropdown('category')
                    setCategorySearch('')
                  }
                }}
              >
                {selectedCategorieName}
                <ChevronDown size={14} />
              </button>
              {openDropdown === 'category' && (
                <div className={styles.dropdownContent}>
                  <input
                    type="text"
                    className={styles.dropdownSearch}
                    placeholder="Buscar categoría..."
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.dropdownOptions}>
                    <div
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSelectedCategory('')
                        setOpenDropdown(null)
                        setPage(1)
                      }}
                    >
                      Todas las Categorías
                    </div>
                    {categoryLoading ? (
                      <div className={styles.dropdownOption} style={{ justifyContent: 'center' }}>
                        <Loader size={14} className={styles.loadingSpinner} />
                      </div>
                    ) : (
                      categoryOptions.map(cat => (
                        <div
                          key={cat.id}
                          className={`${styles.dropdownOption} ${selectedCategory === cat.id ? styles.active : ''}`}
                          onClick={() => {
                            setSelectedCategory(cat.id)
                            setCategorySearch('')
                            setOpenDropdown(null)
                            setPage(1)
                          }}
                        >
                          {cat.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.dynamicDropdown} ref={materialRef}>
              <button
                className={`${styles.dropdownTrigger} ${selectedMaterial ? styles.filterActive : ''}`}
                onClick={() => {
                  if (openDropdown === 'material') {
                    setOpenDropdown(null)
                  } else {
                    setOpenDropdown('material')
                    setMaterialSearch('')
                  }
                }}
              >
                {selectedMaterialName}
                <ChevronDown size={14} />
              </button>
              {openDropdown === 'material' && (
                <div className={styles.dropdownContent}>
                  <input
                    type="text"
                    className={styles.dropdownSearch}
                    placeholder="Buscar material..."
                    value={materialSearch}
                    onChange={e => setMaterialSearch(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.dropdownOptions}>
                    <div
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSelectedMaterial('')
                        setOpenDropdown(null)
                        setPage(1)
                      }}
                    >
                      Todos los Materiales
                    </div>
                    {materialLoading ? (
                      <div className={styles.dropdownOption} style={{ justifyContent: 'center' }}>
                        <Loader size={14} className={styles.loadingSpinner} />
                      </div>
                    ) : (
                      materialOptions.map(mat => (
                        <div
                          key={mat.id}
                          className={`${styles.dropdownOption} ${selectedMaterial === mat.id ? styles.active : ''}`}
                          onClick={() => {
                            setSelectedMaterial(mat.id)
                            setMaterialSearch('')
                            setOpenDropdown(null)
                            setPage(1)
                          }}
                        >
                          {mat.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.dynamicDropdown} ref={brandRef}>
              <button
                className={`${styles.dropdownTrigger} ${selectedBrand ? styles.filterActive : ''}`}
                onClick={() => {
                  if (openDropdown === 'marca') {
                    setOpenDropdown(null)
                  } else {
                    setOpenDropdown('marca')
                    setBrandSearch('')
                  }
                }}
              >
                {selectedBrandName}
                <ChevronDown size={14} />
              </button>
              {openDropdown === 'marca' && (
                <div className={styles.dropdownContent}>
                  <input
                    type="text"
                    className={styles.dropdownSearch}
                    placeholder="Buscar marca..."
                    value={brandSearch}
                    onChange={e => setBrandSearch(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.dropdownOptions}>
                    <div
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSelectedBrand('')
                        setOpenDropdown(null)
                        setPage(1)
                      }}
                    >
                      Todas las Marcas
                    </div>
                    {brandLoading ? (
                      <div className={styles.dropdownOption} style={{ justifyContent: 'center' }}>
                        <Loader size={14} className={styles.loadingSpinner} />
                      </div>
                    ) : (
                      brandOptions.map(brand => (
                        <div
                          key={brand.id}
                          className={`${styles.dropdownOption} ${selectedBrand === brand.id ? styles.active : ''}`}
                          onClick={() => {
                            setSelectedBrand(brand.id)
                            setBrandSearch('')
                            setOpenDropdown(null)
                            setPage(1)
                          }}
                        >
                          {brand.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.dynamicDropdown} ref={estadoRef}>
              <button
                className={`${styles.dropdownTrigger} ${selectedAvailability !== 'all' ? styles.filterActive : ''}`}
                onClick={() => {
                  if (openDropdown === 'estado') {
                    setOpenDropdown(null)
                  } else {
                    setOpenDropdown('estado')
                  }
                }}
              >
                {selectedAvailabilityName}
                <ChevronDown size={14} />
              </button>
              {openDropdown === 'estado' && (
                <div className={styles.dropdownContent}>
                  <div className={styles.dropdownOptions}>
                    <div
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSelectedAvailability('all')
                        setOpenDropdown(null)
                        setPage(1)
                      }}
                    >
                      Todos
                    </div>
                    <div
                      className={`${styles.dropdownOption} ${selectedAvailability === 'in_stock' ? styles.active : ''}`}
                      onClick={() => {
                        setSelectedAvailability('in_stock')
                        setOpenDropdown(null)
                        setPage(1)
                      }}
                    >
                      En Stock
                    </div>
                    <div
                      className={`${styles.dropdownOption} ${selectedAvailability === 'low_stock' ? styles.active : ''}`}
                      onClick={() => {
                        setSelectedAvailability('low_stock')
                        setOpenDropdown(null)
                        setPage(1)
                      }}
                    >
                      Stock Bajo
                    </div>
                    <div
                      className={`${styles.dropdownOption} ${selectedAvailability === 'out_of_stock' ? styles.active : ''}`}
                      onClick={() => {
                        setSelectedAvailability('out_of_stock')
                        setOpenDropdown(null)
                        setPage(1)
                      }}
                    >
                      Sin Stock
                    </div>
                  </div>
                </div>
              )}
            </div>
        </CommandBar>

        <DataCard>
          <DataTable
            loading={loading}
            empty={products.length === 0}
            loadingText="Cargando productos..."
            emptyText="No se encontraron productos."
            minWidth="800px"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            isPaginationLoading={loading}
          >
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Medida</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Mín.</th>
                <th>Material</th>
                <th>Marca</th>
                <th>Precio Unit.</th>
                <th>Disponibilidad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const status = getProductStatus(p.stock_quantity || 0, p.low_stock_threshold || 0)
                return (
                  <tr key={p.id}>
                    <td>
                      <button
                        className={styles.skuLink}
                        onClick={() => navigate(`/inventory/product/${p.id}`)}
                        title="Ver producto"
                      >
                        {p.sku}
                      </button>
                    </td>
                    <td><span className={styles.nameCell}>{p.name || '-'}</span></td>
                    <td><span className={styles.unitCell}>{p.size_value} {p.measurement_unit?.abbreviation}</span></td>
                    <td><span className={styles.categoryCell}>{p.category?.name || '-'}</span></td>
                    <td>
                      <span className={`${styles.stockCell} ${status === 'low_stock' || status === 'out_of_stock' ? styles.stockCellLow : styles.stockCellOk}`}>
                        {p.stock_quantity} <span className={styles.stockUnit}>{p.unit}</span>
                      </span>
                    </td>
                    <td><span className={styles.minCell}>{p.low_stock_threshold}</span></td>
                    <td><span className={styles.materialCell}>{p.material?.name || '-'}</span></td>
                    <td><span className={styles.brandCell}>{p.brand?.name || '-'}</span></td>
                    <td><span className={styles.priceCell}>$ {(p.price || 0).toFixed(2)}</span></td>
                    <td><span className={styles[statusMap[status]]}>{statusLabel[status]}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="action-btn"
                          title="Ver producto"
                          onClick={() => navigate(`/inventory/product/${p.id}`)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="action-btn action-btn--destructive"
                          title="Eliminar"
                          onClick={() => setProductToDelete({ id: p.id, name: p.name + ' ' + p.size_value + ' ' + p.measurement_unit?.abbreviation })}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </DataTable>
        </DataCard>
      </div>
      </>}

      {productToDelete && (
        <ConfirmDeleteModal
          productName={productToDelete.name}
          onConfirm={handleDeleteConfirm}
          onClose={() => setProductToDelete(null)}
        />
      )}
    </div>
  )
}
