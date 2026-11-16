<script setup lang="ts">
// Formulario para crear y editar. Trabaja sobre una copia local de los datos
// y solo emite "submit" cuando pasan la validación; quien lo usa decide qué hacer con ellos.
import { ref, reactive, computed, watch, nextTick, useId } from 'vue'
import { TASK_STATUSES } from '@/constants/taskStatus'
import type { FieldErrors, TaskInput, TaskStatus } from '@/types'

const props = withDefaults(
  defineProps<{
    initial?: TaskInput
    showStatus?: boolean
    submitLabel?: string
    submitting?: boolean
    disabled?: boolean
    serverErrors?: FieldErrors // { title: 'mensaje', ... } devueltos por la API
  }>(),
  {
    initial: () => ({ title: '', description: '', status: 'pendiente' }),
    showStatus: false,
    submitLabel: 'Guardar',
    submitting: false,
    disabled: false,
    serverErrors: () => ({}),
  },
)
const emit = defineEmits<{
  submit: [data: TaskInput]
  cancel: []
}>()

const uid = useId()
const formEl = ref<HTMLFormElement | null>(null)

const form = reactive<{ title: string; description: string; status: TaskStatus }>({
  title: '',
  description: '',
  status: 'pendiente',
})
const localErrors = reactive({ title: '', description: '' })

// Copia los valores iniciales (y los vuelve a copiar si la vista recarga la tarea).
// Se observan los valores y no el objeto: si la vista actualiza otra parte de la tarea
// (por ejemplo, el adjunto), no se pierde lo que la persona estaba escribiendo.
watch(
  () => [props.initial.title, props.initial.description, props.initial.status] as const,
  ([title, description, status]) => {
    form.title = title ?? ''
    form.description = description ?? ''
    form.status = status ?? 'pendiente'
  },
  { immediate: true },
)

// Un error de la API sobre un campo se muestra igual que uno detectado aquí.
const errors = computed(() => ({
  title: localErrors.title || props.serverErrors.title || '',
  description: localErrors.description || props.serverErrors.description || '',
}))

// Las mismas reglas que valida la API (título 3–100, descripción hasta 500).
function validate(): boolean {
  const title = form.title.trim()
  localErrors.title =
    title.length < 3 || title.length > 100 ? 'El título debe tener entre 3 y 100 caracteres.' : ''
  localErrors.description =
    form.description.length > 500 ? 'La descripción admite máximo 500 caracteres.' : ''
  return !localErrors.title && !localErrors.description
}

async function focusFirstError() {
  await nextTick()
  formEl.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}

function onSubmit() {
  if (props.submitting || props.disabled) return
  if (!validate()) {
    focusFirstError()
    return
  }
  const data: TaskInput = { title: form.title.trim(), description: form.description }
  emit('submit', props.showStatus ? { ...data, status: form.status } : data)
}

watch(
  () => props.serverErrors,
  (serverErrors) => {
    if (serverErrors.title || serverErrors.description) focusFirstError()
  },
)
</script>

<template>
  <form ref="formEl" class="form" novalidate @submit.prevent="onSubmit">
    <div class="field">
      <label :for="`${uid}-title`">Título <span aria-hidden="true">*</span></label>
      <input
        :id="`${uid}-title`"
        v-model="form.title"
        type="text"
        required
        maxlength="100"
        autocomplete="off"
        :disabled="disabled"
        :aria-invalid="errors.title ? 'true' : 'false'"
        :aria-describedby="errors.title ? `${uid}-title-error` : undefined"
        @input="localErrors.title = ''"
      />
      <p v-if="errors.title" :id="`${uid}-title-error`" class="field-error">{{ errors.title }}</p>
    </div>

    <div class="field">
      <label :for="`${uid}-description`">Descripción (opcional)</label>
      <textarea
        :id="`${uid}-description`"
        v-model="form.description"
        rows="4"
        :disabled="disabled"
        :aria-invalid="errors.description ? 'true' : 'false'"
        :aria-describedby="`${uid}-description-help`"
        @input="localErrors.description = ''"
      ></textarea>
      <p :id="`${uid}-description-help`" class="field-help">
        <span v-if="errors.description" class="field-error">{{ errors.description }} </span>
        {{ form.description.length }} de 500 caracteres
      </p>
    </div>

    <div v-if="showStatus" class="field">
      <label :for="`${uid}-status`">Estado</label>
      <select :id="`${uid}-status`" v-model="form.status" :disabled="disabled">
        <option v-for="status in TASK_STATUSES" :key="status.value" :value="status.value">
          {{ status.label }}
        </option>
      </select>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn btn-primary" :disabled="submitting || disabled">
        {{ submitting ? 'Guardando…' : submitLabel }}
      </button>
      <button type="button" class="btn btn-secondary" @click="emit('cancel')">Cancelar</button>
    </div>
  </form>
</template>
