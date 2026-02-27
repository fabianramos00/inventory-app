import api from '@/lib/axios'
import type { PaginatedResponse, User } from '@/types'

export const usersApi = {
  getUsers: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  getUser: (id: number) =>
    api.get<User>(`/users/${id}`),

  createUser: (data: Partial<User>) =>
    api.post<User>('/users', data),

  updateUser: (id: number, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),

  deleteUser: (id: number) =>
    api.delete(`/users/${id}`),
}
