// Estado de la lista de tareas. Es local: lo crea la vista de la lista y muere con ella.
import { ref, onScopeDispose } from 'vue'
import { tasksApi } from '@/services/tasks.api'
import { ApiError, isAbortError, isConnectionError, toApiError } from '@/services/http'
import { saveSnapshot, readSnapshot } from '@/services/offlineStore'
import type { LoadStatus, Task } from '@/types'

export function useTasks(userId: string) {
  const tasks = ref<Task[]>([])
  const status = ref<LoadStatus>('loading')
  const error = ref<ApiError | null>(null)
  // Fecha de la copia local cuando no se pudo llegar al servidor
  const staleSince = ref<string | null>(null)

  let controller: AbortController | null = null

  async function load(): Promise<void> {
    // Control de concurrencia: una carga nueva cancela la anterior, así una respuesta
    // lenta y vieja nunca pisa a una más reciente.
    controller?.abort()
    const current = new AbortController()
    controller = current

    status.value = 'loading'
    error.value = null

    try {
      const data = await tasksApi.list(current.signal)
      if (current !== controller) return
      tasks.value = data
      staleSince.value = null
      status.value = 'success'
      saveSnapshot(userId, data)
    } catch (err: unknown) {
      if (isAbortError(err) || current !== controller) return
      const snapshot = isConnectionError(err) ? readSnapshot(userId) : null
      if (snapshot) {
        tasks.value = snapshot.tasks
        staleSince.value = snapshot.savedAt
        status.value = 'success'
      } else {
        error.value = toApiError(err)
        status.value = 'error'
      }
    }
  }

  // Tras un cambio confirmado por la API se actualiza la lista sin volver a pedirla entera.
  function replace(updated: Task): void {
    tasks.value = tasks.value.map((task) => (task.id === updated.id ? updated : task))
    saveSnapshot(userId, tasks.value)
  }

  function remove(id: string): void {
    tasks.value = tasks.value.filter((task) => task.id !== id)
    saveSnapshot(userId, tasks.value)
  }

  onScopeDispose(() => controller?.abort())

  return { tasks, status, error, staleSince, load, replace, remove }
}
