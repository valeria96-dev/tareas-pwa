<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="narrow">
    <h1 tabindex="-1">Página no encontrada</h1>
    <p>La dirección que abriste no existe en esta aplicación.</p>
    <RouterLink class="btn btn-primary" :to="{ name: 'tasks' }">Ir a mis tareas</RouterLink>
  </section>
</template>
