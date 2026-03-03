// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string
  password: string
}
export interface AuthResponse {
  access_token: string
  token_type: string
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  full_name: string
  email: string
  is_superuser: boolean
  is_active: boolean
}

// ─── Category / Material ─────────────────────────────────────────────────────
export interface Category {
  id: number
  name: string
  description?: string
}

// ─── Product / Inventory ─────────────────────────────────────────────────────
export interface Product {
  id: number
  name: string
  sku: string
  category: Category
  stock: number
  min_stock: number
  unit: string
  price: number
  is_active: boolean
}

// ─── Provider / Supplier ─────────────────────────────────────────────────────
export interface Provider {
  id: number
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  is_active: boolean
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus = 'PENDIENTE' | 'RECIBIDO' | 'CANCELADO'

export interface OrderItem {
  id: number
  product: Product
  quantity: number
  unit_cost: number
  subtotal: number
}

export interface Order {
  id: number
  code: string
  provider: Provider
  status: OrderStatus
  items: OrderItem[]
  total_amount: number
  created_at: string
}

// ─── Sale ────────────────────────────────────────────────────────────────────
export interface SaleItem {
  id: number
  product: Product
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Sale {
  id: number
  code: string
  customer_name?: string
  items: SaleItem[]
  total: number
  created_at: string
  created_by: Pick<User, 'id' | 'name'>
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// ─── Dropdown / Filter Options ────────────────────────────────────────────────
export interface FilterOption {
  id: number
  name: string
  abbreviation?: string
}

// ─── Product Creation Form ────────────────────────────────────────────────────
export interface CreateProductInput {
  name: string
  brand_id: number
  category_id: number
  material_id: number
  size_value?: string | null
  measurement_unit_id?: number | null
  sale_price: number
  cost: number
  initial_quantity: number
  min_stock_quantity: number
}
