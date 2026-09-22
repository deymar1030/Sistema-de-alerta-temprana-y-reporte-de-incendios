<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { CheckCircle2, Flame, MapPin, Navigation, ShieldCheck } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useDispatchStore } from '../stores/dispatch.store'
import { useIncidentStore } from '../stores/incident.store'
import { useTimelineStore } from '../stores/timeline.store'
import { useAuditStore } from '../stores/audit.store'
import StatusBadge from '../components/common/StatusBadge.vue'
import IncidentTimeline from '../components/common/IncidentTimeline.vue'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'
import type { DispatchStatus, IncidentStatus } from '../types'

const route = useRoute(); const authStore = useAuthStore(); const dispatchStore = useDispatchStore(); const incidentStore = useIncidentStore(); const timelineStore = useTimelineStore(); const auditStore = useAuditStore()
const institutionId = computed(()=>authStore.user?.institucionId ?? 'INS-001')
const dispatch = computed(()=>{
  const byRoute = typeof route.params.id === 'string' ? dispatchStore.dispatches.find((item)=>item.id===route.params.id && item.institutionId===institutionId.value) : undefined
  return byRoute ?? dispatchStore.dispatches.find((item)=>item.institutionId===institutionId.value && !['FINALIZADA','RECHAZADA'].includes(item.status))
})
const incident = computed(()=>dispatch.value ? incidentStore.incidents.find((item)=>item.id===dispatch.value?.incidentId) : undefined)
const events = computed(()=>incident.value ? timelineStore.forIncident(incident.value.id) : [])

const actions: Array<{ current: DispatchStatus[]; label:string; status:DispatchStatus; incidentStatus:IncidentStatus; icon: typeof CheckCircle2 }> = [
  { current:['ENVIADA','RECIBIDA'], label:'Confirmar recepción', status:'ACEPTADA', incidentStatus:'ACEPTADA', icon:CheckCircle2 },
  { current:['ACEPTADA'], label:'Unidad en camino', status:'EN_CAMINO', incidentStatus:'EN_CAMINO', icon:Navigation },
  { current:['EN_CAMINO'], label:'Llegamos al lugar', status:'EN_SITIO', incidentStatus:'EN_SITIO', icon:MapPin },
  { current:['EN_SITIO'], label:'Incendio controlado', status:'CONTROLADA', incidentStatus:'CONTROLADA', icon:ShieldCheck },
  { current:['CONTROLADA'], label:'Finalizar intervención', status:'FINALIZADA', incidentStatus:'FINALIZADA', icon:CheckCircle2 },
]
const currentAction = computed(()=>dispatch.value ? actions.find((action)=>action.current.includes(dispatch.value!.status)) : undefined)
const applyAction = async()=>{
  if(!dispatch.value||!incident.value||!currentAction.value) return
  const action=currentAction.value
  await dispatchStore.updateStatus(dispatch.value.id,action.status)
  await incidentStore.updateStatus(incident.value.id,action.incidentStatus)
  await timelineStore.addEvent({incidentId:incident.value.id,dispatchId:dispatch.value.id,institutionId:institutionId.value,estado:action.status,titulo:action.label,detalle:`Estado actualizado por ${authStore.user?.nombre ?? 'personal operativo'}.`,actor:authStore.user?.nombre ?? 'Personal operativo'})
  await auditStore.addLog({usuario:authStore.user?.nombre ?? 'Personal operativo',accion:action.label,incidenteId:incident.value.id,detalle:`Despacho ${dispatch.value.id} actualizado a ${action.status}.`})
}
onMounted(async()=>{await Promise.all([dispatchStore.fetchDispatches(),incidentStore.fetchIncidents(),timelineStore.fetchEvents(),auditStore.fetchLogs()])})
</script>
<template><div v-if="dispatch&&incident" class="space-y-6"><section class="rounded-2xl border border-orange-200 bg-[#f6efe7] p-5"><div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div class="flex gap-3"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm"><Flame class="h-6 w-6"/></div><div><p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-700">Emergencia asignada · {{ dispatch.id }}</p><h2 class="mt-1 text-2xl font-semibold text-slate-900">{{ incident.ubicacion }}</h2><p class="mt-2 text-sm text-slate-700">{{ incident.descripcion }}</p></div></div><StatusBadge :state="dispatch.status" tone="info">{{ dispatch.status.replaceAll('_',' ') }}</StatusBadge></div></section><section class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><div class="space-y-5"><MonitoringMap :show-sensors="false" :show-incidents="true" :show-institutions="true" :show-reports="false" height-class="h-[360px]" :focus-lat="incident.latitud" :focus-lng="incident.longitud" :focus-zoom="15"/><div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Acción operativa</p><h3 class="mt-1 text-lg font-semibold text-slate-900">Actualiza solo lo que está ocurriendo realmente</h3><p class="mt-2 text-sm text-slate-600">Cada acción registra fecha, hora e institución en la cronología.</p><button v-if="currentAction" class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f24a23] px-5 py-4 text-base font-semibold text-white" @click="applyAction"><component :is="currentAction.icon" class="h-5 w-5"/>{{ currentAction.label }}</button><div v-else-if="dispatch.status==='FINALIZADA'" class="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">Intervención finalizada. El administrador de la institución puede completar el informe de atención.</div></div></div><IncidentTimeline :incident-id="incident.id" :current-status="incident.status" :events="events"/></section></div><div v-else class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><CheckCircle2 class="mx-auto h-9 w-9 text-emerald-600"/><h2 class="mt-3 text-xl font-semibold text-slate-900">No hay una emergencia asignada</h2><p class="mt-2 text-sm text-slate-500">El Operador Central debe despachar una alerta a tu institución para habilitar esta vista.</p></div></template>
