import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './services/http'
import { useSession } from './composables/useSession'
import { useNotice } from './composables/useNotice'
import './assets/styles.css'

const { session, forget } = useSession()
const notice = useNotice()

// Si la sesión caduca mientras se usa la app, se borran los datos locales y se vuelve al inicio.
setUnauthorizedHandler(() => {
  if (!session.user) return
  forget()
  notice.error('Tu sesión terminó. Inicia sesión de nuevo.')
  router.replace({ name: 'login' })
})

createApp(App).use(router).mount('#app')

// Registra el service worker (solo existe en el build de producción).
registerSW({ immediate: true })
