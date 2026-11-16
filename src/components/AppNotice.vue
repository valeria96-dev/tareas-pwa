<script setup lang="ts">
// Aviso global de éxito o error. La región aria-live existe siempre,
// para que el lector de pantalla anuncie cada mensaje nuevo.
withDefaults(defineProps<{ message?: string; type?: 'success' | 'error' }>(), {
  message: '',
  type: 'success',
})
defineEmits<{ dismiss: [] }>()
</script>

<template>
  <div class="notice-region" aria-live="polite">
    <div v-if="message" class="notice" :class="`notice--${type}`">
      <p>{{ message }}</p>
      <button
        type="button"
        class="notice-close"
        aria-label="Cerrar aviso"
        @click="$emit('dismiss')"
      >
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.notice-region {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  z-index: 10;
  display: flex;
  justify-content: center;
  pointer-events: none;
}
.notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 32rem;
  padding: 0.25rem 0.25rem 0.25rem 1rem;
  border-radius: var(--radius);
  background: #1b5e34;
  color: #fff;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.2);
  pointer-events: auto;
}
.notice--error {
  background: #a3221b;
}
.notice p {
  margin: 0;
}
.notice-close {
  width: 44px;
  height: 44px;
  border: 0;
  background: none;
  color: inherit;
  font-size: 1.5rem;
  cursor: pointer;
}
</style>
