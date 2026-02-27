import { useState, useEffect, useRef } from 'react'
import { Search, Plus, AlertCircle, DollarSign, Package, Grid, ChevronDown, Loader } from 'lucide-react'
import styles from './Inventory.module.css'
import { inventoryApi } from '@/lib/api/inventory'
import Pagination from '@/components/Pagination'
import type { Product } from '@/types'

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
  const [stats, setStats] = useState({
    totalVariants: 0,
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
  const categoryTimeoutRef = useRef<NodeJS.Timeout>()
  const materialTimeoutRef = useRef<NodeJS.Timeout>()
  const brandTimeoutRef = useRef<NodeJS.Timeout>()

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
  }, [search, selectedCategory, selectedMaterial, selectedBrand, selectedAvailability, page, limit])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutsideCategory = !categoryRef.current?.contains(target)
      const isOutsideMaterial = !materialRef.current?.contains(target)
      const isOutsideBrand = !brandRef.current?.contains(target)

      if (isOutsideCategory && isOutsideMaterial && isOutsideBrand) {
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
          totalVariants: data.total_variants || 0,
          totalStock: data.total_stock || 0,
          lowStockCount: data.low_stock_count || 0,
          totalValue: data.total_inventory_value || 0,
        })
      } catch (error) {
        console.error('Error loading stats:', error)
        setStats({
          totalVariants: 0,
          totalStock: 0,
          lowStockCount: 0,
          totalValue: 0,
        })
      }
    }
    loadStats()
  }, [])

  const totalPages = Math.ceil(total / limit)
  const selectedCategorieName = categoryOptions.find(c => c.id === selectedCategory)?.name || 'Categoría'
  const selectedMaterialName = materialOptions.find(m => m.id === selectedMaterial)?.name || 'Material'
  const selectedBrandName = brandOptions.find(b => b.id === selectedBrand)?.name || 'Marca'

  const getProductStatus = (stock: number, threshold: number) => {
    if (stock === 0) return 'out_of_stock'
    return stock <= threshold ? 'low_stock' : 'in_stock'
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <span className="bin-label mb-2 inline-block">INV / Productos</span>
          <h1 className={styles.pageTitle}>Control de Inventario</h1>
          <p className={styles.pageDescription}>Gestión centralizada de stock, hardware y componentes.</p>
        </div>
        <button className={styles.newProductBtn}>
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(250, 204, 21, 0.1)', color: 'var(--accent)' }}>
            <Grid size={20} />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>TOTAL VARIANTES</div>
            <div className={styles.kpiValue}>{stats.totalVariants}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--warning)' }}>
            <Package size={20} />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>TOTAL STOCK</div>
            <div className={styles.kpiValue} style={{ color: 'var(--warning)' }}>{stats.totalStock}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--destructive)' }}>
            <AlertCircle size={20} />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>STOCK BAJO</div>
            <div className={styles.kpiValue} style={{ color: 'var(--destructive)' }}>{stats.lowStockCount}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(22, 163, 74, 0.1)', color: 'var(--success)' }}>
            <DollarSign size={20} />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>VALOR TOTAL</div>
            <div className={styles.kpiValue} style={{ color: 'var(--success)' }}>
              $ {stats.totalValue.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Nombre o ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

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

        <select
          className={`${styles.filterSelect} ${selectedAvailability !== 'all' ? styles.filterActive : ''}`}
          value={selectedAvailability}
          onChange={e => {
            setSelectedAvailability(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">Estado</option>
          <option value="in_stock">En Stock</option>
          <option value="low_stock">Stock Bajo</option>
          <option value="out_of_stock">Sin Stock</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>
            <Loader size={24} className={styles.loadingSpinner} />
            <p>Cargando productos...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="data-table w-full min-w-[800px]">
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
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const status = getProductStatus(p.stock_quantity || 0, p.low_stock_threshold || 0)
                    return (
                      <tr key={p.id}>
                        <td><span className={styles.skuCell}>{p.sku}</span></td>
                        <td><span className={styles.nameCell}>{p.product?.name || '-'}</span></td>
                        <td><span className={styles.unitCell}>{p.size_value} {p.size_unit.abbreviation}</span></td>
                        <td><span className={styles.categoryCell}>{p.product?.category?.name || '-'}</span></td>
                        <td>
                          <span className={`${styles.stockCell} ${status === 'bajo' ? styles.stockCellLow : styles.stockCellOk}`}>
                            {p.stock_quantity} <span className={styles.stockUnit}>{p.unit}</span>
                          </span>
                        </td>
                        <td><span className={styles.minCell}>{p.low_stock_threshold}</span></td>
                        <td><span className={styles.materialCell}>{p.product?.material?.name || '-'}</span></td>
                        <td><span className={styles.brandCell}>{p.brand?.name || '-'}</span></td>
                        <td><span className={styles.priceCell}>$ {(p.price || 0).toFixed(2)}</span></td>
                        <td><span className={`badge ${statusMap[status]}`}>{statusLabel[status]}</span></td>
                        <td>
                          <button className={styles.editBtn}>Editar</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {products.length === 0 && (
              <div className={styles.emptyState}>
                No se encontraron productos.
              </div>
            )}

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              isLoading={loading}
            />
          </>
        )}
      </div>
    </div>
  )
}
