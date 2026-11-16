<script setup lang="ts">
// Adjunto de una tarea: muestra el enlace de descarga y deja elegir un archivo nuevo.
// Revisa tipo y tamaño antes de enviar para no gastar una petición que la API va a rechazar.
import { ref, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    hasAttachment: boolean
    downloadUrl: string
    uploading?: boolean
    disabled?: boolean
    errorMessage?: string
  }>(),
  { uploading: false, disabled: false, errorMessage: '' },
)
const emit = defineEmits<{ upload: [file: File] }>()

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_BYTES = 2 * 1024 * 1024

const uid = useId()
const localError = ref('')

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // permite volver a elegir el mismo archivo
  if (!file || props.uploading) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    localError.value = 'Solo se permiten archivos JPG, PNG o PDF.'
  } else if (file.size > MAX_BYTES) {
    localError.value = 'El archivo supera el tamaño máximo de 2 MB.'
  } else {
    localError.value = ''
    emit('upload', file)
  }
}
</script>

<template>
  <section class="card" :aria-labelledby="`${uid}-title`">
    <h2 :id="`${uid}-title`">Archivo adjunto</h2>

    <p v-if="hasAttachment">
      <a :href="downloadUrl" target="_blank" rel="noopener"
        >Ver el archivo adjunto<span class="sr-only"> (se abre en otra pestaña)</span></a
      >
    </p>
    <p v-else class="muted">Esta tarea todavía no tiene archivo.</p>

    <div class="field">
      <label :for="`${uid}-file`">{{
        hasAttachment ? 'Reemplazar archivo' : 'Subir archivo'
      }}</label>
      <input
        :id="`${uid}-file`"
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        :disabled="disabled || uploading"
        :aria-describedby="`${uid}-help`"
        @change="onFileChange"
      />
      <p :id="`${uid}-help`" class="field-help">JPG, PNG o PDF de hasta 2 MB.</p>
    </div>

    <p v-if="uploading" role="status">Subiendo archivo…</p>
    <p v-if="localError || errorMessage" class="field-error" role="alert">
      {{ localError || errorMessage }}
    </p>
  </section>
</template>
