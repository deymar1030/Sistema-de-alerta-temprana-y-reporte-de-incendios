<script setup lang="ts">
const incidents = [
  { id: 'INC-01', location: 'La Paz centro', status: 'EN_VALIDACION' },
  { id: 'INC-02', location: 'Cochabamba norte', status: 'DESPACHADA' },
  { id: 'INC-03', location: 'Santa Cruz sur', status: 'FINALIZADA' },
]
</script>

<template>
  <div class="space-y-6 p-6">
    <h1 class="text-3xl font-bold text-slate-900">Incidentes</h1>
    <div class="space-y-3">
      <div v-for="incident in incidents" :key="incident.id" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-lg font-bold text-slate-900">{{ incident.id }}</p>
          <span class="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-700">{{ incident.status }}</span>
        </div>
        <p class="mt-2 text-sm text-slate-600">{{ incident.location }}</p>
      </div>
    </div>
  </div>
</template>
