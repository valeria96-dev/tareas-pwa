<script setup lang="ts">
// Diálogo de confirmación sobre el elemento <dialog> nativo: atrapa el foco,
// se cierra con Esc y devuelve el foco al botón que lo abrió.
import { ref, watch, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message?: string
    confirmLabel?: string
    busy?: boolean
  }>(),
  { message: '', confirmLabel: 'Aceptar', busy: false },
)
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const dialogEl = ref<HTMLDialogElement | null>(null)

function sync(open: boolean) {
  const dialog = dialogEl.value
  if (!dialog) return
  if (open && !dialog.open) dialog.showModal()
  if (!open && dialog.open) dialog.close()
}

onMounted(() => sync(props.open))
watch(() => props.open, sync)
</script>

<template>
  <!-- "cancel" es el evento de la tecla Esc: se avisa al padre en vez de cerrar por cuenta propia -->
  <dialog
    ref="dialogEl"
    class="dialog"
    aria-labelledby="dialog-title"
    @cancel.prevent="emit('cancel')"
  >
    <h2 id="dialog-title">{{ title }}</h2>
    <p v-if="message">{{ message }}</p>
    <div class="form-actions">
      <button type="button" class="btn btn-danger-solid" :disabled="busy" @click="emit('confirm')">
        {{ busy ? 'Un momento…' : confirmLabel }}
      </button>
      <!-- autofocus: al abrir, el foco cae en la opción que no borra nada -->
      <button
        type="button"
        class="btn btn-secondary"
        autofocus
        :disabled="busy"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(26rem, calc(100vw - 2rem));
  padding: 1.25rem;
  border: 0;
  border-radius: var(--radius);
  color: var(--ink);
  box-shadow: 0 20px 50px rgb(0 0 0 / 0.25);
}
.dialog::backdrop {
  background: rgb(20 24 40 / 0.5);
}
.dialog h2 {
  margin-top: 0;
}
</style>
