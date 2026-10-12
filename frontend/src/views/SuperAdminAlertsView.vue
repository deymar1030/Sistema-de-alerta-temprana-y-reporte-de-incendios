<script setup lang="ts">
const alerts = [
  { id: 'ALT-001', location: 'Av. Busch, La Paz', risk: 'ALTA', status: 'ACTIVA' },
  { id: 'ALT-002', location: 'Santa Cruz centro', risk: 'MEDIA', status: 'EN_REVISION' },
  { id: 'ALT-003', location: 'Cochabamba sur', risk: 'CRITICA', status: 'ACTIVA' },
]
</script>

<template>
  <div class="space-y-6 p-6">
    <h1 class="text-3xl font-bold text-slate-900">Alertas</h1>
    <div class="space-y-3">
      <div v-for="alert in alerts" :key="alert.id" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-lg font-bold text-slate-900">{{ alert.id }}</p>
          <span class="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold uppercase text-red-700">{{ alert.status }}</span>
        </div>
        <p class="mt-2 text-sm text-slate-600">{{ alert.location }}</p>
        <p class="mt-1 text-sm font-medium text-orange-600">Riesgo: {{ alert.risk }}</p>
      </div>
    </div>
  </div>
</template>
