<script setup lang="ts">
// Muestra los estados de carga, vacío y error con el mismo aspecto en toda la app.
withDefaults(
  defineProps<{
    type: 'loading' | 'empty' | 'error'
    title: string
    description?: string
    actionLabel?: string
  }>(),
  { description: '', actionLabel: '' },
)
defineEmits<{ action: [] }>()
</script>

<template>
  <div class="state" :class="`state--${type}`" :role="type === 'error' ? 'alert' : 'status'">
    <span v-if="type === 'loading'" class="spinner" aria-hidden="true"></span>
    <p class="state-title">{{ title }}</p>
    <p v-if="description" class="state-text">{{ description }}</p>
    <button v-if="actionLabel" type="button" class="btn btn-secondary" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.state {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  text-align: center;
  background: var(--surface);
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
}
.state--error {
  border-color: var(--danger);
  border-style: solid;
}
.state-title {
  margin: 0;
  font-weight: 600;
}
.state-text {
  margin: 0;
  color: var(--muted);
  max-width: 40ch;
}
.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--line);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
