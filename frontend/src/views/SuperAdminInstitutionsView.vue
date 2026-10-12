<script setup lang="ts">
import { computed, onMounted } from 'vue'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'
import { useInstitutionStore } from '../stores/institution.store'

const institutionStore = useInstitutionStore()

const institutions = computed(() => institutionStore.institutions)

onMounted(async () => {
  await institutionStore.fetchInstitutions()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-slate-900">Instituciones</h1>
      <button class="rounded-xl bg-[#f24a23] px-4 py-2.5 font-semibold text-white">+ Crear institución</button>
    </div>

    <div v-if="institutionStore.loading" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      Cargando instituciones...
    </div>

    <div v-else-if="institutionStore.error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ institutionStore.error }}
    </div>

    <div v-else class="grid gap-4 md:grid-cols-3">
      <div v-for="institution in institutions" :key="institution.id" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ institution.id }}</p>
        <h2 class="mt-2 text-xl font-bold text-slate-900">{{ institution.nombre }}</h2>
        <span class="mt-3 inline-block rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold uppercase text-green-700">{{ institution.estado }}</span>
      </div>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4">
        <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ubicación de instituciones</p>
        <h2 class="mt-1 text-xl font-semibold text-slate-900">Mapa de instituciones</h2>
      </div>
      <MonitoringMap
        :show-sensors="false"
        :show-incidents="false"
        :show-institutions="true"
        :show-reports="false"
        height-class="h-[400px]"
      />
    </section>
  </div>
</template>
