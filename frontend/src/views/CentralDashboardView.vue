<script setup lang="ts">
// Ruta antigua de Central: reutiliza la misma pantalla conectada a REST.
// Evita duplicar operaciones simuladas que no se guardan en el backend.
import SuperAdminDashboardView from './SuperAdminDashboardView.vue'
</script>
<template>
  <SuperAdminDashboardView />
</template>
