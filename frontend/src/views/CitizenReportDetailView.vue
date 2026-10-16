<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { citizenReportsMock } from '../mocks/citizenReports'

const route = useRoute()
const report = computed(() => citizenReportsMock.find((item) => item.id === route.params.id) ?? citizenReportsMock[0])

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
        <h1 class="text-2xl font-bold text-slate-900">Detalle del reporte</h1>
        <span :class="statusColors[report.status] || 'bg-slate-100 text-slate-700'" class="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
          {{ report.status }}
        </span>
      </div>

      <div class="mt-4 space-y-4 text-sm text-slate-700">
        <div class="rounded-2xl bg-slate-50 p-3">
          <p class="font-semibold text-slate-900">Código</p>
          <p>{{ report.id }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-3">
          <p class="font-semibold text-slate-900">Fecha y hora</p>
          <p>{{ new Date(report.createdAt).toLocaleString() }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-3">
          <p class="font-semibold text-slate-900">Descripción</p>
          <p>{{ report.description }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-3">
          <p class="font-semibold text-slate-900">Ubicación</p>
          <p>{{ report.address }}</p>
        </div>
        <div v-if="report.photo" class="overflow-hidden rounded-2xl border border-slate-200">
          <img :src="report.photo" alt="Evidencia del reporte" class="h-48 w-full object-cover" />
        </div>
      </div>

      <div class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Historial</p>
        <ul class="mt-3 space-y-2 text-sm text-slate-700">
          <li>Reporte enviado</li>
          <li>→ En revisión</li>
          <li>→ Confirmado</li>
          <li>→ Instituciones notificadas</li>
          <li>→ Finalizado</li>
        </ul>
      </div>
    </div>
  </div>
</template>
