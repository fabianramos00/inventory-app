import api from '@/lib/axios'
import type { Order, OrderStatus, PaginatedResponse } from '@/types'

export const ordersApi = {
  getOrders: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Order>>('/supply-chain/purchase-orders', { params }),

  getOrder: (id: number) =>
    api.get<Order>(`/supply-chain/purchase-orders/${id}`),

  createOrder: (data: Partial<Order>) =>
    api.post<Order>('/supply-chain/purchase-orders', data),

  updateOrderStatus: (id: number, status: OrderStatus) =>
    api.patch(`/supply-chain/purchase-orders/${id}`, { status }),

  deleteOrder: (id: number) =>
    api.delete(`/supply-chain/purchase-orders/${id}`),
}
