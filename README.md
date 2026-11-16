# Mis Tareas — SPA/PWA con Vue 3 (Unidad 3, Aplicaciones Web, UPS)

Aplicación de una sola página hecha con **Vue 3 + TypeScript + Vue Router + Vite** que consume la
**API de tareas de la Unidad 2** (Node.js, Express y MongoDB). Permite crear una cuenta, iniciar
sesión y gestionar tareas personales: crear, editar, cambiar de estado, filtrar, adjuntar un
archivo y eliminar. Es instalable (PWA) y, sin conexión, deja consultar la última lista en modo
de solo lectura.

## Demostración

Video de la aplicación en funcionamiento: https://youtu.be/wNqIbS5NjYY

## Requisitos

- Node.js 22 o superior (LTS)
- La [API de la Unidad 2](https://github.com/valeria96-dev/api-tareas) (`api-tareas`) encendida. Por defecto se espera en `http://localhost:3000`

## Instalación y ejecución

```bash
git clone https://github.com/valeria96-dev/tareas-pwa.git
cd tareas-pwa
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev               # abre http://localhost:5173
```

En otra terminal debe estar corriendo la API (`npm run dev` dentro de `api-tareas`).
Si la API usa otro puerto o dirección, cámbiala en `API_TARGET` dentro de `.env`.

| Comando              | Qué hace                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo con recarga automática (sin service worker)                           |
| `npm run build`      | Genera `dist/` con la app, el manifest y el service worker                                   |
| `npm run preview`    | Sirve `dist/` en http://localhost:4173 — **úsalo para probar la PWA y el modo sin conexión** |
| `npm test`           | 22 pruebas automáticas (Vitest)                                                              |
| `npm run lint`       | Revisa el estilo del código (ESLint)                                                         |
| `npm run type-check` | Comprueba los tipos de TypeScript en `.ts` y `.vue` (vue-tsc)                                |
| `npm run format`     | Da formato a todo el código con Prettier                                                     |

## Arquitectura

```
src/
├── main.ts              Arranque: router, cierre por sesión caducada y registro del service worker
├── App.vue              Raíz: une el estado compartido con la cabecera y el router
├── router/              Rutas, protección de rutas privadas, título y foco al navegar
├── views/               Una por pantalla. Son las únicas que llaman a la API
│   ├── LoginView        Iniciar sesión / crear cuenta
│   ├── TasksView        Lista, filtro, cambio de estado y eliminación
│   ├── TaskNewView      Crear tarea
│   ├── TaskDetailView   Editar, adjuntar archivo y eliminar
│   └── NotFoundView     Ruta inexistente
├── components/          Piezas de interfaz: reciben props y emiten eventos, no conocen la API
├── composables/         Estado y lógica reutilizable
├── services/            Acceso HTTP centralizado y copia local
├── constants/           Estados de una tarea
├── types.ts             Tipos compartidos: Task, User, TaskStatus…
└── assets/styles.css    Variables, base y estilos comunes (mobile first)
```

El proyecto usa **TypeScript**, ESLint y Prettier, la misma configuración que genera
`npm create vue@latest`. Cada componente es un archivo único (SFC) con
`<script setup lang="ts">` (Composition API) y estilos `scoped`. Las props y los eventos se
declaran con tipos en `defineProps` y `defineEmits`, así el contrato de cada componente queda
escrito en el código y el editor avisa si se usa mal.

### Componentes y sus contratos

| Componente           | Props (entrada)                                                                  | Eventos (salida)          |
| -------------------- | -------------------------------------------------------------------------------- | ------------------------- |
| `AppHeader`          | `user`, `online`, `canInstall`, `loggingOut`                                     | `logout`, `install`       |
| `AppNotice`          | `message`, `type`                                                                | `dismiss`                 |
| `AuthForm`           | `mode`, `submitting`, `errorMessage`, `serverErrors`                             | `submit`                  |
| `TaskFilter`         | `modelValue`, `counts`                                                           | `update:modelValue`       |
| `TaskList`           | `tasks`, `pendingIds`, `readOnly`                                                | `change-status`, `delete` |
| `TaskItem`           | `task`, `pending`, `readOnly`                                                    | `change-status`, `delete` |
| `TaskForm`           | `initial`, `showStatus`, `submitLabel`, `submitting`, `disabled`, `serverErrors` | `submit`, `cancel`        |
| `AttachmentUploader` | `hasAttachment`, `downloadUrl`, `uploading`, `disabled`, `errorMessage`          | `upload`                  |
| `ConfirmDialog`      | `open`, `title`, `message`, `confirmLabel`, `busy`                               | `confirm`, `cancel`       |
| `StateMessage`       | `type` (loading, empty, error), `title`, `description`, `actionLabel`            | `action`                  |
| `StatusBadge`        | `status`                                                                         | —                         |

Los datos bajan por props y los cambios suben por eventos. Ningún componente modifica una prop:
los formularios trabajan sobre una copia local y `TaskItem` solo avisa de lo que la persona quiere hacer.

### Dónde vive el estado

| Estado                               | Dónde                                      | Por qué                                      |
| ------------------------------------ | ------------------------------------------ | -------------------------------------------- |
| Sesión (usuario actual)              | `useSession` (compartido)                  | Lo usan la cabecera, el router y las vistas  |
| Aviso de éxito o error               | `useNotice` (compartido)                   | Se muestra después de navegar a otra vista   |
| Lista de tareas                      | `useTasks`, creado por `TasksView` (local) | Solo esa vista la necesita                   |
| Filtro elegido                       | URL (`?estado=pendiente`)                  | Se conserva al recargar y con el botón atrás |
| Campos de formulario, envío en curso | Cada componente o vista (local)            | No interesa a nadie más                      |

No se usa Pinia ni Vuex: con dos módulos pequeños de estado compartido no hace falta una librería.

## Estrategia de API

- **Un solo punto de acceso**: `src/services/http.ts` es el único archivo que llama a `fetch`.
  `auth.api.ts` y `tasks.api.ts` describen los endpoints y las vistas usan esas funciones.
- **Validación de la respuesta**: se comprueba el tipo de contenido antes de leer el JSON y luego `response.ok`. Si es falso, se lanza un `ApiError` con `status`, `code`, `message`
  y `details`, tomados del formato uniforme de errores de la API. Un fallo de red se convierte
  en el mismo tipo de error (`NETWORK_ERROR`), así la interfaz trata todos los casos igual.
- **Errores por campo**: los `400` de validación y los `409` por duplicado se muestran junto al
  campo correspondiente; los demás, en un mensaje general.
- **Condiciones de carrera**:
  - Cada carga de la lista o de una tarea usa `AbortController`; una carga nueva cancela la
    anterior y una respuesta atrasada se descarta.
  - Mientras una tarea tiene una petición en curso, sus controles se bloquean, igual que los
    botones de enviar de los formularios.
  - La API usa bloqueo optimista: cada `PATCH` envía la `version` leída. Si responde
    `409 VERSION_CONFLICT`, la app recarga los datos y avisa en lugar de pisar el otro cambio.
- **Sesión caducada**: cualquier `401 UNAUTHORIZED` borra los datos locales y lleva al inicio de sesión.
- **Mismo origen**: el navegador siempre llama a `/api/...` en el dominio de la app. En desarrollo,
  Vite reenvía esas peticiones a la API, así la cookie de sesión (`httpOnly`, `sameSite=lax`)
  funciona sin configurar CORS.

## PWA y estrategia de caché

Generada con `vite-plugin-pwa` (Workbox). La configuración está en `vite.config.ts`.

| Recurso                               | Estrategia                                                    | Motivo                                                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App shell (HTML, JS, CSS, iconos)     | **Precache** al instalar; se sirve desde la caché             | No cambia entre versiones y permite abrir la app sin red. Cada build tiene nombres con hash y la caché vieja se elimina                                         |
| Navegación a cualquier ruta de la SPA | Responde `index.html` desde la caché                          | El router resuelve la ruta en el cliente, también sin conexión                                                                                                  |
| `/api/*`                              | **Solo red** (nunca se guarda en la caché del service worker) | Son datos privados que dependen de la sesión; guardarlos podría mostrarlos a otra persona en el mismo equipo o dar por hecho un cambio que no llegó al servidor |

**Experiencia sin conexión (limitada a propósito):**

- La app abre y muestra la última lista de tareas que se cargó, con un aviso de que es una copia y su fecha.
- La copia se guarda en `localStorage` por usuario y **se borra al cerrar sesión** o cuando la sesión caduca.
- Sin conexión todo es de solo lectura: no hay controles para crear, editar ni eliminar. No se guardan
  cambios en cola, porque al sincronizarlos después podrían chocar con cambios hechos desde otro dispositivo.
- El manifest (`name`, `short_name`, `start_url`, `display: standalone`, colores e iconos de 192 y 512 px,
  uno de ellos `maskable`) permite instalarla; la cabecera muestra el botón **Instalar app** cuando el navegador lo ofrece.

## Diseño adaptable y accesibilidad

- Mobile first con un punto de quiebre (768 px). Probado de 320 a 1366 px sin desplazamiento horizontal.
- HTML semántico (`header`, `nav`, `main`, `section`, listas), un solo `h1` por vista y enlace «Saltar al contenido».
- Al cambiar de ruta se actualiza el título del documento y el foco pasa al `h1` de la vista nueva.
- Cada campo tiene su `label`; los errores se enlazan con `aria-describedby`, el campo se marca con
  `aria-invalid` y el foco va al primer campo con error.
- Los avisos usan regiones `aria-live`; el filtro usa `aria-pressed`; el diálogo de confirmación es un
  `<dialog>` nativo (atrapa el foco y se cierra con Esc).
- Controles de 44 px de alto como mínimo, foco siempre visible y respeto de `prefers-reduced-motion`.

## Pruebas

`npm test` ejecuta 22 pruebas:

- `tests/http.test.ts` — servicio HTTP: respuesta correcta, `response.ok` falso, `204`, respuestas que no son JSON,
  fallo de red, cancelación y aviso de sesión caducada.
- `tests/useTasks.test.ts` — estados de carga, éxito y error; condición de carrera entre dos cargas;
  copia local sin conexión.
- `tests/components.test.ts` — `TaskItem` (eventos, no muta props, bloqueo y solo lectura), `TaskFilter`,
  `TaskForm` (validación y errores de la API) y `StateMessage`.

### Prueba manual del modo sin conexión

1. `npm run build` y `npm run preview`; abre http://localhost:4173 e inicia sesión.
2. En DevTools → Application → Service workers, comprueba que está **activated**.
3. En DevTools → Network elige **Offline** y recarga: la app abre, muestra la copia de la lista y oculta los controles de cambio.
4. Vuelve a **No throttling** y pulsa **Reintentar**.

## Evidencias

Las capturas de la aplicación están en [`docs/capturas`](docs/capturas) (lista en celular, tableta y
escritorio; estado vacío; errores de validación; conflicto de versión; modo sin conexión) y el
diagrama de componentes en [`docs/diagrama-componentes.svg`](docs/diagrama-componentes.svg).

## Mejoras pendientes

- No se usan los eventos en tiempo real (Socket.io) de la API: la lista se actualiza al cargar la vista.
- Faltan pruebas con un lector de pantalla real y en dispositivos físicos.
