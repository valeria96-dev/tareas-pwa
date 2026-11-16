// @vitest-environment node
import { describe, test, expect, vi, afterEach } from 'vitest'
import { request, ApiError, setUnauthorizedHandler } from '@/services/http'

const jsonResponse = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })

afterEach(() => {
  vi.unstubAllGlobals()
  setUnauthorizedHandler(() => {})
})

describe('servicio HTTP', () => {
  test('devuelve los datos cuando response.ok es verdadero', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, [{ id: '1' }])))
    await expect(request('/api/tasks')).resolves.toEqual([{ id: '1' }])
  })

  test('envía la cookie de sesión y el cuerpo como JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { id: '1' }))
    vi.stubGlobal('fetch', fetchMock)
    await request('/api/tasks', { method: 'POST', body: { title: 'Estudiar' } })
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/tasks')
    expect(options.credentials).toBe('include')
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(options.body).toBe('{"title":"Estudiar"}')
  })

  test('devuelve null en un 204 sin intentar leer JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(204)))
    await expect(request('/api/tasks/1', { method: 'DELETE' })).resolves.toBeNull()
  })

  test('si response.ok es falso lanza ApiError con el código y los detalles de la API', async () => {
    const body = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos',
        details: [{ field: 'title', message: 'corto' }],
      },
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(400, body)))
    const err = await request('/api/tasks', { method: 'POST', body: {} }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Datos de entrada inválidos',
    })
    expect((err as ApiError).details).toEqual([{ field: 'title', message: 'corto' }])
  })

  test('un error que no trae JSON (por ejemplo 502) también se convierte en ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 })),
    )
    await expect(request('/api/tasks')).rejects.toMatchObject({ status: 502, code: 'HTTP_ERROR' })
  })

  test('un 200 que no es JSON no rompe la app: se valida el tipo de contenido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>ok</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    )
    await expect(request('/api/tasks')).resolves.toBeNull()
  })

  test('un fallo de red se informa como NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(request('/api/tasks')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })

  test('una petición cancelada por la app termina en AbortError, no en error de red', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, { signal }: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) =>
            signal.addEventListener('abort', () => reject(signal.reason)),
          ),
      ),
    )
    const controller = new AbortController()
    const pending = request('/api/tasks', { signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })

  test('un 401 UNAUTHORIZED avisa a la app para cerrar la sesión; credenciales incorrectas no', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(401, { error: { code: 'INVALID_CREDENTIALS', message: 'x' } }),
        ),
    )
    await request('/api/auth/login', { method: 'POST', body: {} }).catch(() => {})
    expect(handler).not.toHaveBeenCalled()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'x' } })),
    )
    await request('/api/tasks').catch(() => {})
    expect(handler).toHaveBeenCalledOnce()
  })
})
