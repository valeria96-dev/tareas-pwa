<script setup lang="ts">
// Filtro por estado. No guarda nada: recibe el valor elegido y avisa cuando cambia (v-model).
import { TASK_STATUSES } from '@/constants/taskStatus'
import type { StatusFilter } from '@/types'

defineProps<{
  modelValue: StatusFilter
  counts: Partial<Record<StatusFilter, number>> // { todas: 5, pendiente: 2, ... }
}>()
defineEmits<{ 'update:modelValue': [value: StatusFilter] }>()

const options: { value: StatusFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  ...TASK_STATUSES,
]
</script>

<template>
  <div class="filter" role="group" aria-label="Filtrar tareas por estado">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="chip"
      :aria-pressed="modelValue === option.value"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }} <span class="chip-count">{{ counts[option.value] ?? 0 }}</span>
    </button>
  </div>
</template>

<style scoped>
.filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.chip {
  min-height: 44px;
  padding: 0 0.9rem;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  cursor: pointer;
}
.chip[aria-pressed='true'] {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.chip-count {
  margin-left: 0.25rem;
  font-size: 0.85rem;
  opacity: 0.85;
}
</style>
