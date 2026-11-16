<script setup lang="ts">
// Raíz de la app: conecta el estado compartido (sesión, conexión, avisos) con la
// cabecera y deja que el router decida qué vista se muestra.
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppNotice from '@/components/AppNotice.vue'
import { useSession } from '@/composables/useSession'
import { useNotice } from '@/composables/useNotice'
import { useOnline } from '@/composables/useOnline'
import { useInstallPrompt } from '@/composables/useInstallPrompt'

const router = useRouter()
const { session, logout } = useSession()
const { notice, success, dismiss } = useNotice()
const { online } = useOnline()
const { canInstall, install } = useInstallPrompt()

const loggingOut = ref(false)

async function onLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await logout()
  } catch {
    /* sin red: la sesión local se cierra igual */
  } finally {
    loggingOut.value = false
  }
  success('Sesión cerrada.')
  router.push({ name: 'login' })
}
</script>

<template>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <AppHeader
    :user="session.user"
    :online="online"
    :can-install="canInstall"
    :logging-out="loggingOut"
    @logout="onLogout"
    @install="install"
  />
  <main id="contenido" class="main">
    <RouterView />
  </main>
  <AppNotice :message="notice.message" :type="notice.type" @dismiss="dismiss" />
</template>
