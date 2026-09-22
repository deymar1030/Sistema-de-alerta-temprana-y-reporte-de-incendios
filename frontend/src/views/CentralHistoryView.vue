<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarDays, Search } from 'lucide-vue-next'
import StatusBadge from '../components/common/StatusBadge.vue'
import { useIncidentStore } from '../stores/incident.store'
import { useDispatchStore } from '../stores/dispatch.store'
import { useInstitutionStore } from '../stores/institution.store'
import { useReportStore } from '../stores/report.store'
import { useAuditStore } from '../stores/audit.store'
import type { RiskLevel } from '../types'

const incidentStore = useIncidentStore()
const dispatchStore = useDispatchStore()
const institutionStore = useInstitutionStore()
const reportStore = useReportStore()
const auditStore = useAuditStore()
const search = ref('')
const filter = ref('CERRADOS')

const rows = computed(() => incidentStore.incidents.filter((item) => {
  const matches = `${item.id} ${item.ubicacion} ${item.descripcion}`.toLowerCase().includes(search.value.toLowerCase())
  const state = filter.value === 'TODOS' || (filter.value === 'CERRADOS' && ['CERRADA', 'FINALIZADA'].includes(item.status)) || item.status === filter.value
  return matches && state
}))
const riskTone = (risk: RiskLevel) => risk === 'critical' ? 'danger' as const : risk === 'high' || risk === 'warning' ? 'warning' as const : 'success' as const
const fmt = (value: string) => new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

onMounted(async () => { await Promise.all([incidentStore.fetchIncidents(), dispatchStore.fetchDispatches(), institutionStore.fetchInstitutions(), reportStore.fetchReports(), auditStore.fetchLogs()]) })
</script>

<template>
  <div class="space-y-6">
    <section><p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500">Centro de Monitoreo · Archivo</p><h2 class="mt-2 text-2xl font-semibold text-slate-900">Historial de incidentes</h2><p class="mt-2 text-sm text-slate-600">Consulta incidentes cerrados, instituciones participantes e informes vinculados.</p></section>
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="grid gap-3 md:grid-cols-[1fr_220px]"><label class="relative"><Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input v-model="search" class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm" placeholder="Buscar incidente" /></label><select v-model="filter" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="CERRADOS">Cerrados / finalizados</option><option value="TODOS">Todos</option><option value="CERRADA">Cerrados</option><option value="FINALIZADA">Finalizados</option><option value="FALSA_ALARMA">Falsa alarma</option></select></div>
      <div class="mt-5 overflow-x-auto"><table class="min-w-[850px] w-full text-left text-sm"><thead class="border-b border-slate-200 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"><tr><th class="pb-3">Incidente</th><th class="pb-3">Ubicación</th><th class="pb-3">Fecha</th><th class="pb-3">Riesgo</th><th class="pb-3">Instituciones</th><th class="pb-3">Informe</th><th class="pb-3">Estado</th></tr></thead><tbody><tr v-for="incident in rows" :key="incident.id" class="border-b border-slate-100 last:border-0"><td class="py-4 font-semibold text-slate-900">{{ incident.id }}</td><td class="py-4 text-slate-600">{{ incident.ubicacion }}</td><td class="py-4 text-slate-600"><span class="flex items-center gap-2"><CalendarDays class="h-4 w-4 text-slate-400" />{{ fmt(incident.createdAt) }}</span></td><td class="py-4"><StatusBadge :state="incident.riesgo" :tone="riskTone(incident.riesgo)">{{ incident.riesgo }}</StatusBadge></td><td class="py-4 text-slate-600">{{ dispatchStore.dispatches.filter((item) => item.incidentId === incident.id).length }}</td><td class="py-4 text-slate-600">{{ reportStore.reports.some((item) => item.incidentId === incident.id) ? 'Disponible' : 'Pendiente / no aplica' }}</td><td class="py-4"><StatusBadge :state="incident.status" :tone="['CERRADA','FINALIZADA'].includes(incident.status) ? 'success' : 'neutral'">{{ incident.status.replaceAll('_',' ') }}</StatusBadge></td></tr></tbody></table></div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div><p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Bitácora / auditoría</p><h3 class="mt-1 text-lg font-semibold text-slate-900">Acciones recientes del sistema</h3></div>
      <div class="mt-4 space-y-3">
        <div v-for="log in [...auditStore.logs].sort((a,b)=>new Date(b.fecha).getTime()-new Date(a.fecha).getTime()).slice(0,8)" :key="log.id" class="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p class="font-medium text-slate-900">{{ log.accion }}</p><p class="mt-1 text-sm text-slate-600">{{ log.detalle }}</p><p class="mt-1 text-xs text-slate-400">{{ log.usuario }} · {{ log.incidenteId || 'Sistema' }}</p></div><span class="text-xs font-medium text-slate-500">{{ fmt(log.fecha) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
