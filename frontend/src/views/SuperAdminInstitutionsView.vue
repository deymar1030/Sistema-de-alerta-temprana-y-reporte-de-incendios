<script setup lang="ts">
const institutions = [
  { id: 'INS-001', nombre: 'Bomberos La Paz', estado: 'ACTIVA' },
  { id: 'INS-002', nombre: 'Protección Civil', estado: 'ACTIVA' },
  { id: 'INS-003', nombre: 'Policía de Tránsito', estado: 'INACTIVA' },
]
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-slate-900">Instituciones</h1>
      <button class="rounded-xl bg-[#f24a23] px-4 py-2.5 font-semibold text-white">+ Crear institución</button>
    </div>
    <div class="grid gap-4 md:grid-cols-3">
      <div v-for="institution in institutions" :key="institution.id" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ institution.id }}</p>
        <h2 class="mt-2 text-xl font-bold text-slate-900">{{ institution.nombre }}</h2>
        <span class="mt-3 inline-block rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold uppercase text-green-700">{{ institution.estado }}</span>
      </div>
    </div>
  </div>
</template>
