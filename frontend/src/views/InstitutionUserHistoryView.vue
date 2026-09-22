<script setup lang="ts">
import { computed,onMounted } from 'vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import { useAuthStore } from '../stores/auth.store'
import { useDispatchStore } from '../stores/dispatch.store'
import { useIncidentStore } from '../stores/incident.store'
const authStore=useAuthStore();const dispatchStore=useDispatchStore();const incidentStore=useIncidentStore()
const institutionId=computed(()=>authStore.user?.institucionId ?? 'INS-001')
const rows=computed(()=>dispatchStore.dispatches.filter((item)=>item.institutionId===institutionId.value))
const incidentFor=(id:string)=>incidentStore.incidents.find((item)=>item.id===id)
const fmt=(value:string)=>new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))
onMounted(async()=>{await Promise.all([dispatchStore.fetchDispatches(),incidentStore.fetchIncidents()])})
</script>
<template><div class="space-y-6"><section><p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500">Personal operativo</p><h2 class="mt-2 text-2xl font-semibold text-slate-900">Historial de emergencias</h2><p class="mt-2 text-sm text-slate-600">Atenciones asignadas a tu institución.</p></section><div class="grid gap-4 md:grid-cols-2"><article v-for="row in rows" :key="row.id" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex items-center justify-between gap-2"><span class="text-xs font-semibold text-slate-500">{{ row.incidentId }}</span><StatusBadge :state="row.status" :tone="row.status==='FINALIZADA'?'success':'info'">{{ row.status.replaceAll('_',' ') }}</StatusBadge></div><h3 class="mt-3 font-semibold text-slate-900">{{ incidentFor(row.incidentId)?.ubicacion }}</h3><p class="mt-1 text-sm text-slate-600">{{ incidentFor(row.incidentId)?.descripcion }}</p><p class="mt-3 text-xs text-slate-400">Asignada {{ fmt(row.sentAt) }}</p></article></div></div></template>
