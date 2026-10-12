<script setup lang="ts">
import { computed } from 'vue'
import { usersMock } from '../mocks/users'

const stats = computed(() => ({
  totalUsers: usersMock.length,
  activeAlerts: 12,
  incidents: 7,
  audits: 36,
}))
</script>

<template>
  <div class="space-y-6 p-6">
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Super administrador</p>
      <h1 class="mt-2 text-3xl font-bold text-slate-900">Dashboard general</h1>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-slate-500">Usuarios</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">{{ stats.totalUsers }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-slate-500">Alertas</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">{{ stats.activeAlerts }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-slate-500">Incidentes</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">{{ stats.incidents }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-slate-500">Auditoría</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">{{ stats.audits }}</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">Resumen operativo</h2>
        <ul class="mt-4 space-y-3 text-sm text-slate-600">
          <li>• Monitoreo central activo.</li>
          <li>• 3 instituciones con respuesta disponible.</li>
          <li>• 2 ciudadanos con reportes pendientes.</li>
        </ul>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">Accesos rápidos</h2>
        <div class="mt-4 grid gap-2 text-sm font-medium text-slate-700">
          <button class="rounded-xl bg-slate-50 p-3 text-left">Usuarios del sistema</button>
          <button class="rounded-xl bg-slate-50 p-3 text-left">Alertas por validar</button>
          <button class="rounded-xl bg-slate-50 p-3 text-left">Auditoría reciente</button>
        </div>
      </div>
    </div>
  </div>
</template>
