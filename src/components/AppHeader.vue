<script setup lang="ts">
// Cabecera: marca, navegación y sesión. Recibe todo por props y avisa con eventos;
// no conoce la API ni el estado compartido.
import { RouterLink } from 'vue-router'
import type { User } from '@/types'

withDefaults(
  defineProps<{
    user: User | null
    online: boolean
    canInstall?: boolean
    loggingOut?: boolean
  }>(),
  { canInstall: false, loggingOut: false },
)
defineEmits<{ logout: []; install: [] }>()
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <RouterLink class="brand" :to="{ name: user ? 'tasks' : 'login' }">
        <img src="/favicon.svg" alt="" width="28" height="28" />
        Mis Tareas
      </RouterLink>

      <nav v-if="user" aria-label="Principal">
        <ul class="nav">
          <li><RouterLink :to="{ name: 'tasks' }">Tareas</RouterLink></li>
          <li><RouterLink :to="{ name: 'task-new' }">Nueva tarea</RouterLink></li>
        </ul>
      </nav>

      <div class="header-tools">
        <span class="connection" :class="{ 'connection--off': !online }" role="status">
          {{ online ? 'En línea' : 'Sin conexión' }}
        </span>
        <button
          v-if="canInstall"
          type="button"
          class="btn btn-secondary btn-small"
          @click="$emit('install')"
        >
          Instalar app
        </button>
        <template v-if="user">
          <span v-if="user.username" class="username">{{ user.username }}</span>
          <button
            type="button"
            class="btn btn-secondary btn-small"
            :disabled="loggingOut"
            @click="$emit('logout')"
          >
            Cerrar sesión
          </button>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
.header-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  max-width: var(--content);
  margin: 0 auto;
  padding: 0.5rem 1rem;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--ink);
  text-decoration: none;
}
.nav {
  display: flex;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.nav a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 0.75rem;
  border-radius: 8px;
  color: var(--ink);
  text-decoration: none;
}
.nav a.router-link-exact-active {
  background: var(--primary-soft);
  color: var(--primary-strong);
  font-weight: 600;
}
.header-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}
.connection {
  font-size: 0.85rem;
  color: var(--ok);
}
.connection::before {
  content: '● ';
}
.connection--off {
  color: var(--danger);
  font-weight: 600;
}
.username {
  font-size: 0.9rem;
  color: var(--muted);
}

/* En celular la navegación ocupa su propia fila, debajo de la marca. */
@media (max-width: 767px) {
  nav {
    order: 3;
    width: 100%;
  }
  .nav a {
    flex: 1;
  }
  .username {
    display: none;
  }
}
</style>
