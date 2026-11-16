// Tipos que comparten los servicios, los composables y los componentes.
// Describen el contrato de la API de la Unidad 2.

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada'

/** Valor del filtro de la lista: un estado o todas las tareas. */
export type StatusFilter = TaskStatus | 'todas'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  attachment: string | null
  version: number
  createdAt: string
  updatedAt: string
}

/** Campos que la persona puede escribir en el formulario. */
export interface TaskInput {
  title: string
  description: string
  status?: TaskStatus
}

export interface User {
  id: string
  username: string
}

export interface Credentials {
  username: string
  password: string
}

/** Mensajes de error por campo, por ejemplo { title: 'Ya tienes una tarea con ese título.' } */
export type FieldErrors = Record<string, string>

export type LoadStatus = 'loading' | 'success' | 'error'

/** Copia local de la lista para consultarla sin conexión. */
export interface TaskSnapshot {
  tasks: Task[]
  savedAt: string
}
