<script setup lang="ts">
import { onMounted } from 'vue'
import { useLocationStore } from '../stores/location.store'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const locationStore = useLocationStore()

onMounted(async () => {
  await locationStore.fetchLocations()
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="locationStore.loading" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <LoadingSpinner />
    </div>
    <div v-else-if="locationStore.error" class="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-red-200">
      {{ locationStore.error }}
    </div>
    <div v-else class="grid gap-4 xl:grid-cols-2">
      <div v-for="location in locationStore.locations" :key="location.id_ubicacion" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">{{ location.departamento }}</p>
            <h3 class="mt-2 text-lg font-semibold text-white">{{ location.zona }}</h3>
          </div>
          <span :class="[
            'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
            location.nivel_riesgo === 'critical' ? 'border-red-500/30 bg-red-500/10 text-red-300' :
            location.nivel_riesgo === 'high' ? 'border-orange-500/30 bg-orange-500/10 text-orange-300' :
            location.nivel_riesgo === 'warning' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          ]">{{ location.nivel_riesgo }}</span>
        </div>
        <div class="mt-4 space-y-2 text-sm text-slate-300">
          <div class="flex justify-between"><span>Municipio</span><span class="text-white">{{ location.municipio }}</span></div>
          <div class="flex justify-between"><span>Sensores</span><span class="text-white">{{ location.sensores_instalados }}</span></div>
          <div class="flex justify-between"><span>Descripción</span><span class="text-white text-right">{{ location.descripcion }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>
