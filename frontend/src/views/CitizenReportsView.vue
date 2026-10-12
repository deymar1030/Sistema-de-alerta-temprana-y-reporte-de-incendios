<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { citizenReportsMock } from '../mocks/citizenReports'

const router = useRouter()
const reports = computed(() => citizenReportsMock)

const statusColors: Record<string, string> = {
  PENDIENTE_DE_VALIDACION: 'bg-amber-100 text-amber-800',
  EN_REVISION: 'bg-blue-100 text-blue-800',
  CONFIRMADO: 'bg-green-100 text-green-800',
  RECHAZADO: 'bg-red-100 text-red-800',
  ATENDIENDO: 'bg-orange-100 text-orange-800',
  FINALIZADO: 'bg-slate-200 text-slate-800',
}
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] px-4 py-6 text-slate-800">
    <div class="mx-auto max-w-md rounded-[30px] bg-white p-5 shadow-lg shadow-orange-100">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-900">Mis reportes</h1>
        <button class="text-sm font-medium text-orange-600" @click="router.push('/ciudadano/reportar')">Nuevo</button>
      </div>

      <div class="mt-4 space-y-3">
        <article v-for="report in reports" :key="report.id" class="rounded-2xl border border-slate-200 p-4 shadow-sm" @click="router.push(`/ciudadano/reporte/${report.id}`)">
          <div class="flex items-center justify-between">
            <p class="font-semibold text-slate-900">{{ report.id }}</p>
            <span :class="statusColors[report.status] || 'bg-slate-100 text-slate-700'" class="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
              {{ report.status }}
            </span>
          </div>
          <p class="mt-2 text-xs text-slate-500">{{ new Date(report.createdAt).toLocaleString() }}</p>
          <p class="mt-2 text-sm text-slate-700">{{ report.address }}</p>
          <p class="mt-2 text-sm text-slate-600 line-clamp-2">{{ report.description }}</p>
        </article>
      </div>
    </div>
  </div>
</template>
