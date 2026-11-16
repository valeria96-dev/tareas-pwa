<script setup lang="ts">
// Vista de una tarea: la carga por su id y coordina edición, adjunto y eliminación.
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TaskForm from '@/components/TaskForm.vue'
import AttachmentUploader from '@/components/AttachmentUploader.vue'
import StateMessage from '@/components/StateMessage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useSession } from '@/composables/useSession'
import { useNotice } from '@/composables/useNotice'
import { useOnline } from '@/composables/useOnline'
import { tasksApi } from '@/services/tasks.api'
import { ApiError, isAbortError, isConnectionError, toApiError } from '@/services/http'
import { fieldErrorsFrom } from '@/services/apiErrors'
import { readSnapshot } from '@/services/offlineStore'
import type { FieldErrors, LoadStatus, Task, TaskInput } from '@/types'

const route = useRoute()
const router = useRouter()
const { session } = useSession()
const notice = useNotice()
const { online } = useOnline()

// Parámetro de la ruta dinámica /tareas/:id
const taskId = computed(() => String(route.params.id))

const task = ref<Task | null>(null)
const status = ref<LoadStatus>('loading')
const error = ref<ApiError | null>(null)
const fromSnapshot = ref(false)

const readOnly = computed(() => !online.value || fromSnapshot.value)

let controller: AbortController | null = null

async function load() {
  // Si la persona cambia de tarea antes de que llegue la respuesta, la petición anterior se cancela.
  controller?.abort()
  const current = new AbortController()
  controller = current
  const id = taskId.value

  status.value = 'loading'
  error.value = null
  try {
    const data = await tasksApi.get(id, current.signal)
    if (current !== controller) return
    task.value = data
    fromSnapshot.value = false
    status.value = 'success'
  } catch (err: unknown) {
    if (isAbortError(err) || current !== controller) return
    // Sin conexión se muestra la tarea de la copia local, solo para lectura.
    const saved = isConnectionError(err)
      ? readSnapshot(session.user?.id ?? '')?.tasks.find((item) => item.id === id)
      : undefined
    if (saved) {
      task.value = saved
      fromSnapshot.value = true
      status.value = 'success'
    } else {
      task.value = null
      error.value = toApiError(err)
      status.value = 'error'
    }
  }
}

// Carga la tarea al entrar y cada vez que cambia el id de la URL.
watch(taskId, load, { immediate: true })
onUnmounted(() => controller?.abort())

const saving = ref(false)
const serverErrors = ref<FieldErrors>({})
const formError = ref('')

async function onSave(changes: TaskInput) {
  if (saving.value || !task.value) return
  saving.value = true
  serverErrors.value = {}
  formError.value = ''
  try {
    const updated = await tasksApi.update(task.value.id, changes, task.value.version)
    notice.success(`Se guardaron los cambios de «${updated.title}».`)
    router.push({ name: 'tasks' })
  } catch (err: unknown) {
    const apiError = toApiError(err)
    if (apiError.code === 'VERSION_CONFLICT') {
      // Alguien guardó antes: se trae la versión actual para no pisar ese cambio.
      await load()
      formError.value =
        'La tarea cambió en otro dispositivo. Se cargó la versión más reciente: revísala y guarda de nuevo.'
    } else if (apiError.code === 'NOT_FOUND') {
      await load()
    } else {
      serverErrors.value = fieldErrorsFrom(apiError)
      if (!Object.keys(serverErrors.value).length) formError.value = apiError.message
    }
  } finally {
    saving.value = false
  }
}

const uploading = ref(false)
const uploadError = ref('')

async function onUpload(file: File) {
  if (uploading.value || !task.value) return
  uploading.value = true
  uploadError.value = ''
  try {
    task.value = await tasksApi.uploadAttachment(task.value.id, file) // trae la versión nueva
    notice.success('Archivo adjuntado.')
  } catch (err: unknown) {
    uploadError.value = toApiError(err).message
  } finally {
    uploading.value = false
  }
}

const confirmingDelete = ref(false)
const deleting = ref(false)

async function onDelete() {
  if (deleting.value || !task.value) return
  deleting.value = true
  try {
    await tasksApi.remove(task.value.id)
    notice.success(`Se eliminó «${task.value.title}».`)
    router.push({ name: 'tasks' })
  } catch (err: unknown) {
    const apiError = toApiError(err)
    if (apiError.code === 'UNAUTHORIZED') return // la sesión caducó: main.ts ya avisa y redirige
    notice.error(apiError.message)
    if (apiError.code === 'NOT_FOUND') router.push({ name: 'tasks' })
  } finally {
    deleting.value = false
    confirmingDelete.value = false
  }
}
</script>

<template>
  <section class="narrow">
    <h1 tabindex="-1">Editar tarea</h1>

    <StateMessage v-if="status === 'loading' && !task" type="loading" title="Cargando la tarea…" />

    <StateMessage
      v-else-if="status === 'error' && error?.status === 404"
      type="empty"
      title="Esta tarea no existe"
      description="Puede que se haya eliminado."
      action-label="Volver a mis tareas"
      @action="router.push({ name: 'tasks' })"
    />

    <StateMessage
      v-else-if="status === 'error'"
      type="error"
      title="No se pudo cargar la tarea"
      :description="
        error?.code === 'VALIDATION_ERROR'
          ? 'La dirección no corresponde a ninguna tarea.'
          : (error?.message ?? '')
      "
      action-label="Reintentar"
      @action="load"
    />

    <template v-else-if="task">
      <p v-if="readOnly" class="callout" role="status">
        Estás sin conexión. Puedes consultar la tarea, pero no cambiarla.
      </p>
      <p v-if="formError" class="callout callout--error" role="alert">{{ formError }}</p>

      <div class="card">
        <TaskForm
          :initial="task"
          show-status
          submit-label="Guardar cambios"
          :submitting="saving"
          :disabled="readOnly"
          :server-errors="serverErrors"
          @submit="onSave"
          @cancel="router.push({ name: 'tasks' })"
        />
      </div>

      <AttachmentUploader
        v-if="!fromSnapshot"
        :has-attachment="Boolean(task.attachment)"
        :download-url="tasksApi.attachmentUrl(task.id)"
        :uploading="uploading"
        :disabled="readOnly"
        :error-message="uploadError"
        @upload="onUpload"
      />

      <section v-if="!readOnly" class="card danger-zone" aria-labelledby="titulo-eliminar">
        <h2 id="titulo-eliminar">Eliminar tarea</h2>
        <p class="muted">Esta acción no se puede deshacer.</p>
        <button type="button" class="btn btn-danger" @click="confirmingDelete = true">
          Eliminar tarea
        </button>
      </section>
    </template>

    <ConfirmDialog
      :open="confirmingDelete"
      title="¿Eliminar esta tarea?"
      :message="task ? `«${task.title}» se borrará de forma definitiva.` : ''"
      confirm-label="Sí, eliminar"
      :busy="deleting"
      @confirm="onDelete"
      @cancel="confirmingDelete = false"
    />
  </section>
</template>
