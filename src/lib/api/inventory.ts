import api from '@/lib/axios'
import type { PaginatedResponse, Product } from '@/types'

interface FilterOption {
  id: number
  name: string
}

export const inventoryApi = {
  getProducts: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Product>>('/inventory/variants', { params }),

  getProduct: (id: number) =>
    api.get<Product>(`/inventory/variants/${id}`),

  createProduct: (data: Partial<Product>) =>
    api.post<Product>('/inventory/variants', data),

  updateProduct: (id: number, data: Partial<Product>) =>
    api.put<Product>(`/inventory/variants/${id}`, data),

  deleteProduct: (id: number) =>
    api.delete(`/inventory/variants/${id}`),

  getMaterials: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<FilterOption>>('/inventory/materials', { params }),

  getCategories: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<FilterOption>>('/inventory/categories', { params }),

  getBrands: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<FilterOption>>('/inventory/brands', { params }),

  getStats: () =>
    api.get<PaginatedResponse<FilterOption>>('/inventory/variants/stats/overview'),
}
