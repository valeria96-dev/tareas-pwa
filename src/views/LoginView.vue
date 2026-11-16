<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthForm from '@/components/AuthForm.vue'
import { useSession } from '@/composables/useSession'
import { toApiError } from '@/services/http'
import { fieldErrorsFrom } from '@/services/apiErrors'
import type { Credentials, FieldErrors } from '@/types'

const route = useRoute()
const router = useRouter()
const { login, register } = useSession()

const mode = ref<'login' | 'register'>('login')
const submitting = ref(false)
const errorMessage = ref('')
const serverErrors = ref<FieldErrors>({})

const isRegister = computed(() => mode.value === 'register')

function toggleMode() {
  mode.value = isRegister.value ? 'login' : 'register'
  errorMessage.value = ''
  serverErrors.value = {}
}

async function onSubmit(credentials: Credentials) {
  submitting.value = true
  errorMessage.value = ''
  serverErrors.value = {}
  try {
    await (isRegister.value ? register(credentials) : login(credentials))
    // Vuelve a la página que se quería abrir antes de iniciar sesión (solo rutas internas).
    const back = typeof route.query.volver === 'string' ? route.query.volver : ''
    router.replace(back.startsWith('/') && !back.startsWith('//') ? back : { name: 'tasks' })
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
  <section class="auth card">
    <h1 tabindex="-1">{{ isRegister ? 'Crea tu cuenta' : 'Inicia sesión' }}</h1>
    <p class="muted">
      {{
        isRegister
          ? 'Elige un usuario y una contraseña para guardar tus tareas.'
          : 'Entra para ver y organizar tus tareas.'
      }}
    </p>

    <AuthForm
      :mode="mode"
      :submitting="submitting"
      :error-message="errorMessage"
      :server-errors="serverErrors"
      @submit="onSubmit"
    />

    <p class="auth-switch">
      {{ isRegister ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?' }}
      <button type="button" class="link-button" @click="toggleMode">
        {{ isRegister ? 'Inicia sesión' : 'Crea una cuenta' }}
      </button>
    </p>
  </section>
</template>

<style scoped>
.auth {
  max-width: 26rem;
  margin: 1rem auto;
}
.auth h1 {
  margin-top: 0;
}
.auth-switch {
  margin: 1rem 0 0;
  text-align: center;
}
</style>
