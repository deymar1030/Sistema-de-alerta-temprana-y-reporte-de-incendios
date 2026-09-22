<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { AlertTriangle, Clock3, FileText, ShieldCheck, Users } from 'lucide-vue-next'
import MetricCard from '../components/common/MetricCard.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import { useAuthStore } from '../stores/auth.store'
import { useDispatchStore } from '../stores/dispatch.store'
import { useIncidentStore } from '../stores/incident.store'
import { useReportStore } from '../stores/report.store'
import { useInstitutionStore } from '../stores/institution.store'

const authStore = useAuthStore()
const dispatchStore = useDispatchStore()
const incidentStore = useIncidentStore()
const reportStore = useReportStore()
const institutionStore = useInstitutionStore()

const institutionId = computed(() => authStore.user?.institucionId ?? 'INS-001')
const institution = computed(() => institutionStore.institutions.find((item) => item.id === institutionId.value))
const myDispatches = computed(() => dispatchStore.dispatches.filter((item) => item.institutionId === institutionId.value))
const active = computed(() => myDispatches.value.filter((item) => !['FINALIZADA', 'RECHAZADA'].includes(item.status)))
const myReports = computed(() => reportStore.reports.filter((item) => item.institutionId === institutionId.value))
const pendingReports = computed(() => myDispatches.value.filter((dispatch) => dispatch.status === 'FINALIZADA' && !myReports.value.some((report) => report.incidentId === dispatch.incidentId)))

const metrics = computed(() => [
  { title: 'Alertas recibidas', value: String(myDispatches.value.length), detail: 'Despachos dirigidos a la institución', trend: `${active.value.length} activas`, tone: 'warning' as const, icon: AlertTriangle },
  { title: 'Emergencias activas', value: String(active.value.length), detail: 'Requieren seguimiento', trend: institution.value?.disponibilidad ?? 'Demo', tone: active.value.length ? 'danger' as const : 'success' as const, icon: ShieldCheck },
  { title: 'Informes pendientes', value: String(pendingReports.value.length), detail: 'Atenciones sin informe final', trend: `${myReports.value.length} registrados`, tone: pendingReports.value.length ? 'warning' as const : 'success' as const, icon: FileText },
  { title: 'Tiempo promedio', value: '09 min', detail: 'Respuesta demostrativa', trend: 'Dato simulado', tone: 'info' as const, icon: Clock3 },
])

const incidentFor = (id: string) => incidentStore.incidents.find((item) => item.id === id)
const fmt = (value: string) => new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

onMounted(async () => { await Promise.all([dispatchStore.fetchDispatches(), incidentStore.fetchIncidents(), reportStore.fetchReports(), institutionStore.fetchInstitutions()]) })
</script>

<template>
  <div class="space-y-6">
    <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500">Administración institucional</p><h2 class="mt-2 text-2xl font-semibold text-slate-900">{{ institution?.nombre || 'Institución' }}</h2><p class="mt-2 text-sm text-slate-600">Resumen exclusivo de la institución. No se muestran despachos de otras entidades.</p></div>
      <div class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><Users class="h-4 w-4" /> Institución activa</div>
    </section>
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><MetricCard v-for="metric in metrics" :key="metric.title" v-bind="metric" /></section>
    <section class="grid gap-6 xl:grid-cols-[1fr_0.55fr]">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex items-center justify-between"><div><p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Actividad reciente</p><h3 class="mt-1 text-lg font-semibold text-slate-900">Alertas asignadas a la institución</h3></div><RouterLink to="/admin-institucion/alertas" class="text-sm font-semibold text-orange-600">Ver todas</RouterLink></div><div class="mt-4 space-y-3"><div v-for="dispatch in myDispatches.slice(0,5)" :key="dispatch.id" class="rounded-xl border border-slate-200 bg-slate-50 p-4"><div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-semibold text-slate-900">{{ incidentFor(dispatch.incidentId)?.ubicacion || dispatch.incidentId }}</p><p class="mt-1 text-xs text-slate-500">{{ dispatch.incidentId }} · {{ fmt(dispatch.sentAt) }}</p></div><StatusBadge :state="dispatch.status" :tone="dispatch.status === 'FINALIZADA' ? 'success' : 'info'">{{ dispatch.status.replaceAll('_',' ') }}</StatusBadge></div></div><p v-if="myDispatches.length === 0" class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Aún no hay despachos para esta institución.</p></div></div>
      <aside class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pendientes administrativos</p><h3 class="mt-1 text-lg font-semibold text-slate-900">Informes de atención</h3><div class="mt-4 rounded-xl bg-[#f6efe7] p-4"><p class="text-3xl font-semibold text-slate-900">{{ pendingReports.length }}</p><p class="mt-1 text-sm text-slate-600">intervenciones finalizadas sin informe estructurado</p></div><RouterLink to="/admin-institucion/informes" class="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#f24a23] px-4 py-3 text-sm font-semibold text-white">Gestionar informes</RouterLink></aside>
    </section>
  </div>
</template>
