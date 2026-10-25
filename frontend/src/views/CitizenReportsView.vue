<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useCitizenReportStore } from '../stores/citizen-report.store'

const router = useRouter()
const auth = useAuthStore()
const store = useCitizenReportStore()
const reports = computed(() => store.reports.filter((report) => report.usuarioId === auth.user?.id || report.citizenId === auth.user?.id))
onMounted(() => { void store.fetchReports() })
function when(value: string) { const d = new Date(value); return Number.isNaN(d.getTime()) ? 'Sin fecha' : d.toLocaleString('es-BO') }
</script>

<template>
  <div class="min-h-screen bg-[#f7f1ea] px-3 py-6 text-slate-800 sm:px-5">
    <div class="mx-auto min-w-0 max-w-2xl rounded-3xl bg-white p-4 shadow-sm sm:p-6">
      <header class="flex flex-wrap items-center justify-between gap-3"><div class="min-w-0"><p class="text-xs font-bold uppercase tracking-widest text-orange-600">Mi actividad</p><h1 class="mt-1 text-2xl font-extrabold text-slate-900">Mis reportes</h1></div><button type="button" class="min-h-11 rounded-xl bg-orange-600 px-4 py-2 font-bold text-white hover:bg-orange-700" @click="router.push('/ciudadano/reportar')">Nuevo reporte</button></header>
      <p v-if="store.loading" role="status" class="mt-6 text-sm text-slate-600">Consultando reportes...</p>
      <p v-else-if="store.error" role="alert" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{{ store.error }}</p>
      <p v-else-if="!reports.length" class="mt-5 rounded-xl bg-slate-50 p-6 text-sm text-slate-600">Todavía no tienes reportes registrados en el servidor.</p>
      <div v-else class="mt-5 space-y-3">
        <button v-for="report in reports" :key="report.id" type="button" class="flex min-h-28 w-full min-w-0 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-orange-300 hover:bg-orange-50" @click="router.push(`/ciudadano/reporte/${encodeURIComponent(report.id)}`)">
          <div class="flex flex-wrap items-center justify-between gap-2"><strong class="min-w-0 break-all text-sm font-bold text-slate-900">Reporte #{{ report.id }}</strong><span class="max-w-full break-all rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-800">{{ report.status.replaceAll('_', ' ') }}</span></div>
          <p class="break-words text-sm text-slate-700">{{ report.descripcion || 'Sin descripción' }}</p><p class="text-xs text-slate-500">{{ when(report.createdAt) }}</p>
        </button>
      </div>
    </div>
  </div>
</template>
