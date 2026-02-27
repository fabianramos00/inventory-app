import api from '@/lib/axios'
import type { PaginatedResponse, Sale } from '@/types'

export const sellsApi = {
  getSales: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Sale>>('/sells', { params }),

  getSale: (id: number) =>
    api.get<Sale>(`/sells/${id}`),

  createSale: (data: Partial<Sale>) =>
    api.post<Sale>('/sells', data),

  deleteSale: (id: number) =>
    api.delete(`/sells/${id}`),
}
