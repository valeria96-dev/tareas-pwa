<script setup lang="ts">
// Una fila de la lista. Solo muestra la tarea y avisa de lo que la persona quiere hacer;
// nunca modifica la tarea que recibe ni llama a la API.
import { computed, useId } from 'vue'
import { RouterLink } from 'vue-router'
import { TASK_STATUSES } from '@/constants/taskStatus'
import type { Task, TaskStatus } from '@/types'
import StatusBadge from './StatusBadge.vue'

const props = withDefaults(
  defineProps<{
    task: Task
    pending?: boolean // hay una petición en curso para esta tarea
    readOnly?: boolean // sin conexión: no se puede cambiar nada
  }>(),
  { pending: false, readOnly: false },
)
const emit = defineEmits<{
  'change-status': [status: TaskStatus]
  delete: []
}>()

const selectId = useId()
const updatedAt = computed(() =>
  new Date(props.task.updatedAt).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
)

function onStatusChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const next = select.value as TaskStatus
  // El select vuelve al valor de la prop: solo cambiará cuando la API confirme el nuevo estado.
  select.value = props.task.status
  emit('change-status', next)
}
</script>

<template>
  <li class="task" :aria-busy="pending">
    <div class="task-main">
      <RouterLink class="task-title" :to="{ name: 'task-detail', params: { id: task.id } }">
        {{ task.title }}
      </RouterLink>
      <p v-if="task.description" class="task-description">{{ task.description }}</p>
      <p class="task-meta">
        <StatusBadge :status="task.status" />
        <span>Actualizada el {{ updatedAt }}</span>
        <span v-if="task.attachment">Con adjunto</span>
      </p>
    </div>

    <div v-if="!readOnly" class="task-actions">
      <label :for="selectId" class="sr-only">Estado de «{{ task.title }}»</label>
      <select :id="selectId" :value="task.status" :disabled="pending" @change="onStatusChange">
        <option v-for="status in TASK_STATUSES" :key="status.value" :value="status.value">
          {{ status.label }}
        </option>
      </select>
      <button type="button" class="btn btn-danger" :disabled="pending" @click="emit('delete')">
        Eliminar<span class="sr-only"> «{{ task.title }}»</span>
      </button>
    </div>
  </li>
</template>

<style scoped>
.task {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.task[aria-busy='true'] {
  opacity: 0.6;
}
.task-main {
  min-width: 0;
}
.task-title {
  font-weight: 600;
  font-size: 1.05rem;
  overflow-wrap: anywhere;
}
.task-description {
  margin: 0.25rem 0 0;
  color: var(--muted);
  overflow-wrap: anywhere;
}
.task-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.75rem;
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: var(--muted);
}
.task-actions {
  display: flex;
  gap: 0.5rem;
}
.task-actions select {
  flex: 1;
  min-width: 0;
}

@media (min-width: 768px) {
  .task {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
  .task-actions select {
    flex: none;
    width: 10.5rem;
  }
}
</style>
