import { request } from './http'
import type { Credentials, User } from '@/types'

export const authApi = {
  register: (credentials: Credentials) =>
    request<User>('/api/auth/register', { method: 'POST', body: credentials }),
  login: (credentials: Credentials) =>
    request<User>('/api/auth/login', { method: 'POST', body: credentials }),
  logout: () => request<null>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ id: string }>('/api/auth/me'),
}
