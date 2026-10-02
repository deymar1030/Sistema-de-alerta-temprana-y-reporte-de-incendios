<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Filter } from 'lucide-vue-next'
import { useReadingStore } from '../stores/reading.store'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const readingStore = useReadingStore()
const sensorFilter = ref('Todos')
const variableFilter = ref('Todas')
const stateFilter = ref('Todos')

const filteredReadings = computed(() => {
  return readingStore.readings.filter((reading) => {
    const sensorMatch = sensorFilter.value === 'Todos' || reading.sensor.includes(sensorFilter.value)
    const variableMatch = variableFilter.value === 'Todas' || reading.variable === variableFilter.value
    const stateMatch = stateFilter.value === 'Todos' || reading.estado === stateFilter.value
    return sensorMatch && variableMatch && stateMatch
  })
})

const sensorOptions = computed(() => ['Todos', ...new Set(readingStore.readings.map((reading) => reading.sensor))])
const variableOptions = computed(() => ['Todas', 'temperatura', 'humo', 'co'])

onMounted(async () => {
  await readingStore.fetchReadings()
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="readingStore.loading" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <LoadingSpinner />
    </div>
    <div v-else-if="readingStore.error" class="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-red-200">
      {{ readingStore.error }}
    </div>
    <div v-else class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
          <Filter class="h-4 w-4" /> Historial de mediciones
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <select v-model="sensorFilter" class="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100">
            <option v-for="option in sensorOptions" :key="option" :value="option">{{ option }}</option>
          </select>
          <select v-model="variableFilter" class="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100">
            <option v-for="option in variableOptions" :key="option" :value="option">{{ option === 'Todas' ? 'Todas' : option }}</option>
          </select>
          <select v-model="stateFilter" class="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100">
            <option>Todos</option>
            <option>Normal</option>
            <option>Advertencia</option>
            <option>Alerta</option>
            <option>Crítico</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm text-slate-300">
          <thead class="text-[10px] uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th class="pb-3">ID</th>
              <th class="pb-3">Sensor</th>
              <th class="pb-3">Variable</th>
              <th class="pb-3">Valor</th>
              <th class="pb-3">Unidad</th>
              <th class="pb-3">Fecha/Hora</th>
              <th class="pb-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reading in filteredReadings" :key="reading.id_lectura" class="border-t border-slate-800">
              <td class="py-3 text-white">{{ reading.id_lectura }}</td>
              <td class="py-3">{{ reading.sensor }}</td>
              <td class="py-3 capitalize">{{ reading.variable }}</td>
              <td class="py-3 text-white">{{ reading.valor }}</td>
              <td class="py-3">{{ reading.unidad }}</td>
              <td class="py-3">{{ new Date(reading.fecha_hora).toLocaleString('es-BO') }}</td>
              <td class="py-3">
                <span :class="[
                  'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                  reading.estado === 'Normal' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' :
                  reading.estado === 'Advertencia' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' :
                  reading.estado === 'Alerta' ? 'border-orange-500/30 bg-orange-500/10 text-orange-300' : 'border-red-500/30 bg-red-500/10 text-red-300'
                ]">
                  {{ reading.estado }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
