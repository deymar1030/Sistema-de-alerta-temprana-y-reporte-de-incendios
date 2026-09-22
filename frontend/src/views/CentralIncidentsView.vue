<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Building2, Clock3, Flame, MapPin, Search } from 'lucide-vue-next'
import StatusBadge from '../components/common/StatusBadge.vue'
import IncidentTimeline from '../components/common/IncidentTimeline.vue'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'
import { useIncidentStore } from '../stores/incident.store'
import { useDispatchStore } from '../stores/dispatch.store'
import { useInstitutionStore } from '../stores/institution.store'
import { useTimelineStore } from '../stores/timeline.store'
import type { IncidentStatus, RiskLevel } from '../types'

const incidentStore = useIncidentStore()
const dispatchStore = useDispatchStore()
const institutionStore = useInstitutionStore()
const timelineStore = useTimelineStore()
const search = ref('')
const selectedId = ref<string | null>(null)
const statusFilter = ref('ACTIVOS')

const activeStatuses: IncidentStatus[] = ['DESPACHADA', 'ACEPTADA', 'EN_CAMINO', 'EN_SITIO', 'CONTROLADA']
const filtered = computed(() => incidentStore.incidents.filter((item) => {
  const matchesSearch = `${item.id} ${item.ubicacion} ${item.descripcion}`.toLowerCase().includes(search.value.toLowerCase())
  const matchesStatus = statusFilter.value === 'TODOS'
    || (statusFilter.value === 'ACTIVOS' && activeStatuses.includes(item.status))
    || item.status === statusFilter.value
  return matchesSearch && matchesStatus
}))
const selected = computed(() => incidentStore.incidents.find((item) => item.id === selectedId.value) ?? filtered.value[0] ?? null)
const selectedDispatches = computed(() => selected.value ? dispatchStore.dispatches.filter((item) => item.incidentId === selected.value?.id) : [])
const events = computed(() => selected.value ? timelineStore.forIncident(selected.value.id) : [])

const statusTone = (status: IncidentStatus) => {
  if (['CONTROLADA', 'FINALIZADA', 'CERRADA'].includes(status)) return 'success' as const
  if (['DESPACHADA', 'ACEPTADA', 'EN_CAMINO', 'EN_SITIO'].includes(status)) return 'info' as const
  if (['EN_VALIDACION', 'VALIDADA'].includes(status)) return 'warning' as const
  if (['RECHAZADA', 'CANCELADA', 'FALSA_ALARMA'].includes(status)) return 'danger' as const
  return 'neutral' as const
}
const riskTone = (risk: RiskLevel) => risk === 'critical' ? 'danger' as const : risk === 'high' || risk === 'warning' ? 'warning' as const : 'success' as const
const formatDate = (value: string) => new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

onMounted(async () => {
  await Promise.all([incidentStore.fetchIncidents(), dispatchStore.fetchDispatches(), institutionStore.fetchInstitutions(), timelineStore.fetchEvents()])
  if (!selectedId.value && filtered.value.length) selectedId.value = filtered.value[0].id
})
</script>

<template>
  <div class="space-y-6">
    <section>
      <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500">Centro de Monitoreo · Seguimiento</p>
      <h2 class="mt-2 text-2xl font-semibold text-slate-900">Incidentes en atención</h2>
      <p class="mt-2 max-w-3xl text-sm text-slate-600">Una vez despachada la alerta, el incidente pasa a seguimiento. Cada institución conserva su propio estado de respuesta.</p>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="grid gap-3 md:grid-cols-[1fr_220px]">
        <label class="relative"><Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input v-model="search" class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-300" placeholder="Buscar por ID, ubicación o descripción" /></label>
        <select v-model="statusFilter" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"><option value="ACTIVOS">Incidentes activos</option><option value="TODOS">Todos</option><option value="DESPACHADA">Despachados</option><option value="EN_CAMINO">En camino</option><option value="EN_SITIO">En sitio</option><option value="CONTROLADA">Controlados</option></select>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.4fr_0.6fr]">
      <div class="space-y-3">
        <button v-for="incident in filtered" :key="incident.id" :class="['w-full rounded-2xl border p-4 text-left transition', selected?.id === incident.id ? 'border-orange-300 bg-orange-50/60 ring-2 ring-orange-100' : 'border-slate-200 bg-white hover:border-orange-200']" @click="selectedId = incident.id">
          <div class="flex items-center justify-between gap-2"><span class="text-xs font-semibold text-slate-500">{{ incident.id }}</span><StatusBadge :state="incident.riesgo" :tone="riskTone(incident.riesgo)">{{ incident.riesgo }}</StatusBadge></div>
          <p class="mt-2 font-semibold text-slate-900">{{ incident.ubicacion }}</p>
          <p class="mt-1 line-clamp-2 text-sm text-slate-600">{{ incident.descripcion }}</p>
          <div class="mt-3 flex items-center justify-between gap-2"><StatusBadge :state="incident.status" :tone="statusTone(incident.status)">{{ incident.status.replaceAll('_', ' ') }}</StatusBadge><span class="text-xs text-slate-400">{{ formatDate(incident.updatedAt || incident.createdAt) }}</span></div>
        </button>
        <div v-if="filtered.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No hay incidentes con esos filtros.</div>
      </div>

      <div v-if="selected" class="space-y-5">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><div class="flex items-center gap-2"><Flame class="h-5 w-5 text-orange-500" /><span class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{{ selected.id }} · {{ selected.origen }}</span></div><h3 class="mt-2 text-xl font-semibold text-slate-900">{{ selected.ubicacion }}</h3><p class="mt-2 text-sm text-slate-600">{{ selected.descripcion }}</p></div>
            <StatusBadge :state="selected.status" :tone="statusTone(selected.status)">{{ selected.status.replaceAll('_', ' ') }}</StatusBadge>
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-3"><div class="rounded-xl bg-slate-50 p-3"><MapPin class="h-4 w-4 text-orange-500" /><p class="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">Ubicación</p><p class="mt-1 text-sm font-medium text-slate-900">{{ selected.ubicacion }}</p></div><div class="rounded-xl bg-slate-50 p-3"><Clock3 class="h-4 w-4 text-slate-500" /><p class="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">Creado</p><p class="mt-1 text-sm font-medium text-slate-900">{{ formatDate(selected.createdAt) }}</p></div><div class="rounded-xl bg-slate-50 p-3"><Building2 class="h-4 w-4 text-sky-800" /><p class="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">Instituciones</p><p class="mt-1 text-sm font-medium text-slate-900">{{ selectedDispatches.length }} despachadas</p></div></div>
        </article>

        <MonitoringMap :show-sensors="false" :show-incidents="true" :show-institutions="true" :show-reports="false" height-class="h-[300px]" :focus-lat="selected.latitud" :focus-lng="selected.longitud" :focus-zoom="14" />

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div><p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Respuesta por institución</p><h3 class="mt-1 text-lg font-semibold text-slate-900">Despachos asociados</h3></div>
          <div class="mt-4 space-y-3">
            <div v-for="dispatch in selectedDispatches" :key="dispatch.id" class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p class="font-semibold text-slate-900">{{ institutionStore.institutions.find((item) => item.id === dispatch.institutionId)?.nombre }}</p><p class="mt-1 text-xs text-slate-500">{{ dispatch.id }} · enviado {{ formatDate(dispatch.sentAt) }}</p></div><StatusBadge :state="dispatch.status" :tone="dispatch.status === 'FINALIZADA' ? 'success' : dispatch.status === 'RECHAZADA' ? 'danger' : 'info'">{{ dispatch.status.replaceAll('_', ' ') }}</StatusBadge>
            </div>
            <p v-if="selectedDispatches.length === 0" class="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">Este incidente todavía no tiene instituciones despachadas.</p>
          </div>
        </article>

        <IncidentTimeline :incident-id="selected.id" :current-status="selected.status" :events="events" />
      </div>
    </section>
  </div>
</template>
