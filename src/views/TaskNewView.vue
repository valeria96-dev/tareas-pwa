<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TaskForm from '@/components/TaskForm.vue'
import { useNotice } from '@/composables/useNotice'
import { useOnline } from '@/composables/useOnline'
import { tasksApi } from '@/services/tasks.api'
import { toApiError } from '@/services/http'
import { fieldErrorsFrom } from '@/services/apiErrors'
import type { FieldErrors, TaskInput } from '@/types'

const router = useRouter()
const notice = useNotice()
const { online } = useOnline()

const submitting = ref(false)
const serverErrors = ref<FieldErrors>({})
const errorMessage = ref('')

async function onSubmit(data: TaskInput) {
  submitting.value = true
  serverErrors.value = {}
  errorMessage.value = ''
  try {
    const task = await tasksApi.create(data)
    notice.success(`Se creó «${task.title}».`)
    router.push({ name: 'tasks' })
  } catch (err: unknown) {
    const error = toApiError(err)
    serverErrors.value = fieldErrorsFrom(error)
    if (!Object.keys(serverErrors.value).length) errorMessage.value = error.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="narrow">
    <h1 tabindex="-1">Nueva tarea</h1>

    <p v-if="!online" class="callout" role="status">
      Estás sin conexión. Podrás crear tareas cuando vuelva la red.
    </p>
    <p v-if="errorMessage" class="callout callout--error" role="alert">{{ errorMessage }}</p>

    <div class="card">
      <TaskForm
        submit-label="Crear tarea"
        :submitting="submitting"
        :disabled="!online"
        :server-errors="serverErrors"
        @submit="onSubmit"
        @cancel="router.push({ name: 'tasks' })"
      />
    </div>
  </section>
</template>
