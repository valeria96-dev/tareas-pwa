// Estado compartido 2 de 2: el aviso global. Una vista lo emite ("Tarea creada")
// y se sigue viendo después de navegar a otra, por eso no puede ser estado local.
import { reactive, readonly } from 'vue'

export type NoticeType = 'success' | 'error'

const DURATION_MS = 5000
const state = reactive<{ message: string; type: NoticeType }>({ message: '', type: 'success' })
let timer: ReturnType<typeof setTimeout> | undefined

function show(message: string, type: NoticeType): void {
  clearTimeout(timer)
  state.message = message
  state.type = type
  timer = setTimeout(dismiss, DURATION_MS)
}

function dismiss(): void {
  clearTimeout(timer)
  state.message = ''
}

export function useNotice() {
  return {
    notice: readonly(state),
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
    dismiss,
  }
}
