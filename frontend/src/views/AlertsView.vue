<script setup lang="ts">
import { onMounted } from 'vue'
import { useAlertStore } from '../stores/alert.store'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const alertStore = useAlertStore()

onMounted(async () => {
  await alertStore.fetchAlerts()
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="alertStore.loading" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <LoadingSpinner />
    </div>
    <div v-else-if="alertStore.error" class="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-red-200">
      {{ alertStore.error }}
    </div>
    <div v-else class="grid gap-4 lg:grid-cols-3">
      <div v-for="alert in alertStore.alerts" :key="alert.id_alerta" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">{{ alert.id_alerta }}</p>
            <h3 class="mt-2 text-lg font-semibold text-white">{{ alert.sensor }}</h3>
          </div>
          <span :class="[
            'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
            alert.nivel === 'CRÍTICO' ? 'border-red-500/30 bg-red-500/10 text-red-300' :
            alert.nivel === 'ALTO' ? 'border-orange-500/30 bg-orange-500/10 text-orange-300' : alert.nivel === 'MEDIO' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-slate-500/20 bg-slate-500/10 text-slate-200'
          ]">{{ alert.nivel }}</span>
        </div>
        <div class="mt-4 space-y-2 text-sm text-slate-300">
          <div class="flex justify-between"><span>Fecha</span><span class="text-white">{{ alert.fecha }}</span></div>
          <div class="flex justify-between"><span>Hora</span><span class="text-white">{{ alert.hora }}</span></div>
          <div class="flex justify-between"><span>Estado</span><span class="text-white">{{ alert.estado }}</span></div>
          <div class="flex justify-between"><span>Sensor</span><span class="text-white">{{ alert.id_sensor }}</span></div>
          <div class="flex justify-between"><span>Ubicación</span><span class="text-white">{{ alert.ubicacion }}</span></div>
        </div>
        <p class="mt-4 text-sm text-slate-300">{{ alert.descripcion }}</p>
      </div>
    </div>
  </div>
</template>
