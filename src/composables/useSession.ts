// Estado compartido 1 de 2: la sesión. Lo necesitan la cabecera, el guard del router
// y las vistas, así que vive en un módulo y no en un componente.
import { reactive, readonly } from 'vue'
import { authApi } from '@/services/auth.api'
import { isConnectionError } from '@/services/http'
import { clearSnapshot } from '@/services/offlineStore'
import type { Credentials, User } from '@/types'

const STORAGE_KEY = 'tareas:usuario'

const state = reactive<{ user: User | null }>({ user: null })
let restoring: Promise<void> | null = null

function readStoredUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
  } catch {
    return null
  }
}

function setUser(user: User | null): void {
  state.user = user
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* la sesión sigue en memoria */
  }
}

// Borra del dispositivo todo lo que pertenece al usuario.
function forget(): void {
  if (state.user) clearSnapshot(state.user.id)
  setUser(null)
}

// Pregunta a la API si la cookie de sesión sigue viva. Se ejecuta una sola vez,
// aunque varias navegaciones la pidan al mismo tiempo.
function restore(): Promise<void> {
  restoring ??= (async () => {
    const stored = readStoredUser()
    if (!stored) return // este navegador no inició sesión: no hace falta preguntar a la API
    try {
      const { id } = await authApi.me()
      setUser(stored.id === id ? stored : { id, username: '' })
    } catch (err: unknown) {
      // Sin red no se puede comprobar: se mantiene el último usuario solo para leer su copia local.
      if (isConnectionError(err)) state.user = stored
      else {
        clearSnapshot(stored.id)
        setUser(null)
      }
    }
  })()
  return restoring
}

async function login(credentials: Credentials): Promise<void> {
  setUser(await authApi.login(credentials))
}

async function register(credentials: Credentials): Promise<void> {
  setUser(await authApi.register(credentials))
}

async function logout(): Promise<void> {
  try {
    await authApi.logout()
  } finally {
    forget() // aunque la petición falle, este dispositivo queda sin datos del usuario
  }
}

export function useSession() {
  return { session: readonly(state), restore, login, register, logout, forget }
}
