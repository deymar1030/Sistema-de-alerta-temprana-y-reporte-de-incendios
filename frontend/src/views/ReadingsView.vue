<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Activity, RefreshCw, SlidersHorizontal, ChevronLeft, ChevronRight, AlertTriangle, RadioTower, Clock } from 'lucide-vue-next'
import { useReadingStore } from '../stores/reading.store'
import { sensorService, SENSOR_TYPES } from '../services/sensor.service'

const store = useReadingStore()
const route = useRoute()
const sensorFilter = ref(typeof route.query.id_sensor === 'string' ? route.query.id_sensor : '')
const variableFilter = ref('')
const stateFilter = ref('')
const selectedPageSize = ref(25)
const sensorNames = ref(new Map<string, string>())
const sensorError = ref('')
const sensorsLoading = ref(false)
const lastRefresh = ref<Date | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null
let disposed = false

// El servidor aplica los filtros ANTES de paginar. No volver a filtrar esta página.
const filtered = computed(() => store.readings)
const sensorOptions = computed(() => {
  const options = new Map(sensorNames.value)
  if (sensorFilter.value && !options.has(sensorFilter.value)) options.set(sensorFilter.value, `Sensor ${sensorFilter.value}`)
  return [...options].map(([id, name]) => ({ id, name })).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
})
const totalPages = computed(() => Math.max(1, Math.ceil(store.total / store.pageSize)))
const rangeStart = computed(() => store.readings.length ? (store.page - 1) * store.pageSize + 1 : 0)
const rangeEnd = computed(() => store.readings.length ? rangeStart.value + store.readings.length - 1 : 0)
const anomalyCount = computed(() => filtered.value.filter(r => r.estado === 'ANOMALA').length)
const uniqueSensors = computed(() => new Set(filtered.value.map(r => r.id_sensor)).size)
const recentDate = computed(() => filtered.value.map(r => r.fecha_hora).filter(Boolean).sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null)
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
async function loadSensors() {
  sensorsLoading.value = true
  sensorError.value = ''
  try {
    const sensors = await sensorService.getSensors()
    if (disposed) return
    for (const sensor of sensors) sensorNames.value.set(sensor.id_sensor, `${sensor.nombre} (#${sensor.id_sensor})`)
  } catch {
    if (!disposed) sensorError.value = 'No se pudo cargar el catálogo de sensores. Puedes seguir consultando lecturas o reintentar.'
  } finally { if (!disposed) sensorsLoading.value = false }
}
async function refresh(page = store.page) {
  const success = await store.fetchReadings(page, {
    id_sensor: sensorFilter.value,
    tipo_variable: variableFilter.value,
    estado_lectura: stateFilter.value,
  }, selectedPageSize.value)
  if (success && !disposed) {
    lastRefresh.value = new Date()
    for (const reading of store.readings) {
      if (!sensorNames.value.has(reading.id_sensor)) sensorNames.value.set(reading.id_sensor, reading.sensor)
    }
  }
}
function clearFilters() { sensorFilter.value = ''; variableFilter.value = ''; stateFilter.value = '' }
watch([sensorFilter, variableFilter, stateFilter, selectedPageSize], () => { void refresh(1) })
watch(() => route.query.id_sensor, value => { sensorFilter.value = typeof value === 'string' ? value : '' })
onMounted(() => {
  void loadSensors()
  void refresh(1)
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && !store.loading) void refresh()
  }, 60_000)
})
onBeforeUnmount(() => { disposed = true; if (pollTimer) clearInterval(pollTimer); store.cancelRequest() })
</script>

<template>
  <main class="al-modern-screen admin-page mx-auto max-w-[1600px] space-y-5">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0"><p class="text-xs font-bold uppercase tracking-widest text-orange-600">Monitoreo</p><h1 class="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Lecturas de sensores</h1><p class="mt-2 text-sm text-slate-600">Historial de mediciones. Actualización automática cada 60 segundos mientras la pantalla está activa.</p></div>
      <button type="button" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50" :disabled="store.loading" @click="refresh()"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': store.loading }" aria-hidden="true" /> Actualizar</button>
    </header>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="flex items-center gap-2 text-sm text-slate-600"><RadioTower class="h-4 w-4 text-orange-600" aria-hidden="true" /> Sensores en esta página</p><p class="mt-2 text-2xl font-extrabold text-slate-900">{{ store.loading || store.error ? 'Pendiente' : uniqueSensors }}</p></div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="flex items-center gap-2 text-sm text-slate-600"><Activity class="h-4 w-4 text-orange-600" aria-hidden="true" /> Total de coincidencias</p><p class="mt-2 text-2xl font-extrabold text-slate-900">{{ store.loading || store.error ? 'Pendiente' : store.total }}</p></div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="flex items-center gap-2 text-sm text-slate-600"><AlertTriangle class="h-4 w-4 text-amber-600" aria-hidden="true" /> Anómalas en esta página</p><p class="mt-2 text-2xl font-extrabold text-slate-900">{{ store.loading || store.error ? 'Pendiente' : anomalyCount }}</p></div>
    </div>
    <p class="flex flex-wrap items-center gap-2 text-xs text-slate-500"><Clock class="h-4 w-4" aria-hidden="true" /> Última consulta: {{ lastRefresh ? dateLabel(lastRefresh.toISOString()) : 'Pendiente' }} <span v-if="recentDate">· Lectura más reciente en los resultados: {{ dateLabel(recentDate) }}</span> · El total incluye todas las páginas; sensores y anomalías corresponden a la página visible.</p>

    <section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
        <div class="flex items-center gap-2"><Activity class="h-5 w-5 shrink-0 text-orange-600" aria-hidden="true" /><h2 class="text-base font-bold text-slate-900">Historial de mediciones</h2></div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label class="min-w-0 text-xs font-semibold text-slate-600">Sensor<select aria-label="Sensor" v-model="sensorFilter" class="form-input mt-1 text-sm"><option value="">Todos los sensores</option><option v-for="option in sensorOptions" :key="option.id" :value="option.id">{{ option.name }}</option></select></label>
          <label class="min-w-0 text-xs font-semibold text-slate-600">Variable<select aria-label="Variable" v-model="variableFilter" class="form-input mt-1 text-sm"><option value="">Todas las variables</option><option v-for="option in SENSOR_TYPES" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
          <label class="min-w-0 text-xs font-semibold text-slate-600"><SlidersHorizontal class="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Estado<select aria-label="Estado" v-model="stateFilter" class="form-input mt-1 text-sm"><option value="">Todos los estados</option><option value="VALIDA">Válida</option><option value="ANOMALA">Anómala</option><option value="INVALIDA">Inválida</option></select></label>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-slate-600">Los filtros buscan en todo el historial y vuelven a la primera página.</p>
          <button v-if="sensorFilter || variableFilter || stateFilter" type="button" class="min-h-11 rounded-lg px-3 text-sm font-semibold text-orange-700 hover:bg-orange-50" @click="clearFilters">Limpiar filtros</button>
        </div>
        <p v-if="sensorError" role="alert" class="text-sm text-amber-900">{{ sensorError }} <button type="button" class="min-h-11 px-2 font-bold underline disabled:opacity-50" :disabled="sensorsLoading" @click="loadSensors">Reintentar sensores</button></p>
      </div>
      <div v-if="store.loading" role="status" class="p-10 text-center text-sm text-slate-600">Cargando lecturas...</div>
      <div v-else-if="store.error" role="alert" class="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ store.error }}</div>
      <div v-else-if="!filtered.length" class="p-10 text-center text-sm text-slate-500">No hay mediciones que coincidan con los filtros.</div>
      <template v-else>
        <div class="grid gap-3 p-4 sm:hidden"><article v-for="reading in filtered" :key="reading.id_lectura" class="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex flex-wrap items-start justify-between gap-2"><strong class="min-w-0 break-words text-sm text-slate-900">{{ sensorNames.get(reading.id_sensor) ?? reading.sensor }}</strong><span class="shrink-0 rounded-full border px-2 py-1 text-xs font-bold" :class="statusClass[reading.estado]">{{ statusLabel[reading.estado] }}</span></div>
          <p class="mt-2 text-xl font-extrabold text-slate-900">{{ reading.valor }} <span class="text-sm font-normal text-slate-500">{{ reading.unidad }}</span></p><p class="mt-1 text-sm text-slate-600">{{ reading.variable }} · {{ dateLabel(reading.fecha_hora) }}</p><p class="mt-1 break-all text-xs text-slate-500">Lectura #{{ reading.id_lectura }}</p>
        </article></div>
        <div class="hidden overflow-x-auto sm:block"><table class="w-full min-w-[720px] table-auto text-left text-sm text-slate-700"><thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th class="px-4 py-3">ID</th><th class="px-4 py-3">Sensor</th><th class="px-4 py-3">Variable</th><th class="px-4 py-3">Medición</th><th class="px-4 py-3">Fecha y hora</th><th class="px-4 py-3">Estado</th></tr></thead><tbody><tr v-for="reading in filtered" :key="reading.id_lectura" class="border-t border-slate-100 hover:bg-orange-50/30"><td class="px-4 py-3 font-medium">{{ reading.id_lectura }}</td><td class="max-w-44 break-words px-4 py-3">{{ sensorNames.get(reading.id_sensor) ?? reading.sensor }}</td><td class="px-4 py-3">{{ reading.variable }}</td><td class="px-4 py-3 font-semibold">{{ reading.valor }} <span class="font-normal text-slate-500">{{ reading.unidad }}</span></td><td class="px-4 py-3">{{ dateLabel(reading.fecha_hora) }}</td><td class="px-4 py-3"><span class="inline-block rounded-full border px-2.5 py-1 text-xs font-bold" :class="statusClass[reading.estado]">{{ statusLabel[reading.estado] }}</span></td></tr></tbody></table></div>
      </template>
      <footer class="flex flex-col gap-3 border-t border-slate-100 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"><div class="space-y-2">
          <p role="status">{{ store.loading ? 'Consultando resultados…' : store.error ? 'Resultados no disponibles' : `${rangeStart}–${rangeEnd} de ${store.total} lecturas · Página ${store.page} de ${totalPages}` }}</p>
          <label class="flex items-center gap-2 text-sm">Lecturas por página<select aria-label="Lecturas por página" v-model.number="selectedPageSize" class="min-h-11 rounded-lg border border-slate-300 bg-white px-3"><option :value="25">25</option><option :value="50">50</option><option :value="100">100</option></select></label>
        </div><div class="flex items-center gap-2"><button type="button" class="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 font-semibold hover:bg-slate-50 disabled:opacity-40" :disabled="store.loading || !!store.error || store.page <= 1" @click="refresh(store.page - 1)"><ChevronLeft class="h-4 w-4" aria-hidden="true" /> Anterior</button><button type="button" class="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 font-semibold hover:bg-slate-50 disabled:opacity-40" :disabled="store.loading || !!store.error || store.page >= totalPages" @click="refresh(store.page + 1)">Siguiente <ChevronRight class="h-4 w-4" aria-hidden="true" /></button></div></footer>
    </section>
  </main>
</template>