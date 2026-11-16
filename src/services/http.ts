// Único punto de acceso HTTP de la aplicación.
// Ningún componente llama a fetch: todos pasan por request().

const BASE_URL: string = import.meta.env.VITE_API_URL || ''

interface ApiErrorData {
  status: number
  code: string
  message: string
  details?: unknown
}

/** Forma del cuerpo de error que devuelve la API: { error: { code, message, details } } */
interface ErrorBody {
  error?: { code?: string; message?: string; details?: unknown }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: object
  signal?: AbortSignal
}

// Error uniforme: la interfaz siempre recibe status, code, message y details,
// venga el fallo de la API o de la red.
export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor({ status, code, message, details }: ApiErrorData) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/** En un catch el error es `unknown`: esta función lo convierte siempre en un ApiError. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
  return new ApiError({ status: 0, code: 'UNKNOWN', message })
}

export const isConnectionError = (err: unknown): boolean =>
  err instanceof ApiError && err.code === 'NETWORK_ERROR'

export const isAbortError = (err: unknown): boolean =>
  err instanceof Error && err.name === 'AbortError'

// La sesión dura una hora en el servidor. Si caduca, cualquier petición responde 401
// y la app debe volver al inicio de sesión: main.ts registra aquí qué hacer.
let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (handler: () => void): void => {
  onUnauthorized = handler
}

// Valida el tipo de contenido antes de leer el cuerpo: si no es JSON
// (por ejemplo, la página HTML de un 502 del hosting) no se intenta interpretarlo.
async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null
  try {
    return await response.json()
  } catch {
    return null // cuerpo vacío o JSON mal formado
  }
}

export async function request<T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  const isForm = body instanceof FormData

  let response: Response
  try {
    response = await fetch(BASE_URL + path, {
      method,
      credentials: 'include', // envía la cookie de sesión
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
      signal, // permite cancelar la petición con AbortController
    })
  } catch {
    // Cancelada a propósito por la app (petición reemplazada o vista cerrada): quien llama la ignora.
    if (signal?.aborted) throw new DOMException('Petición cancelada', 'AbortError')
    // fetch solo falla así cuando no pudo llegar al servidor
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'No hay conexión con el servidor.',
    })
  }

  // Validación del estado HTTP
  if (!response.ok) {
    const data = (await readJson(response)) as ErrorBody | null
    const error = new ApiError({
      status: response.status,
      code: data?.error?.code ?? 'HTTP_ERROR',
      message: data?.error?.message ?? `El servidor respondió con un error (${response.status}).`,
      details: data?.error?.details,
    })
    if (error.code === 'UNAUTHORIZED') onUnauthorized()
    throw error
  }

  if (response.status === 204) return null as T // respuesta correcta sin cuerpo

  return (await readJson(response)) as T
}

// Las descargas de adjuntos usan un enlace normal, así que también necesitan la URL base.
export const apiUrl = (path: string): string => BASE_URL + path
