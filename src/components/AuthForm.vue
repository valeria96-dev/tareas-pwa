<script setup lang="ts">
// Formulario de usuario y contraseña. Sirve para iniciar sesión y para crear la cuenta:
// la vista le dice en qué modo está y recibe los datos validados.
import { ref, reactive, computed, watch, nextTick, useId } from 'vue'
import type { Credentials, FieldErrors } from '@/types'

const props = withDefaults(
  defineProps<{
    mode: 'login' | 'register'
    submitting?: boolean
    errorMessage?: string
    serverErrors?: FieldErrors
  }>(),
  { submitting: false, errorMessage: '', serverErrors: () => ({}) },
)
const emit = defineEmits<{ submit: [credentials: Credentials] }>()

const uid = useId()
const formEl = ref<HTMLFormElement | null>(null)
const form = reactive<Credentials>({ username: '', password: '' })
const localErrors = reactive({ username: '', password: '' })

const isRegister = computed(() => props.mode === 'register')
const errors = computed(() => ({
  username: localErrors.username || props.serverErrors.username || '',
  password: localErrors.password || props.serverErrors.password || '',
}))

// Las mismas reglas que valida la API.
function validate(): boolean {
  const username = form.username.trim()
  localErrors.username = /^[a-z0-9]{3,30}$/i.test(username)
    ? ''
    : 'El usuario debe tener entre 3 y 30 letras o números, sin espacios.'
  localErrors.password =
    form.password.length >= 6 ? '' : 'La contraseña debe tener al menos 6 caracteres.'
  return !localErrors.username && !localErrors.password
}

async function focusFirstError() {
  await nextTick()
  formEl.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}

function onSubmit() {
  if (props.submitting) return
  if (!validate()) {
    focusFirstError()
    return
  }
  emit('submit', { username: form.username.trim(), password: form.password })
}

// Al cambiar entre "entrar" y "crear cuenta" se limpian los mensajes anteriores.
watch(
  () => props.mode,
  () => {
    localErrors.username = ''
    localErrors.password = ''
  },
)
</script>

<template>
  <form ref="formEl" class="form" novalidate @submit.prevent="onSubmit">
    <p v-if="errorMessage" class="callout callout--error" role="alert">{{ errorMessage }}</p>

    <div class="field">
      <label :for="`${uid}-username`">Usuario</label>
      <input
        :id="`${uid}-username`"
        v-model="form.username"
        type="text"
        required
        autocomplete="username"
        autocapitalize="none"
        spellcheck="false"
        :aria-invalid="errors.username ? 'true' : 'false'"
        :aria-describedby="errors.username ? `${uid}-username-error` : undefined"
        @input="localErrors.username = ''"
      />
      <p v-if="errors.username" :id="`${uid}-username-error`" class="field-error">
        {{ errors.username }}
      </p>
    </div>

    <div class="field">
      <label :for="`${uid}-password`">Contraseña</label>
      <input
        :id="`${uid}-password`"
        v-model="form.password"
        type="password"
        required
        :autocomplete="isRegister ? 'new-password' : 'current-password'"
        :aria-invalid="errors.password ? 'true' : 'false'"
        :aria-describedby="errors.password ? `${uid}-password-error` : undefined"
        @input="localErrors.password = ''"
      />
      <p v-if="errors.password" :id="`${uid}-password-error`" class="field-error">
        {{ errors.password }}
      </p>
    </div>

    <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
      {{ submitting ? 'Enviando…' : isRegister ? 'Crear cuenta' : 'Iniciar sesión' }}
    </button>
  </form>
</template>
