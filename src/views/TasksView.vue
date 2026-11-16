<script setup lang="ts">
// Vista de la lista. Es la dueña de las tareas: las carga, las filtra y es la única
// que llama a la API cuando una fila pide cambiar de estado o eliminarse.
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import TaskFilter from '@/components/TaskFilter.vue'
import TaskList from '@/components/TaskList.vue'
import StateMessage from '@/components/StateMessage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useTasks } from '@/composables/useTasks'
import { useSession } from '@/composables/useSession'
import { useNotice } from '@/composables/useNotice'
import { useOnline } from '@/composables/useOnline'
import { tasksApi } from '@/services/tasks.api'
import { toApiError } from '@/services/http'
import { TASK_STATUSES, statusLabel } from '@/constants/taskStatus'
import type { StatusFilter, Task, TaskStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const { session } = useSession()
const notice = useNotice()
const { online } = useOnline()
const { tasks, status, error, staleSince, load, replace, remove } = useTasks(session.user?.id ?? '')

// La carga se inicia cuando el componente ya está montado en el DOM.
onMounted(load)

// Sin red, o viendo la copia local, la lista es de solo lectura.
const readOnly = computed(() => !online.value || Boolean(staleSince.value))
const staleDate = computed(() =>
  staleSince.value
    ? new Date(staleSince.value).toLocaleString('es-EC', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '',
)

// El filtro vive en la URL (?estado=pendiente): se conserva al recargar y al usar "atrás".
const filter = computed<StatusFilter>({
  get: () => TASK_STATUSES.find((option) => option.value === route.query.estado)?.value ?? 'todas',
  set: (value) => {
    router.replace({ query: value === 'todas' ? {} : { estado: value } })
  },
})

const counts = computed(() => {
  const result: Partial<Record<StatusFilter, number>> = { todas: tasks.value.length }
  for (const task of tasks.value) result[task.status] = (result[task.status] ?? 0) + 1
  return result
})

const visibleTasks = computed(() =>
  filter.value === 'todas'
    ? tasks.value
    : tasks.value.filter((task) => task.status === filter.value),
)

// Control de concurrencia por tarea: mientras una tiene una petición en curso, sus
// controles se bloquean. Así no salen dos cambios con la misma versión.
const pendingIds = ref(new Set<string>())
function setPending(id: string, pending: boolean) {
  const next = new Set(pendingIds.value)
  if (pending) next.add(id)
  else next.delete(id)
  pendingIds.value = next
}

// Otro dispositivo cambió o borró la tarea: se avisa y se trae la lista actual.
async function handleMutationError(err: unknown) {
  const apiError = toApiError(err)
  if (apiError.code === 'UNAUTHORIZED') return // la sesión caducó: main.ts ya avisa y redirige
  notice.error(apiError.message)
  if (apiError.code === 'VERSION_CONFLICT' || apiError.code === 'NOT_FOUND') await load()
}

async function changeStatus(task: Task, nextStatus: TaskStatus) {
  if (pendingIds.value.has(task.id) || nextStatus === task.status) return
  setPending(task.id, true)
  try {
    replace(await tasksApi.update(task.id, { status: nextStatus }, task.version))
    notice.success(`«${task.title}» pasó a ${statusLabel(nextStatus).toLowerCase()}.`)
  } catch (err: unknown) {
    await handleMutationError(err)
  } finally {
    setPending(task.id, false)
  }
}

const taskToDelete = ref<Task | null>(null)
const deleting = ref(false)

async function confirmDelete() {
  const task = taskToDelete.value
  if (!task || deleting.value) return
  deleting.value = true
  setPending(task.id, true)
  try {
    await tasksApi.remove(task.id)
    remove(task.id)
    notice.success(`Se eliminó «${task.title}».`)
  } catch (err: unknown) {
    await handleMutationError(err)
  } finally {
    setPending(task.id, false)
    deleting.value = false
    taskToDelete.value = null
  }
}
</script>

<template>
  <section>
    <div class="page-head">
      <h1 tabindex="-1">Mis tareas</h1>
      <RouterLink v-if="!readOnly" class="btn btn-primary" :to="{ name: 'task-new' }"
        >Nueva tarea</RouterLink
      >
    </div>

    <p v-if="staleSince" class="callout" role="status">
      No hay conexión con el servidor. Estás viendo la copia guardada el {{ staleDate }}, solo para
      lectura.
      <button type="button" class="link-button" @click="load">Reintentar</button>
    </p>
    <p v-else-if="!online" class="callout" role="status">
      Estás sin conexión. Podrás hacer cambios cuando vuelva la red.
    </p>

    <StateMessage
      v-if="status === 'loading' && !tasks.length"
      type="loading"
      title="Cargando tus tareas…"
    />

    <StateMessage
      v-else-if="status === 'error'"
      type="error"
      title="No se pudieron cargar las tareas"
      :description="error?.message ?? ''"
      action-label="Reintentar"
      @action="load"
    />

    <StateMessage
      v-else-if="!tasks.length"
      type="empty"
      title="Aún no tienes tareas"
      description="Crea la primera y aparecerá aquí."
      :action-label="readOnly ? '' : 'Crear una tarea'"
      @action="router.push({ name: 'task-new' })"
    />

    <template v-else>
      <TaskFilter v-model="filter" :counts="counts" />

      <p class="sr-only" role="status">
        Mostrando {{ visibleTasks.length }} de {{ tasks.length }} tareas.
      </p>

      <StateMessage
        v-if="!visibleTasks.length"
        type="empty"
        :title="`No hay tareas en «${statusLabel(filter)}»`"
        action-label="Ver todas"
        @action="filter = 'todas'"
      />
      <TaskList
        v-else
        :tasks="visibleTasks"
        :pending-ids="pendingIds"
        :read-only="readOnly"
        :aria-busy="status === 'loading'"
        @change-status="changeStatus"
        @delete="(task: Task) => (taskToDelete = task)"
      />
    </template>

    <ConfirmDialog
      :open="Boolean(taskToDelete)"
      title="¿Eliminar esta tarea?"
      :message="taskToDelete ? `«${taskToDelete.title}» se borrará de forma definitiva.` : ''"
      confirm-label="Sí, eliminar"
      :busy="deleting"
      @confirm="confirmDelete"
      @cancel="taskToDelete = null"
    />
  </section>
</template>
