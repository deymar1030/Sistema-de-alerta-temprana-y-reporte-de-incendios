<script setup lang="ts">
const settings = [
  'Permisos globales del sistema',
  'Configuración de alertas y notificaciones',
  'Integración con instituciones',
  'Parámetros de seguridad',
]
</script>

<template>
  <div class="space-y-6 p-6">
    <h1 class="text-3xl font-bold text-slate-900">Configuración</h1>
    <div class="space-y-3">
      <div v-for="(setting, index) in settings" :key="index" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm font-medium text-slate-700">{{ setting }}</p>
      </div>
    </div>
  </div>
</template>
