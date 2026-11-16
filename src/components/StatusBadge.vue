<script setup lang="ts">
import { statusLabel } from '@/constants/taskStatus'
import type { TaskStatus } from '@/types'

defineProps<{ status: TaskStatus }>()
</script>

<template>
  <span class="badge" :class="`badge--${status}`">{{ statusLabel(status) }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}
.badge--pendiente {
  background: #fff1d6;
  color: #7a4b00;
}
.badge--en_progreso {
  background: #e1ebff;
  color: #1d3fa8;
}
.badge--completada {
  background: #ddf3e4;
  color: #1b5e34;
}
</style>
