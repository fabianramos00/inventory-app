import api from '@/lib/axios'
import type { PaginatedResponse, Provider } from '@/types'

export const providersApi = {
  getProviders: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Provider>>('/supply-chain/providers', { params }),

  getProvider: (id: number) =>
    api.get<Provider>(`/supply-chain/providers/${id}`),

  createProvider: (data: Partial<Provider>) =>
    api.post<Provider>('/supply-chain/providers', data),

  updateProvider: (id: number, data: Partial<Provider>) =>
    api.put<Provider>(`/supply-chain/providers/${id}`, data),

  deleteProvider: (id: number) =>
    api.delete(`/supply-chain/providers/${id}`),
}
