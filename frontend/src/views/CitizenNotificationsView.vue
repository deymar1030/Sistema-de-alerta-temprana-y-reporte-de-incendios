<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Bell, CheckCircle2, Info } from 'lucide-vue-next'
import { useCitizenReportStore } from '../stores/citizen-report.store'
import { useIncidentStore } from '../stores/incident.store'
const reportStore=useCitizenReportStore();const incidentStore=useIncidentStore()
const notifications=computed(()=>[
  ...reportStore.reports.map((report)=>({id:`rep-${report.id}`,title:`Actualización de ${report.id}`,detail:report.status==='VALIDADO'?'Tu reporte fue validado por el Centro de Monitoreo.':report.status==='DESCARTADO'?'El reporte fue revisado y descartado.':'Tu reporte sigue en proceso de revisión.',time:new Date(report.createdAt),tone:report.status==='VALIDADO'?'success':'info'})),
  ...incidentStore.incidents.filter((item)=>['CONTROLADA','CERRADA'].includes(item.status)).map((item)=>({id:`inc-${item.id}`,title:'Emergencia controlada',detail:`El incidente de demostración en ${item.ubicacion} fue actualizado a ${item.status.toLowerCase()}.`,time:new Date(item.updatedAt||item.createdAt),tone:'success'})),
].sort((a,b)=>b.time.getTime()-a.time.getTime()))
const fmt=(value:Date)=>new Intl.DateTimeFormat('es-BO',{dateStyle:'medium',timeStyle:'short'}).format(value)
onMounted(async()=>{await Promise.all([reportStore.fetchReports(),incidentStore.fetchIncidents()])})
</script>
<template><div class="mx-auto max-w-4xl space-y-6"><section><p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500">Ciudadano</p><h2 class="mt-2 text-2xl font-semibold text-slate-900">Notificaciones</h2><p class="mt-2 text-sm text-slate-600">Avisos relacionados con tus reportes y eventos demostrativos del sistema.</p></section><section class="space-y-3"><article v-for="notification in notifications" :key="notification.id" class="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',notification.tone==='success'?'bg-emerald-50 text-emerald-700':'bg-orange-50 text-orange-600']"><CheckCircle2 v-if="notification.tone==='success'" class="h-5 w-5"/><Bell v-else class="h-5 w-5"/></div><div class="min-w-0"><h3 class="font-semibold text-slate-900">{{ notification.title }}</h3><p class="mt-1 text-sm text-slate-600">{{ notification.detail }}</p><p class="mt-2 text-xs text-slate-400">{{ fmt(notification.time) }}</p></div></article><div v-if="notifications.length===0" class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Info class="mx-auto h-7 w-7 text-slate-400"/><p class="mt-3 text-sm text-slate-500">No hay notificaciones nuevas.</p></div></section></div></template>
