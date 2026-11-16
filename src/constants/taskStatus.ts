import type { TaskStatus } from '@/types'

// Los mismos tres estados que valida la API.
export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completada', label: 'Completada' },
]

export const statusLabel = (value: string): string =>
  TASK_STATUSES.find((status) => status.value === value)?.label ?? value
