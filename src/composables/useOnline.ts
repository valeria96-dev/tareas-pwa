import { ref, onMounted, onUnmounted } from 'vue'

// Refleja si el navegador tiene red. Los formularios lo usan para bloquear cambios sin conexión.
export function useOnline() {
  const online = ref(navigator.onLine)
  const update = () => {
    online.value = navigator.onLine
  }

  onMounted(() => {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })
  onUnmounted(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })

  return { online }
}
