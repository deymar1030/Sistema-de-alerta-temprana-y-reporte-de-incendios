<script setup lang="ts">
import { onMounted } from 'vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import { useCitizenReportStore } from '../stores/citizen-report.store'

const store = useCitizenReportStore()
onMounted(() => store.fetchReports())
</script>

<template>
  <div class="space-y-6"><section><p class="text-[10px] uppercase tracking-[0.24em] text-slate-500">Ciudadano</p><h2 class="mt-2 text-2xl font-semibold text-slate-900">Mis reportes</h2></section><div class="space-y-3"><div v-for="report in store.reports" :key="report.id" class="rounded-2xl border border-slate-200 bg-white p-5"><div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-xs uppercase tracking-[0.16em] text-slate-500">{{ report.id }}</p><h3 class="mt-1 font-medium text-slate-900">{{ report.ubicacion }}</h3><p class="mt-1 text-sm text-slate-600">{{ new Date(report.createdAt).toLocaleString('es-BO') }}</p></div><StatusBadge :state="report.status" :tone="report.status === 'DESCARTADO' ? 'danger' : report.status === 'VALIDADO' ? 'success' : 'warning'">{{ report.status }}</StatusBadge></div><img v-if="report.fotoUrl" :src="report.fotoUrl" alt="Fotografía del reporte" class="mt-4 max-h-40 rounded-xl object-cover" /></div></div></div>
</template>