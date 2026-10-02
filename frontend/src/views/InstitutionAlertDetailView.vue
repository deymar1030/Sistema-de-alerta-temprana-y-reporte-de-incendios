<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertTriangle, ArrowLeft, Building2, CalendarClock, MapPin } from 'lucide-vue-next'
import IncidentTimeline from '../components/common/IncidentTimeline.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'
import { useAuthStore } from '../stores/auth.store'
import { useDispatchStore } from '../stores/dispatch.store'
import { useIncidentStore } from '../stores/incident.store'
import { useInstitutionStore } from '../stores/institution.store'
import { useTimelineStore } from '../stores/timeline.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const dispatchStore = useDispatchStore()
const incidentStore = useIncidentStore()
const institutionStore = useInstitutionStore()
const timelineStore = useTimelineStore()

const institutionId = computed(() => authStore.user?.institucionId ?? 'INS-001')
const alertId = computed(() => Array.isArray(route.params.id) ? route.params.id[0] : route.params.id)
const myDispatches = computed(() => dispatchStore.dispatches.filter((item) => item.institutionId === institutionId.value))
const currentDispatch = computed(() => myDispatches.value.find((item) => item.id === alertId.value))
const currentIncident = computed(() => currentDispatch.value ? incidentStore.incidents.find((item) => item.id === currentDispatch.value!.incidentId) : undefined)
const currentInstitution = computed(() => institutionStore.institutions.find((item) => item.id === currentDispatch.value?.institutionId))
const timelineEvents = computed(() => currentIncident.value ? timelineStore.forIncident(currentIncident.value.id) : [])

const fmtDate = (value?: string) => value ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Sin fecha'
const statusLabel = (value?: string) => value ? value.replaceAll('_', ' ') : 'Sin estado'
const riskLabel = (value?: string) => {
  if (!value) return 'Sin nivel'
  if (value === 'critical') return 'Crítico'
  if (value === 'high') return 'Alto'
  if (value === 'warning') return 'Medio'
  return 'Normal'
}
const toneForStatus = (status: string) => {
  if (['FINALIZADA', 'CERRADA', 'CONTROLADA'].includes(status)) return 'success' as const
  if (['RECHAZADA'].includes(status)) return 'danger' as const
  if (['ENVIADA', 'ACEPTADA', 'EN_CAMINO', 'EN_SITIO'].includes(status)) return 'info' as const
  if (['PENDIENTE', 'RECIBIDA'].includes(status)) return 'warning' as const
  return 'neutral' as const
}
const toneForRisk = (risk?: string) => {
  if (risk === 'critical') return 'danger' as const
  if (risk === 'high' || risk === 'warning') return 'warning' as const
  return 'success' as const
}
const goBack = () => router.push('/admin-institucion/alertas')

onMounted(async () => {
  await Promise.all([dispatchStore.fetchDispatches(), incidentStore.fetchIncidents(), institutionStore.fetchInstitutions(), timelineStore.fetchEvents()])
})
</script>

<template>
  <div v-if="currentIncident && currentDispatch" class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <button class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600" @click="goBack">
        <ArrowLeft class="h-4 w-4" /> Volver a alertas
      </button>
      <StatusBadge :state="currentDispatch.status" :tone="toneForStatus(currentDispatch.status)">{{ statusLabel(currentDispatch.status) }}</StatusBadge>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{{ currentDispatch.id }} · {{ currentIncident.id }}</p>
          <h2 class="mt-2 text-2xl font-semibold text-slate-900">{{ currentIncident.ubicacion }}</h2>
        </div>
        <StatusBadge :state="currentIncident.riesgo" :tone="toneForRisk(currentIncident.riesgo)">{{ riskLabel(currentIncident.riesgo) }}</StatusBadge>
      </div>

      <div class="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div class="space-y-5">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Resumen</p>
            <p class="mt-3 text-sm leading-6 text-slate-700">{{ currentIncident.descripcion }}</p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"><CalendarClock class="h-4 w-4 text-orange-500" /> Fecha y hora</p>
              <p class="mt-3 text-sm font-medium text-slate-900">{{ fmtDate(currentIncident.createdAt) }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"><Building2 class="h-4 w-4 text-orange-500" /> Institución</p>
              <p class="mt-3 text-sm font-medium text-slate-900">{{ currentInstitution?.nombre || 'Institución sin nombre' }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"><MapPin class="h-4 w-4 text-orange-500" /> Ubicación</p>
              <p class="mt-3 text-sm font-medium text-slate-900">{{ currentIncident.ubicacion }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"><AlertTriangle class="h-4 w-4 text-orange-500" /> Nivel</p>
              <p class="mt-3 text-sm font-medium text-slate-900">{{ riskLabel(currentIncident.riesgo) }}</p>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Observaciones</p>
            <p class="mt-3 text-sm leading-6 text-slate-700">
              {{ currentIncident.citizenReportId ? 'La alerta fue recibida desde un reporte ciudadano y requiere revisión institucional.' : 'Sin observaciones adicionales registradas en la demostración.' }}
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4">
          <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ubicación en mapa</p>
          <div class="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <MonitoringMap :show-sensors="false" :show-incidents="true" :show-institutions="true" :show-reports="false" height-class="h-[260px]" :focus-lat="currentIncident.latitud" :focus-lng="currentIncident.longitud" :focus-zoom="14" />
          </div>
        </div>
      </div>
    </section>

    <IncidentTimeline :incident-id="currentIncident.id" :current-status="currentIncident.status" :events="timelineEvents" />
  </div>

  <div v-else class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
    No se encontró la alerta seleccionada.
  </div>
</template>
