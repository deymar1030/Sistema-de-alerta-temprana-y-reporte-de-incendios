<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { backendAlertsService, type BackendAlert } from '../services/backend-alerts.service'
const auth = useAuthStore()
const institutionId = computed(() => auth.user?.institutionId ?? auth.user?.institucionId ?? null)
const alerts = ref<BackendAlert[]>([])
const loading = ref(false)
const error = ref('')
const rows = computed(() => alerts.value.flatMap((alert) =>
  (alert.instituciones_notificadas ?? []).filter((item) => String(item.id_institucion) === String(institutionId.value)).map((item) => ({ alert, item })),
).sort((a, b) => (b.item.fecha_actualizacion ?? b.item.fecha_envio ?? '').localeCompare(a.item.fecha_actualizacion ?? a.item.fecha_envio ?? '')))
function date(value?: string | null) { if (!value) return 'No registrada'; const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleString('es-BO') }
async function load() {
  error.value = ''
  if (!institutionId.value) { error.value = 'Esta cuenta no tiene una institución asignada.'; return }
  loading.value = true
  try {
    const summaries = await backendAlertsService.byInstitution(institutionId.value)
    // El listado puede ser parcial; el detalle contiene instituciones_notificadas y fechas persistidas.
    alerts.value = await Promise.all(summaries.slice(0,100).map(async (summary) => {
      try { return await backendAlertsService.detail(String(summary.id_alerta)) }
      catch { return summary }
    }))
  } catch (cause) { alerts.value = []; error.value = cause instanceof Error ? cause.message : 'No se pudo consultar el historial.' }
  finally { loading.value = false }
}
onMounted(() => { void load() })
</script>
<template>
  <div class="admin-page mx-auto max-w-[1500px] space-y-5"><header class="flex flex-wrap items-end justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-wider text-orange-600">Administración institucional</p><h1 class="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Historial de atención</h1><p class="mt-2 text-sm text-slate-600">Estados y fechas recibidos del servidor; no se generan etapas ficticias.</p></div><button type="button" class="min-h-11 rounded-xl bg-orange-600 px-4 font-bold text-white disabled:opacity-50" :disabled="loading" @click="load">Actualizar</button></header>
    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><p v-if="loading" class="p-6 text-sm text-slate-600">Cargando historial...</p><p v-else-if="error" role="alert" class="m-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{{ error }}</p><p v-else-if="!rows.length" class="p-8 text-center text-sm text-slate-500">No hay envíos institucionales con historial disponible.</p><div v-else class="divide-y divide-slate-100"><article v-for="row in rows" :key="`${row.alert.id_alerta}-${row.item.id_institucion}`" class="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div class="min-w-0"><RouterLink :to="`/institucion/alertas/${encodeURIComponent(String(row.alert.id_alerta))}`" class="break-words font-bold text-slate-900 hover:text-orange-700">Alerta #{{ row.alert.id_alerta }}</RouterLink><p class="mt-1 text-xs text-slate-600">Envío: {{ date(row.item.fecha_envio) }}</p><p class="mt-1 text-xs text-slate-600">Actualización: {{ date(row.item.fecha_actualizacion) }}</p></div><span class="max-w-full break-all self-start rounded-full border border-slate-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800">{{ row.item.estado }}</span></article></div></section>
  </div>
</template>
