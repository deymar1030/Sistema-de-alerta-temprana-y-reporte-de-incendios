<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Camera, CheckCircle2, Clock3, MapPin, RadioTower, Send, ShieldAlert } from 'lucide-vue-next'
import StatusBadge from '../components/common/StatusBadge.vue'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'
import { useIncidentStore } from '../stores/incident.store'
import { useCitizenReportStore } from '../stores/citizen-report.store'
import { useInstitutionStore } from '../stores/institution.store'
import { useDispatchStore } from '../stores/dispatch.store'
import { useTimelineStore } from '../stores/timeline.store'
import { useAuthStore } from '../stores/auth.store'
import { useAuditStore } from '../stores/audit.store'
import type { Incident, RiskLevel } from '../types'

const incidentStore = useIncidentStore()
const citizenStore = useCitizenReportStore()
const institutionStore = useInstitutionStore()
const dispatchStore = useDispatchStore()
const timelineStore = useTimelineStore()
const authStore = useAuthStore()
const auditStore = useAuditStore()

const selectedId = ref<string | null>(null)
const selectedInstitutions = ref<string[]>([])
const confirmationOpen = ref(false)
const successMessage = ref('')
let bodyOverflowBeforeModal = ''

const reviewable = computed(() => incidentStore.incidents.filter((incident) => ['NUEVA', 'EN_VALIDACION', 'VALIDADA'].includes(incident.status)))
const selectedIncident = computed<Incident | null>(() => reviewable.value.find((item) => item.id === selectedId.value) ?? reviewable.value[0] ?? null)
const citizenReport = computed(() => selectedIncident.value?.citizenReportId ? citizenStore.reports.find((item) => item.id === selectedIncident.value?.citizenReportId) : null)
const sortedInstitutions = computed(() => [...institutionStore.institutions].sort((a, b) => a.distanciaDemo - b.distanciaDemo))

const riskTone = (risk: RiskLevel) => risk === 'critical' ? 'danger' as const : risk === 'high' || risk === 'warning' ? 'warning' as const : 'success' as const
const formatDate = (value: string) => new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

const selectIncident = (id: string) => {
  selectedId.value = id
  selectedInstitutions.value = []
  successMessage.value = ''
}

const validate = async () => {
  const incident = selectedIncident.value
  if (!incident) return
  await incidentStore.updateStatus(incident.id, 'VALIDADA')
  if (incident.citizenReportId) await citizenStore.updateStatus(incident.citizenReportId, 'VALIDADO')
  await timelineStore.addEvent({
    incidentId: incident.id,
    estado: 'VALIDADA',
    titulo: 'Alerta validada',
    detalle: 'El Operador Central verificó la información y habilitó el despacho manual.',
    actor: authStore.user?.nombre ?? 'Operador Central',
  })
  await auditStore.addLog({ usuario: authStore.user?.nombre ?? 'Operador Central', accion: 'Validó alerta', incidenteId: incident.id, detalle: 'Alerta habilitada para despacho manual.' })
}

const confirmDispatch = () => {
  if (!selectedIncident.value || selectedInstitutions.value.length === 0) return
  confirmationOpen.value = true
}

const dispatch = async () => {
  const incident = selectedIncident.value
  if (!incident || selectedInstitutions.value.length === 0) return
  for (const institutionId of selectedInstitutions.value) {
    const dispatch = await dispatchStore.createDispatch({
      incidentId: incident.id,
      alertId: incident.alertId ?? incident.id,
      institutionId,
      sentBy: authStore.user?.id ?? 'USR-001',
    })
    const institution = institutionStore.institutions.find((item) => item.id === institutionId)
    await timelineStore.addEvent({
      incidentId: incident.id,
      dispatchId: dispatch.id,
      institutionId,
      estado: 'ENVIADA',
      titulo: 'Despacho enviado',
      detalle: `Alerta enviada manualmente a ${institution?.nombre ?? institutionId}.`,
      actor: authStore.user?.nombre ?? 'Operador Central',
    })
    await auditStore.addLog({ usuario: authStore.user?.nombre ?? 'Operador Central', accion: 'Despachó alerta', incidenteId: incident.id, detalle: `Alerta enviada a ${institution?.nombre ?? institutionId}.` })
  }
  await incidentStore.updateStatus(incident.id, 'DESPACHADA')
  successMessage.value = `Alerta enviada a ${selectedInstitutions.value.length} institución(es).`
  selectedInstitutions.value = []
  confirmationOpen.value = false
}

watch(confirmationOpen, (isOpen) => {
  if (isOpen) {
    bodyOverflowBeforeModal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return
  }

  document.body.style.overflow = bodyOverflowBeforeModal
})

onBeforeUnmount(() => {
  if (confirmationOpen.value) document.body.style.overflow = bodyOverflowBeforeModal
})

onMounted(async () => {
  await Promise.all([
    incidentStore.fetchIncidents(), citizenStore.fetchReports(), institutionStore.fetchInstitutions(), dispatchStore.fetchDispatches(), timelineStore.fetchEvents(), auditStore.fetchLogs(),
  ])
  if (!selectedId.value && reviewable.value.length) selectedId.value = reviewable.value[0].id
})
</script>

<template>
  <div class="space-y-6">
    <section>
      <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500">Operador Central · Validación y despacho</p>
      <h2 class="mt-2 text-2xl font-semibold text-slate-900">Bandeja de alertas</h2>
      <p class="mt-2 max-w-3xl text-sm text-slate-600">Aquí se revisan alertas de sensores y reportes ciudadanos. Ninguna institución recibe un despacho hasta que el operador la selecciona manualmente.</p>
    </section>

    <div v-if="successMessage" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{{ successMessage }}</div>

    <div v-if="reviewable.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <CheckCircle2 class="mx-auto h-8 w-8 text-emerald-600" />
      <h3 class="mt-3 font-semibold text-slate-900">No hay alertas pendientes</h3>
      <p class="mt-1 text-sm text-slate-500">Las alertas despachadas continúan en la sección Incidentes.</p>
    </div>

    <section v-else class="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
      <aside class="space-y-3">
        <button v-for="incident in reviewable" :key="incident.id" type="button" :class="['w-full rounded-2xl border p-4 text-left shadow-sm transition', selectedIncident?.id === incident.id ? 'border-orange-300 bg-orange-50/70 ring-2 ring-orange-100' : 'border-slate-200 bg-white hover:border-orange-200']" @click="selectIncident(incident.id)">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-slate-500">{{ incident.id }} · {{ incident.origen }}</span>
            <StatusBadge :state="incident.riesgo" :tone="riskTone(incident.riesgo)">{{ incident.riesgo }}</StatusBadge>
          </div>
          <p class="mt-2 font-semibold text-slate-900">{{ incident.ubicacion }}</p>
          <p class="mt-1 line-clamp-2 text-sm text-slate-600">{{ incident.descripcion }}</p>
          <div class="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400"><span>{{ formatDate(incident.createdAt) }}</span><StatusBadge :state="incident.status" :tone="incident.status === 'VALIDADA' ? 'success' : 'warning'">{{ incident.status.replaceAll('_', ' ') }}</StatusBadge></div>
        </button>
      </aside>

      <div v-if="selectedIncident" class="space-y-5">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-2"><ShieldAlert class="h-5 w-5 text-orange-500" /><span class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{{ selectedIncident.id }}</span><StatusBadge :state="selectedIncident.riesgo" :tone="riskTone(selectedIncident.riesgo)">{{ selectedIncident.riesgo }}</StatusBadge></div>
              <h3 class="mt-3 text-xl font-semibold text-slate-900">{{ selectedIncident.ubicacion }}</h3>
              <p class="mt-2 text-sm text-slate-600">{{ selectedIncident.descripcion }}</p>
            </div>
            <button v-if="selectedIncident.status !== 'VALIDADA'" class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f24a23] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#df3f1c]" @click="validate"><CheckCircle2 class="h-4 w-4" /> Validar alerta</button>
            <StatusBadge v-else state="VALIDADA" tone="success">VALIDADA</StatusBadge>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl bg-slate-50 p-3"><span class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Origen</span><p class="mt-1 font-medium text-slate-900">{{ selectedIncident.origen }}</p></div>
            <div class="rounded-xl bg-slate-50 p-3"><span class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Recibida</span><p class="mt-1 text-sm font-medium text-slate-900">{{ formatDate(selectedIncident.createdAt) }}</p></div>
            <div class="rounded-xl bg-slate-50 p-3"><span class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Ubicación</span><p class="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900"><MapPin class="h-4 w-4 text-orange-500" />{{ selectedIncident.ubicacion }}</p></div>
          </div>
        </article>

        <article v-if="citizenReport" class="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <div class="flex items-center gap-2"><Camera class="h-5 w-5 text-amber-700" /><h3 class="font-semibold text-slate-900">Evidencia del reporte ciudadano</h3></div>
          <div class="mt-3 grid gap-3 sm:grid-cols-2"><div><p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Factores reportados</p><p class="mt-1 text-sm text-slate-700">{{ citizenReport.factores.join(', ') || 'Sin factores adicionales' }}</p></div><div><p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Fotografía</p><p class="mt-1 text-sm text-slate-700">{{ citizenReport.fotoNombre || 'No se adjuntó fotografía en este mock' }}</p></div></div>
        </article>

        <MonitoringMap :show-sensors="true" :show-incidents="true" :show-institutions="true" :show-reports="selectedIncident.origen === 'CIUDADANO'" height-class="h-[330px]" :focus-lat="selectedIncident.latitud" :focus-lng="selectedIncident.longitud" :focus-zoom="14" />

        <article v-if="selectedIncident.status === 'VALIDADA'" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div><p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Despacho manual</p><h3 class="mt-1 text-lg font-semibold text-slate-900">Selecciona las instituciones más adecuadas</h3><p class="mt-1 text-sm text-slate-500">Ordenadas por distancia demostrativa. El operador conserva la decisión final.</p></div><RadioTower class="h-5 w-5 text-orange-500" /></div>
          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <label v-for="institution in sortedInstitutions" :key="institution.id" :class="['flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition', selectedInstitutions.includes(institution.id) ? 'border-orange-300 bg-orange-50' : 'border-slate-200 hover:border-orange-200']">
              <span><span class="block font-semibold text-slate-900">{{ institution.nombre }}</span><span class="mt-1 block text-xs text-slate-500">{{ institution.tipo }} · {{ institution.distanciaDemo }} km · {{ institution.disponibilidad }}</span></span>
              <input v-model="selectedInstitutions" type="checkbox" :value="institution.id" class="h-4 w-4 accent-[#f24a23]" />
            </label>
          </div>
          <button class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f24a23] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto" :disabled="selectedInstitutions.length === 0" @click="confirmDispatch"><Send class="h-4 w-4" /> Enviar alerta a {{ selectedInstitutions.length || 0 }} institución(es)</button>
        </article>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="confirmationOpen" class="fixed inset-0 z-[5000] flex h-screen w-screen items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm" @click.self="confirmationOpen = false">
        <div class="relative z-[5001] w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Send class="h-5 w-5" /></div>
          <h3 class="mt-4 text-xl font-semibold text-slate-900">Confirmar despacho</h3>
          <p class="mt-2 text-sm text-slate-600">Se enviará la alerta de {{ selectedIncident?.id }} a {{ selectedInstitutions.length }} institución(es). Esta acción quedará registrada en la cronología de la demostración.</p>
          <div class="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row"><button class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700" @click="confirmationOpen = false">Cancelar</button><button class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f24a23] px-4 py-2.5 text-sm font-semibold text-white" @click="dispatch"><Clock3 class="h-4 w-4" /> Confirmar y enviar</button></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
