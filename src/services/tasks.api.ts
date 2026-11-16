import { request, apiUrl } from './http'
import type { Task, TaskInput } from '@/types'

export const tasksApi = {
  list: (signal?: AbortSignal) => request<Task[]>('/api/tasks', { signal }),
  get: (id: string, signal?: AbortSignal) => request<Task>(`/api/tasks/${id}`, { signal }),
  create: (data: TaskInput) => request<Task>('/api/tasks', { method: 'POST', body: data }),
  // La API usa bloqueo optimista: hay que enviar la versión que se leyó.
  update: (id: string, changes: Partial<TaskInput>, version: number) =>
    request<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: { ...changes, version } }),
  remove: (id: string) => request<null>(`/api/tasks/${id}`, { method: 'DELETE' }),
  uploadAttachment: (id: string, file: File) => {
    const form = new FormData()
    form.append('archivo', file)
    return request<Task>(`/api/tasks/${id}/attachment`, { method: 'POST', body: form })
  },
  attachmentUrl: (id: string) => apiUrl(`/api/tasks/${id}/attachment`),
}
