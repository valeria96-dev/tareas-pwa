import { ref, onMounted, onUnmounted } from 'vue'

// Evento que Chrome y Edge envían cuando la app cumple los requisitos de PWA.
// Todavía no forma parte de los tipos estándar de TypeScript.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Se guarda el evento para mostrar un botón propio de "Instalar app".
export function useInstallPrompt() {
  const canInstall = ref(false)
  let promptEvent: BeforeInstallPromptEvent | null = null

  const onPrompt = (event: Event) => {
    event.preventDefault()
    promptEvent = event as BeforeInstallPromptEvent
    canInstall.value = true
  }
  const onInstalled = () => {
    promptEvent = null
    canInstall.value = false
  }

  async function install(): Promise<void> {
    if (!promptEvent) return
    await promptEvent.prompt()
    await promptEvent.userChoice
    onInstalled() // el evento solo se puede usar una vez
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
  })
  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onPrompt)
    window.removeEventListener('appinstalled', onInstalled)
  })

  return { canInstall, install }
}
