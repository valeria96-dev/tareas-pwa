import { nextTick } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSession } from '@/composables/useSession'

// Cada vista se descarga solo cuando se visita, con import() dinámico
// (el service worker ya las tiene en precache).
const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'tasks' } }, // redirección estática
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Iniciar sesión', guestOnly: true },
  },
  {
    path: '/tareas',
    name: 'tasks',
    component: () => import('@/views/TasksView.vue'),
    meta: { title: 'Mis tareas', requiresAuth: true },
  },
  {
    path: '/tareas/nueva',
    name: 'task-new',
    component: () => import('@/views/TaskNewView.vue'),
    meta: { title: 'Nueva tarea', requiresAuth: true },
  },
  {
    path: '/tareas/:id', // ruta dinámica
    name: 'task-detail',
    component: () => import('@/views/TaskDetailView.vue'),
    meta: { title: 'Editar tarea', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Página no encontrada' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const { session, restore } = useSession()

// Redirección según el estado de la aplicación: sin sesión, al inicio de sesión.
router.beforeEach(async (to) => {
  await restore() // la primera navegación espera a saber si hay sesión
  if (to.meta.requiresAuth && !session.user) {
    return { name: 'login', query: to.fullPath === '/tareas' ? {} : { volver: to.fullPath } }
  }
  if (to.meta.guestOnly && session.user) return { name: 'tasks' }
  return true
})

// En una SPA la página no se recarga: hay que actualizar el título y llevar el foco
// al encabezado para que el lector de pantalla anuncie la vista nueva.
router.afterEach(async (to, from) => {
  document.title = to.meta.title ? `${to.meta.title} · Mis Tareas` : 'Mis Tareas'
  if (!from.name || to.path === from.path) return
  await nextTick()
  document.querySelector<HTMLElement>('main h1')?.focus()
})

export default router
