<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Activity, RefreshCw, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useReadingStore } from '../stores/reading.store'

const store = useReadingStore()
const sensorFilter = ref('Todos')
const variableFilter = ref('Todas')
const stateFilter = ref('Todos')
const filtered = computed(() => store.readings.filter((r) =>
  (sensorFilter.value === 'Todos' || r.sensor === sensorFilter.value) &&
  (variableFilter.value === 'Todas' || r.variable === variableFilter.value) &&
  (stateFilter.value === 'Todos' || r.estado === stateFilter.value),
))
const sensorOptions = computed(() => ['Todos', ...new Set(store.readings.map((r) => r.sensor))])
const variableOptions = computed(() => ['Todas', ...new Set(store.readings.map((r) => r.variable))])
const statusLabel: Record<string, string> = { VALIDA: 'Válida', ANOMALA: 'Anómala', INVALIDA: 'Inválida', DESCONOCIDO: 'Desconocido' }
const statusClass: Record<string, string> = {
  VALIDA: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  ANOMALA: 'bg-amber-50 border-amber-200 text-amber-800',
  INVALIDA: 'bg-rose-50 border-rose-200 text-rose-800',
  DESCONOCIDO: 'bg-slate-100 border-slate-200 text-slate-700',
}
function dateLabel(date: string) {
  const value = new Date(date)
  return Number.isNaN(value.getTime()) ? 'Fecha no disponible' : value.toLocaleString('es-BO')
}
onMounted(() => { void store.fetchReadings() })
</script>

<template>
  <div class="admin-page mx-auto max-w-[1600px] space-y-5">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0"><p class="text-xs font-bold uppercase tracking-widest text-orange-600">Monitoreo</p><h1 class="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Lecturas de sensores</h1><p class="mt-2 text-sm text-slate-600">Mediciones del backend, con su estado original y paginación.</p></div>
      <button type="button" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50" :disabled="store.loading" @click="store.fetchReadings()"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': store.loading }"/> Actualizar</button>
    </header>
    <section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
        <div class="flex items-center gap-2"><Activity class="h-5 w-5 shrink-0 text-orange-600"/><h2 class="text-base font-bold text-slate-900">Historial de mediciones</h2></div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label class="min-w-0 text-xs font-semibold text-slate-600">Sensor<select v-model="sensorFilter" class="form-input mt-1 text-sm"><option v-for="option in sensorOptions" :key="option">{{ option }}</option></select></label>
          <label class="min-w-0 text-xs font-semibold text-slate-600">Variable<select v-model="variableFilter" class="form-input mt-1 text-sm"><option v-for="option in variableOptions" :key="option">{{ option }}</option></select></label>
          <label class="min-w-0 text-xs font-semibold text-slate-600"><SlidersHorizontal class="mr-1 inline h-3.5 w-3.5"/> Estado<select v-model="stateFilter" class="form-input mt-1 text-sm"><option>Todos</option><option value="VALIDA">Válida</option><option value="ANOMALA">Anómala</option><option value="INVALIDA">Inválida</option><option value="DESCONOCIDO">Desconocido</option></select></label>
        </div>
        <p class="text-xs text-slate-500">Los filtros se aplican a los resultados de la página actual.</p>
      </div>
      <div v-if="store.loading" role="status" class="p-10 text-center text-sm text-slate-600">Cargando lecturas...</div>
      <div v-else-if="store.error" role="alert" class="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ store.error }}</div>
      <div v-else-if="!filtered.length" class="p-10 text-center text-sm text-slate-500">No hay mediciones que coincidan con los filtros.</div>
      <template v-else>
        <div class="grid gap-3 p-4 sm:hidden">
          <article v-for="reading in filtered" :key="reading.id_lectura" class="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex flex-wrap items-start justify-between gap-2"><strong class="min-w-0 break-words text-sm text-slate-900">{{ reading.sensor }}</strong><span class="shrink-0 rounded-full border px-2 py-1 text-xs font-bold" :class="statusClass[reading.estado]">{{ statusLabel[reading.estado] }}</span></div>
            <p class="mt-2 text-xl font-extrabold text-slate-900">{{ reading.valor }} <span class="text-sm font-normal text-slate-500">{{ reading.unidad }}</span></p>
            <p class="mt-1 text-sm text-slate-600">{{ reading.variable }} · {{ dateLabel(reading.fecha_hora) }}</p>
            <p class="mt-1 break-all text-xs text-slate-500">Lectura #{{ reading.id_lectura }}</p>
          </article>
        </div>
        <div class="hidden overflow-x-auto sm:block">
          <table class="w-full min-w-[720px] table-auto text-left text-sm text-slate-700">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th class="px-4 py-3">ID</th><th class="px-4 py-3">Sensor</th><th class="px-4 py-3">Variable</th><th class="px-4 py-3">Medición</th><th class="px-4 py-3">Fecha y hora</th><th class="px-4 py-3">Estado</th></tr></thead>
            <tbody><tr v-for="reading in filtered" :key="reading.id_lectura" class="border-t border-slate-100 hover:bg-orange-50/30"><td class="px-4 py-3 font-medium">{{ reading.id_lectura }}</td><td class="max-w-44 break-words px-4 py-3">{{ reading.sensor }}</td><td class="px-4 py-3">{{ reading.variable }}</td><td class="px-4 py-3 font-semibold">{{ reading.valor }} <span class="font-normal text-slate-500">{{ reading.unidad }}</span></td><td class="px-4 py-3">{{ dateLabel(reading.fecha_hora) }}</td><td class="px-4 py-3"><span class="inline-block rounded-full border px-2.5 py-1 text-xs font-bold" :class="statusClass[reading.estado]">{{ statusLabel[reading.estado] }}</span></td></tr></tbody>
          </table>
        </div>
      </template>
      <footer class="flex flex-col gap-3 border-t border-slate-100 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Página {{ store.page }} · {{ store.total }} lecturas registradas</p>
        <div class="flex items-center gap-2">
          <button type="button" class="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 font-semibold hover:bg-slate-50 disabled:opacity-40" :disabled="store.loading || store.page <= 1" @click="store.fetchReadings(store.page - 1)"><ChevronLeft class="h-4 w-4"/> Anterior</button>
          <button type="button" class="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 font-semibold hover:bg-slate-50 disabled:opacity-40" :disabled="store.loading || store.page * store.pageSize >= store.total" @click="store.fetchReadings(store.page + 1)">Siguiente <ChevronRight class="h-4 w-4"/></button>
        </div>
      </footer>
    </section>
  </div>
</template>
