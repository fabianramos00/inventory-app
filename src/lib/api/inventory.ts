import api from '@/lib/axios'
import type { PaginatedResponse, Product, CreateProductInput, FilterOption, InventoryStatsData } from '@/types'

export const inventoryApi = {
  getProducts: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Product>>('/inventory/products', { params }),

  getProduct: (id: number) =>
    api.get<Product>(`/inventory/products/${id}`),

  createProduct: (data: CreateProductInput) =>
    api.post<Product>('/inventory/products', data),

  updateProduct: (id: number, data: Partial<CreateProductInput>) =>
    api.put<Product>(`/inventory/products/${id}`, data),

  deleteProduct: (id: number) =>
    api.delete(`/inventory/products/${id}`),

  getMaterials: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<FilterOption>>('/inventory/materials', { params }),

  getCategories: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<FilterOption>>('/inventory/categories', { params }),

  getBrands: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<FilterOption>>('/inventory/brands', { params }),

  getMeasurementUnits: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<FilterOption>>('/inventory/measurement-units', { params }),

  createMaterial: (data: { name: string }) =>
    api.post<FilterOption>('/inventory/materials', data),

  createCategory: (data: { name: string; description?: string }) =>
    api.post<FilterOption>('/inventory/categories', data),

  createBrand: (data: { name: string; logo_url?: string }) =>
    api.post<FilterOption>('/inventory/brands', data),

  createMeasurementUnit: (data: { name: string; abbreviation: string }) =>
    api.post<FilterOption>('/inventory/measurement-units', data),

  updateCategory: (id: number, data: { name: string; description?: string }) =>
    api.put<FilterOption>(`/inventory/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/inventory/categories/${id}`),

  updateBrand: (id: number, data: { name: string; logo_url?: string }) =>
    api.put<FilterOption>(`/inventory/brands/${id}`, data),
  deleteBrand: (id: number) => api.delete(`/inventory/brands/${id}`),

  updateMaterial: (id: number, data: { name: string }) =>
    api.put<FilterOption>(`/inventory/materials/${id}`, data),
  deleteMaterial: (id: number) => api.delete(`/inventory/materials/${id}`),

  updateMeasurementUnit: (id: number, data: { name: string; abbreviation: string }) =>
    api.put<FilterOption>(`/inventory/measurement-units/${id}`, data),
  deleteMeasurementUnit: (id: number) => api.delete(`/inventory/measurement-units/${id}`),

  getStats: () =>
    api.get<InventoryStatsData>('/inventory/products/stats/overview'),
}
