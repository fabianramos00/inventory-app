import api from '@/lib/axios'
import type { AuthResponse, LoginPayload } from '@/types'

export const authApi = {
  login: (payload: LoginPayload) => {
    const formData = new URLSearchParams()
    formData.append('username', payload.email)
    formData.append('password', payload.password)
    return api.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  },

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),
}
