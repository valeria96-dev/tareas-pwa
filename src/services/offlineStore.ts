import type { Task, TaskSnapshot } from '@/types'

// Copia local de la última lista de tareas, para poder consultarla sin conexión.
// Se guarda por usuario y se borra al cerrar sesión. Si el navegador bloquea
// localStorage (modo privado), la app sigue funcionando sin copia.

const key = (userId: string): string => `tareas:lista:${userId}`

export function saveSnapshot(userId: string, tasks: Task[]): void {
  try {
    const snapshot: TaskSnapshot = { tasks, savedAt: new Date().toISOString() }
    localStorage.setItem(key(userId), JSON.stringify(snapshot))
  } catch {
    /* sin espacio o sin permiso: no hay copia */
  }
}

export function readSnapshot(userId: string): TaskSnapshot | null {
  try {
    const snapshot = JSON.parse(localStorage.getItem(key(userId)) ?? 'null')
    return Array.isArray(snapshot?.tasks) ? (snapshot as TaskSnapshot) : null
  } catch {
    return null
  }
}

export function clearSnapshot(userId: string): void {
  try {
    localStorage.removeItem(key(userId))
  } catch {
    /* nada que borrar */
  }
}
