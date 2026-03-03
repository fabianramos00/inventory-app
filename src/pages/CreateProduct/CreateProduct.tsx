import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { ChevronLeft, Loader, ChevronDown, Plus, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { inventoryApi } from '@/lib/api/inventory'
import { useModalContext } from '@/context/ModalContext'
import type { FilterOption } from '@/types'
import styles from './CreateProduct.module.css'

const createProductSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(255),
  brand_id: z.number().int().min(1, 'Marca es requerida'),
  category_id: z.number().int().min(1, 'Categoría es requerida'),
  material_id: z.number().int().min(1, 'Material es requerido'),
  size_value: z.string().nullable().optional(),
  measurement_unit_id: z.number().nullable().optional(),
  sale_price: z.number().min(0, 'Precio debe ser mayor a 0'),
  cost: z.number().min(0, 'Costo debe ser mayor a 0'),
  initial_quantity: z.number().int().min(0, 'Cantidad inicial debe ser mayor a 0'),
  min_stock_quantity: z.number().int().min(0, 'Cantidad mínima debe ser mayor a 0'),
})

type CreateProductFormInputs = z.infer<typeof createProductSchema>

export default function CreateProduct() {
  const navigate = useNavigate()
  const { openModal: contextOpenModal, closeModal: contextCloseModal } = useModalContext()
  const [apiError, setApiError] = useState<string | null>(null)

  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([])
  const [materialOptions, setMaterialOptions] = useState<FilterOption[]>([])
  const [brandOptions, setBrandOptions] = useState<FilterOption[]>([])
  const [measurementUnitOptions, setMeasurementUnitOptions] = useState<FilterOption[]>([])

  const [categorySearch, setCategorySearch] = useState('')
  const [materialSearch, setMaterialSearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [measurementUnitSearch, setMeasurementUnitSearch] = useState('')

  const [categoryLoading, setCategoryLoading] = useState(false)
  const [materialLoading, setMaterialLoading] = useState(false)
  const [brandLoading, setBrandLoading] = useState(false)
  const [measurementUnitLoading, setMeasurementUnitLoading] = useState(false)

  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Modal states
  const [openModal, setOpenModal] = useState<string | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Modal form states
  const [materialForm, setMaterialForm] = useState({ name: '' })
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [brandForm, setBrandForm] = useState({ name: '', logo_url: '' })
  const [measurementUnitForm, setMeasurementUnitForm] = useState({ name: '', abbreviation: '' })

  const categoryRef = useRef<HTMLDivElement>(null)
  const materialRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const measurementUnitRef = useRef<HTMLDivElement>(null)

  const categoryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const materialTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const brandTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const measurementUnitTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<CreateProductFormInputs>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      brand_id: 0,
      category_id: 0,
      material_id: 0,
      size_value: undefined,
      measurement_unit_id: undefined,
      sale_price: 0,
      cost: 0,
      initial_quantity: 0,
      min_stock_quantity: 0,
    },
  })

  const selectedCategory = watch('category_id')
  const selectedMaterial = watch('material_id')
  const selectedBrand = watch('brand_id')
  const selectedMeasurementUnit = watch('measurement_unit_id')

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
      if (!openDropdown || openDropdown !== 'brand') return

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
    if (measurementUnitTimeoutRef.current) clearTimeout(measurementUnitTimeoutRef.current)

    measurementUnitTimeoutRef.current = setTimeout(async () => {
      if (!openDropdown || openDropdown !== 'measurementUnit') return

      setMeasurementUnitLoading(true)
      try {
        const response = await inventoryApi.getMeasurementUnits({
          search: measurementUnitSearch || undefined,
          skip: 0,
          limit: 10,
        })
        setMeasurementUnitOptions(response.data.items || [])
      } catch (error) {
        console.error('Error loading size units:', error)
        setMeasurementUnitOptions([])
      } finally {
        setMeasurementUnitLoading(false)
      }
    }, 300)

    return () => {
      if (measurementUnitTimeoutRef.current) clearTimeout(measurementUnitTimeoutRef.current)
    }
  }, [measurementUnitSearch, openDropdown])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryRef.current && !categoryRef.current.contains(event.target as Node) &&
        materialRef.current && !materialRef.current.contains(event.target as Node) &&
        brandRef.current && !brandRef.current.contains(event.target as Node) &&
        measurementUnitRef.current && !measurementUnitRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (openModal) {
      contextOpenModal()
    } else {
      contextCloseModal()
    }
  }, [openModal, contextOpenModal, contextCloseModal])

  async function onSubmit(data: CreateProductFormInputs) {
    setApiError(null)
    try {
      const cleanedData = {
        ...data,
        size_value: !data.size_value || data.size_value.trim() === '' ? null : data.size_value,
        measurement_unit_id: !data.measurement_unit_id ? null : data.measurement_unit_id,
      }
      await inventoryApi.createProduct(cleanedData as CreateProductFormInputs)
      navigate('/inventory', { state: { successMessage: 'Producto creado exitosamente' } })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear producto'
      setApiError(message)
    }
  }

  const getCategoryLabel = (id: number) => categoryOptions.find(c => c.id === id)?.name || 'Seleccionar'
  const getMaterialLabel = (id: number) => materialOptions.find(m => m.id === id)?.name || 'Seleccionar'
  const getBrandLabel = (id: number) => brandOptions.find(b => b.id === id)?.name || 'Seleccionar'
  const getMeasurementUnitLabel = (id: number) => measurementUnitOptions.find(m => m.id === id)?.name || 'Seleccionar'

  async function handleCreateMaterial() {
    if (!materialForm.name.trim()) {
      setModalError('El nombre es requerido')
      return
    }
    setModalLoading(true)
    setModalError(null)
    try {
      const response = await inventoryApi.createMaterial({ name: materialForm.name })
      const newMaterial = response.data
      setMaterialOptions([...materialOptions, newMaterial])
      setValue('material_id', newMaterial.id)
      setOpenModal(null)
      setMaterialForm({ name: '' })
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Error al crear material')
    } finally {
      setModalLoading(false)
    }
  }

  async function handleCreateCategory() {
    if (!categoryForm.name.trim()) {
      setModalError('El nombre es requerido')
      return
    }
    setModalLoading(true)
    setModalError(null)
    try {
      const response = await inventoryApi.createCategory({ name: categoryForm.name, description: categoryForm.description })
      const newCategory = response.data
      setCategoryOptions([...categoryOptions, newCategory])
      setValue('category_id', newCategory.id)
      setOpenModal(null)
      setCategoryForm({ name: '', description: '' })
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Error al crear categoría')
    } finally {
      setModalLoading(false)
    }
  }

  async function handleCreateBrand() {
    if (!brandForm.name.trim()) {
      setModalError('El nombre es requerido')
      return
    }
    setModalLoading(true)
    setModalError(null)
    try {
      const response = await inventoryApi.createBrand({ name: brandForm.name, logo_url: brandForm.logo_url })
      const newBrand = response.data
      setBrandOptions([...brandOptions, newBrand])
      setValue('brand_id', newBrand.id)
      setOpenModal(null)
      setBrandForm({ name: '', logo_url: '' })
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Error al crear marca')
    } finally {
      setModalLoading(false)
    }
  }

  async function handleCreateMeasurementUnit() {
    if (!measurementUnitForm.name.trim() || !measurementUnitForm.abbreviation.trim()) {
      setModalError('Nombre y abreviatura son requeridos')
      return
    }
    setModalLoading(true)
    setModalError(null)
    try {
      const response = await inventoryApi.createMeasurementUnit({ name: measurementUnitForm.name, abbreviation: measurementUnitForm.abbreviation })
      const newUnit = response.data
      setMeasurementUnitOptions([...measurementUnitOptions, newUnit])
      setValue('measurement_unit_id', newUnit.id)
      setOpenModal(null)
      setMeasurementUnitForm({ name: '', abbreviation: '' })
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Error al crear unidad de medida')
    } finally {
      setModalLoading(false)
    }
  }

  function closeModal() {
    setOpenModal(null)
    setModalError(null)
    setMaterialForm({ name: '' })
    setCategoryForm({ name: '', description: '' })
    setBrandForm({ name: '', logo_url: '' })
    setMeasurementUnitForm({ name: '', abbreviation: '' })
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <button
          type="button"
          onClick={() => navigate('/inventory')}
          className={styles.backButton}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className={styles.breadcrumb}>INV / REGISTRO</p>
          <h1 className={styles.pageTitle}>Registro de Producto</h1>
          <p className={styles.pageDescription}>Complete la información detallada para registrar el producto en el catálogo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {apiError && (
          <div className={styles.errorBox}>
            {apiError}
          </div>
        )}

        <section className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Información General</h2>
          <div className={styles.grid3col}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Nombre</label>
              <input
                type="text"
                className={styles.inputField}
                placeholder="Nombre del producto"
                {...register('name')}
              />
              {errors.name && <p className={styles.errorMessage}>{errors.name.message}</p>}
            </div>

            <div className={styles.inputGroup} ref={brandRef}>
              <label className={styles.inputLabel}>Marca</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={styles.dropdownButton}
                  onClick={() => setOpenDropdown(openDropdown === 'brand' ? null : 'brand')}
                  style={{ flex: 1 }}
                >
                  {selectedBrand ? getBrandLabel(selectedBrand) : 'Seleccionar'}
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => setOpenModal('brand')}
                  title="Agregar nueva marca"
                >
                  <Plus size={16} />
                </button>
              </div>
              {openDropdown === 'brand' && (
                <div className={styles.dropdownMenu}>
                  <input
                    type="text"
                    className={styles.dropdownSearch}
                    placeholder="Buscar marca..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                  />
                  {brandLoading && (
                    <div className={styles.dropdownLoading}>
                      <Loader size={16} className={styles.spinner} />
                    </div>
                  )}
                  {!brandLoading && brandOptions.length === 0 && (
                    <div className={styles.dropdownEmpty}>Sin opciones</div>
                  )}
                  {!brandLoading && brandOptions.map((brand) => (
                    <button
                      key={brand.id}
                      type="button"
                      className={`${styles.dropdownOption} ${selectedBrand === brand.id ? styles.dropdownOptionActive : ''}`}
                      onClick={() => {
                        setValue('brand_id', brand.id)
                        setOpenDropdown(null)
                        setBrandSearch('')
                      }}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              )}
              {errors.brand_id && <p className={styles.errorMessage}>{errors.brand_id.message}</p>}
            </div>

            <div className={styles.inputGroup} ref={categoryRef}>
              <label className={styles.inputLabel}>Categoría</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={styles.dropdownButton}
                  onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                  style={{ flex: 1 }}
                >
                  {selectedCategory ? getCategoryLabel(selectedCategory) : 'Seleccionar'}
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => setOpenModal('category')}
                  title="Agregar nueva categoría"
                >
                  <Plus size={16} />
                </button>
              </div>
              {openDropdown === 'category' && (
                <div className={styles.dropdownMenu}>
                  <input
                    type="text"
                    className={styles.dropdownSearch}
                    placeholder="Buscar categoría..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                  />
                  {categoryLoading && (
                    <div className={styles.dropdownLoading}>
                      <Loader size={16} className={styles.spinner} />
                    </div>
                  )}
                  {!categoryLoading && categoryOptions.length === 0 && (
                    <div className={styles.dropdownEmpty}>Sin opciones</div>
                  )}
                  {!categoryLoading && categoryOptions.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`${styles.dropdownOption} ${selectedCategory === category.id ? styles.dropdownOptionActive : ''}`}
                      onClick={() => {
                        setValue('category_id', category.id)
                        setOpenDropdown(null)
                        setCategorySearch('')
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
              {errors.category_id && <p className={styles.errorMessage}>{errors.category_id.message}</p>}
            </div>

            <div className={styles.inputGroup} ref={materialRef}>
              <label className={styles.inputLabel}>Material</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={styles.dropdownButton}
                  onClick={() => setOpenDropdown(openDropdown === 'material' ? null : 'material')}
                  style={{ flex: 1 }}
                >
                  {selectedMaterial ? getMaterialLabel(selectedMaterial) : 'Seleccionar'}
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => setOpenModal('material')}
                  title="Agregar nuevo material"
                >
                  <Plus size={16} />
                </button>
              </div>
              {openDropdown === 'material' && (
                <div className={styles.dropdownMenu}>
                  <input
                    type="text"
                    className={styles.dropdownSearch}
                    placeholder="Buscar material..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                  />
                  {materialLoading && (
                    <div className={styles.dropdownLoading}>
                      <Loader size={16} className={styles.spinner} />
                    </div>
                  )}
                  {!materialLoading && materialOptions.length === 0 && (
                    <div className={styles.dropdownEmpty}>Sin opciones</div>
                  )}
                  {!materialLoading && materialOptions.map((material) => (
                    <button
                      key={material.id}
                      type="button"
                      className={`${styles.dropdownOption} ${selectedMaterial === material.id ? styles.dropdownOptionActive : ''}`}
                      onClick={() => {
                        setValue('material_id', material.id)
                        setOpenDropdown(null)
                        setMaterialSearch('')
                      }}
                    >
                      {material.name}
                    </button>
                  ))}
                </div>
              )}
              {errors.material_id && <p className={styles.errorMessage}>{errors.material_id.message}</p>}
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Tamaño (opcional)</label>
              <input
                type="text"
                className={styles.inputField}
                placeholder="ej: 10, 5.5, 12 x 5"
                {...register('size_value')}
              />
              {errors.size_value && <p className={styles.errorMessage}>{errors.size_value.message}</p>}
            </div>

            <div className={styles.inputGroup} ref={measurementUnitRef}>
              <label className={styles.inputLabel}>Unidad de Medida</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={styles.dropdownButton}
                  onClick={() => setOpenDropdown(openDropdown === 'measurementUnit' ? null : 'measurementUnit')}
                  style={{ flex: 1 }}
                >
                  {selectedMeasurementUnit ? getMeasurementUnitLabel(selectedMeasurementUnit) : 'Seleccionar'}
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => setOpenModal('measurementUnit')}
                  title="Agregar nueva unidad de medida"
                >
                  <Plus size={16} />
                </button>
              </div>
              {openDropdown === 'measurementUnit' && (
                <div className={styles.dropdownMenu}>
                  <input
                    type="text"
                    className={styles.dropdownSearch}
                    placeholder="Buscar unidad..."
                    value={measurementUnitSearch}
                    onChange={(e) => setMeasurementUnitSearch(e.target.value)}
                  />
                  {measurementUnitLoading && (
                    <div className={styles.dropdownLoading}>
                      <Loader size={16} className={styles.spinner} />
                    </div>
                  )}
                  {!measurementUnitLoading && measurementUnitOptions.length === 0 && (
                    <div className={styles.dropdownEmpty}>Sin opciones</div>
                  )}
                  {!measurementUnitLoading && measurementUnitOptions.map((unit) => (
                    <button
                      key={unit.id}
                      type="button"
                      className={`${styles.dropdownOption} ${selectedMeasurementUnit === unit.id ? styles.dropdownOptionActive : ''}`}
                      onClick={() => {
                        setValue('measurement_unit_id', unit.id)
                        setOpenDropdown(null)
                        setMeasurementUnitSearch('')
                      }}
                    >
                      {unit.abbreviation} - {unit.name}
                    </button>
                  ))}
                </div>
              )}
              {errors.measurement_unit_id && <p className={styles.errorMessage}>{errors.measurement_unit_id.message}</p>}
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Valores Económicos</h2>
          <div className={styles.grid2col}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Precio de Venta</label>
              <input
                type="number"
                className={styles.inputField}
                placeholder="0.00"
                step="0.01"
                {...register('sale_price', { valueAsNumber: true })}
              />
              {errors.sale_price && <p className={styles.errorMessage}>{errors.sale_price.message}</p>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Costo</label>
              <input
                type="number"
                className={styles.inputField}
                placeholder="0.00"
                step="0.01"
                {...register('cost', { valueAsNumber: true })}
              />
              {errors.cost && <p className={styles.errorMessage}>{errors.cost.message}</p>}
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Control de Stock</h2>
          <div className={styles.grid2col}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Cantidad Inicial</label>
              <input
                type="number"
                className={styles.inputField}
                placeholder="0"
                {...register('initial_quantity', { valueAsNumber: true })}
              />
              {errors.initial_quantity && <p className={styles.errorMessage}>{errors.initial_quantity.message}</p>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Cantidad Mínima</label>
              <input
                type="number"
                className={styles.inputField}
                placeholder="0"
                {...register('min_stock_quantity', { valueAsNumber: true })}
              />
              {errors.min_stock_quantity && <p className={styles.errorMessage}>{errors.min_stock_quantity.message}</p>}
            </div>
          </div>
        </section>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className={styles.cancelBtn}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className={styles.spinner} />
                Guardando...
              </>
            ) : (
              'Guardar Producto'
            )}
          </button>
        </div>
      </form>

      {/* Modals */}
      {openModal === 'brand' && createPortal(
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Agregar Marca</h2>
              <button className={styles.modalCloseButton} onClick={closeModal} type="button">
                <X size={20} />
              </button>
            </div>
            {modalError && <div className={styles.modalError}>{modalError}</div>}
            <div className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Nombre</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Nombre de la marca"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Logo URL (opcional)</label>
                <input
                  type="url"
                  className={styles.inputField}
                  placeholder="https://ejemplo.com/logo.png"
                  value={brandForm.logo_url}
                  onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={closeModal} type="button">
                Cancelar
              </button>
              <button
                className={styles.modalSaveBtn}
                onClick={handleCreateBrand}
                disabled={modalLoading}
                type="button"
              >
                {modalLoading ? (
                  <>
                    <Loader size={14} className={styles.spinner} />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        </div>
        , document.body)}

      {openModal === 'category' && createPortal(
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Agregar Categoría</h2>
              <button className={styles.modalCloseButton} onClick={closeModal} type="button">
                <X size={20} />
              </button>
            </div>
            {modalError && <div className={styles.modalError}>{modalError}</div>}
            <div className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Nombre</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Nombre de la categoría"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Descripción (opcional)</label>
                <textarea
                  className={styles.inputField}
                  placeholder="Descripción de la categoría"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={3}
                  style={{ fontFamily: 'inherit' }}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={closeModal} type="button">
                Cancelar
              </button>
              <button
                className={styles.modalSaveBtn}
                onClick={handleCreateCategory}
                disabled={modalLoading}
                type="button"
              >
                {modalLoading ? (
                  <>
                    <Loader size={14} className={styles.spinner} />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        </div>
        , document.body)}

      {openModal === 'material' && createPortal(
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Agregar Material</h2>
              <button className={styles.modalCloseButton} onClick={closeModal} type="button">
                <X size={20} />
              </button>
            </div>
            {modalError && <div className={styles.modalError}>{modalError}</div>}
            <div className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Nombre</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Nombre del material"
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={closeModal} type="button">
                Cancelar
              </button>
              <button
                className={styles.modalSaveBtn}
                onClick={handleCreateMaterial}
                disabled={modalLoading}
                type="button"
              >
                {modalLoading ? (
                  <>
                    <Loader size={14} className={styles.spinner} />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        </div>
        , document.body)}

      {openModal === 'measurementUnit' && createPortal(
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Agregar Unidad de Medida</h2>
              <button className={styles.modalCloseButton} onClick={closeModal} type="button">
                <X size={20} />
              </button>
            </div>
            {modalError && <div className={styles.modalError}>{modalError}</div>}
            <div className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Nombre</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Centímetros"
                  value={measurementUnitForm.name}
                  onChange={(e) => setMeasurementUnitForm({ ...measurementUnitForm, name: e.target.value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Abreviatura</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="cm"
                  value={measurementUnitForm.abbreviation}
                  onChange={(e) => setMeasurementUnitForm({ ...measurementUnitForm, abbreviation: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={closeModal} type="button">
                Cancelar
              </button>
              <button
                className={styles.modalSaveBtn}
                onClick={handleCreateMeasurementUnit}
                disabled={modalLoading}
                type="button"
              >
                {modalLoading ? (
                  <>
                    <Loader size={14} className={styles.spinner} />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        </div>
        , document.body)}
    </div>
  )
}
