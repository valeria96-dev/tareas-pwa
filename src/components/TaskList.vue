<script setup lang="ts">
// Recorre las tareas y reenvía hacia arriba los eventos de cada fila, indicando de qué tarea vienen.
import type { Task, TaskStatus } from '@/types'
import TaskItem from './TaskItem.vue'

withDefaults(
  defineProps<{
    tasks: Task[]
    pendingIds: Set<string>
    readOnly?: boolean
  }>(),
  { readOnly: false },
)
defineEmits<{
  'change-status': [task: Task, status: TaskStatus]
  delete: [task: Task]
}>()
</script>

<template>
  <ul class="task-list">
    <!-- key = id de MongoDB: es estable aunque la lista se filtre, se reordene o cambie -->
    <TaskItem
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      :pending="pendingIds.has(task.id)"
      :read-only="readOnly"
      @change-status="(status: TaskStatus) => $emit('change-status', task, status)"
      @delete="$emit('delete', task)"
    />
  </ul>
</template>

<style scoped>
.task-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
