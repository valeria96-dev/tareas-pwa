import type { ApiError } from './http'
import type { FieldErrors } from '@/types'

// Convierte un error de la API en mensajes por campo para los formularios.
// La API envía details como lista [{ field, message }] en los 400
// y como objeto { campo: valor } cuando hay un duplicado (409).
const DUPLICATE_MESSAGES: FieldErrors = {
  title: 'Ya tienes una tarea con ese título.',
  username: 'Ese nombre de usuario ya está en uso.',
}

interface ValidationDetail {
  field: string
  message: string
}

export function fieldErrorsFrom(err: ApiError): FieldErrors {
  if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
    const details = err.details as ValidationDetail[]
    return Object.fromEntries(details.map(({ field, message }) => [field, message]))
  }

  if (err.code === 'DUPLICATE' && err.details && typeof err.details === 'object') {
    return Object.fromEntries(
      Object.keys(err.details)
        .filter((field) => field in DUPLICATE_MESSAGES)
        .map((field) => [field, DUPLICATE_MESSAGES[field]!]),
    )
  }

  return {}
}
