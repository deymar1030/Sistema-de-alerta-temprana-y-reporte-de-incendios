<script setup lang="ts">
import { computed, onMounted } from 'vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import { useAuthStore } from '../stores/auth.store'
import { useDispatchStore } from '../stores/dispatch.store'
import { useIncidentStore } from '../stores/incident.store'
import { useReportStore } from '../stores/report.store'

const authStore = useAuthStore(); const dispatchStore = useDispatchStore(); const incidentStore = useIncidentStore(); const reportStore = useReportStore()
const institutionId = computed(() => authStore.user?.institucionId ?? 'INS-001')
const rows = computed(() => dispatchStore.dispatches.filter((item) => item.institutionId === institutionId.value))
const incidentFor = (id:string) => incidentStore.incidents.find((item)=>item.id===id)
const fmt = (value:string) => new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))
onMounted(async()=>{await Promise.all([dispatchStore.fetchDispatches(),incidentStore.fetchIncidents(),reportStore.fetchReports()])})
</script>
<template><div class="space-y-6"><section><p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500">Administración institucional</p><h2 class="mt-2 text-2xl font-semibold text-slate-900">Historial de atención</h2><p class="mt-2 text-sm text-slate-600">Registro de los incidentes en los que participó esta institución.</p></section><section class="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><table class="min-w-[760px] w-full text-left text-sm"><thead class="border-b border-slate-200 text-[10px] uppercase tracking-[0.16em] text-slate-500"><tr><th class="pb-3">Incidente</th><th class="pb-3">Ubicación</th><th class="pb-3">Enviado</th><th class="pb-3">Estado institucional</th><th class="pb-3">Informe</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id" class="border-b border-slate-100 last:border-0"><td class="py-4 font-semibold text-slate-900">{{ row.incidentId }}</td><td class="py-4 text-slate-600">{{ incidentFor(row.incidentId)?.ubicacion }}</td><td class="py-4 text-slate-600">{{ fmt(row.sentAt) }}</td><td class="py-4"><StatusBadge :state="row.status" :tone="row.status==='FINALIZADA'?'success':'info'">{{ row.status.replaceAll('_',' ') }}</StatusBadge></td><td class="py-4 text-slate-600">{{ reportStore.reports.some((item)=>item.incidentId===row.incidentId&&item.institutionId===institutionId)?'Registrado':'Pendiente' }}</td></tr></tbody></table></section></div></template>
