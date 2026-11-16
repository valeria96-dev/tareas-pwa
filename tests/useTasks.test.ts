import { describe, test, expect, vi, beforeEach } from 'vitest'
import { effectScope } from 'vue'
import { useTasks } from '@/composables/useTasks'
import { tasksApi } from '@/services/tasks.api'
import { ApiError } from '@/services/http'
import type { Task } from '@/types'

vi.mock('@/services/tasks.api', () => ({ tasksApi: { list: vi.fn() } }))

const task = (id: string, title: string): Task => ({
  id,
  title,
  description: '',
  status: 'pendiente',
  attachment: null,
  version: 0,
  createdAt: '2026-11-15T15:00:00.000Z',
  updatedAt: '2026-11-15T15:00:00.000Z',
})

const list = vi.mocked(tasksApi.list)

// Promesa que se resuelve a mano, para decidir en qué orden llegan las respuestas.
const deferred = () => {
  let resolve!: (tasks: Task[]) => void
  const promise = new Promise<Task[]>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const setup = () => effectScope().run(() => useTasks('usuario-1'))!

beforeEach(() => {
  localStorage.clear()
  list.mockReset()
})

describe('useTasks', () => {
  test('pasa de carga a éxito y guarda las tareas', async () => {
    list.mockResolvedValue([task('1', 'A')])
    const state = setup()
    const loading = state.load()
    expect(state.status.value).toBe('loading')
    await loading
    expect(state.status.value).toBe('success')
    expect(state.tasks.value).toHaveLength(1)
  })

  test('condición de carrera: la respuesta vieja no pisa a la nueva', async () => {
    const first = deferred()
    const second = deferred()
    list.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const state = setup()

    const firstLoad = state.load()
    const secondLoad = state.load()
    expect(list.mock.calls[0]?.[0]?.aborted).toBe(true) // la primera petición se canceló

    second.resolve([task('2', 'Nueva')])
    first.resolve([task('1', 'Vieja')]) // llega tarde
    await Promise.all([firstLoad, secondLoad])

    expect(state.tasks.value.map((item) => item.title)).toEqual(['Nueva'])
  })

  test('un error del servidor deja el estado en error', async () => {
    list.mockRejectedValue(
      new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'Error interno' }),
    )
    const state = setup()
    await state.load()
    expect(state.status.value).toBe('error')
    expect(state.error.value?.message).toBe('Error interno')
  })

  test('sin conexión muestra la última copia guardada y lo indica', async () => {
    list.mockResolvedValueOnce([task('1', 'A')])
    const state = setup()
    await state.load()

    list.mockRejectedValueOnce(
      new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Sin conexión' }),
    )
    await state.load()

    expect(state.status.value).toBe('success')
    expect(state.tasks.value).toHaveLength(1)
    expect(state.staleSince.value).not.toBeNull()
  })

  test('sin conexión y sin copia guardada queda en error', async () => {
    list.mockRejectedValue(
      new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Sin conexión' }),
    )
    const state = setup()
    await state.load()
    expect(state.status.value).toBe('error')
  })
})
