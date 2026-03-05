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
  // Extended fields returned by the API
  stock_quantity?: number
  low_stock_threshold?: number
  size_value?: string | null
  measurement_unit?: { id: number; name: string; abbreviation: string } | null
  material?: { id: number; name: string } | null
  brand?: { id: number; name: string } | null
  cost?: number
  sale_price?: number
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
  sale_id: number
  product_id: number
  quantity: number
  delivered_quantity: number
  unit_price: number
  subtotal: number
  product_name: string
  product_sku: string
  brand_name: string | null
  material_name: string | null
  category_name: string | null
}

export type PaymentStatus = 'pending' | 'paid' | 'partial'
export type DeliveryStatus = 'pending' | 'partial' | 'delivered'
export type PaymentMethod = 'cash' | 'credit' | 'debit' | null

export interface Sale {
  id: number
  total_amount: number
  debt_amount: number
  payment_status: PaymentStatus
  delivery_status: DeliveryStatus
  payment_method: PaymentMethod
  amount_paid: number
  client_id: number | null
  created_at: string
  updated_at: string | null
  created_by_id: number
  created_by: Pick<User, 'id' | 'full_name' | 'email' | 'is_active' | 'is_superuser'>
  client: { id: number; name: string } | null
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface CursorPaginatedResponse<T> {
  items: T[]
  has_next: boolean
  skip: number
  limit: number
}

// ─── Dropdown / Filter Options ────────────────────────────────────────────────
export interface FilterOption {
  id: number
  name: string
  abbreviation?: string
}

// ─── Sale Creation Form ───────────────────────────────────────────────────────
export interface CreateSaleInput {
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  amount_paid: number
  client_id: number | null
  items: {
    product_id: number
    quantity: number
    delivered_quantity: number
    unit_price: number | null
  }[]
}

// ─── Product Creation Form ────────────────────────────────────────────────────
export interface CreateProductInput {
  name: string
  sku?: string
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
