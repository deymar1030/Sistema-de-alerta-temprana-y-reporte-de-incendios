<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCitizenReportStore } from '../stores/citizen-report.store'
import type { CitizenReport } from '../types'
const route = useRoute()
const store = useCitizenReportStore()
const report = ref<CitizenReport | null>(null)
const loading = ref(false)
const error = ref('')
function imageSrc(url?: string): string | null { if (!url) return null; try { const u = new URL(url, window.location.origin); return ['http:', 'https:', 'data:'].includes(u.protocol) ? u.href : null } catch { return null } }
function date(value: string) { const d = new Date(value); return Number.isNaN(d.getTime()) ? 'Sin fecha' : d.toLocaleString('es-BO') }
async function load() {
  loading.value = true; error.value = ''; report.value = null
  try { report.value = await store.getReportById(String(route.params.id)) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'No se encontró el reporte.' }
  finally { loading.value = false }
}
onMounted(load)
watch(() => route.params.id, load)
</script>
<template>
  <div class="min-h-screen bg-[#f7f1ea] px-3 py-6 text-slate-800 sm:px-5"><div class="mx-auto max-w-2xl rounded-3xl bg-white p-4 shadow-sm sm:p-6">
    <div class="flex min-w-0 flex-wrap items-center justify-between gap-2"><h1 class="text-2xl font-extrabold text-slate-900">Detalle del reporte</h1><RouterLink to="/ciudadano/mis-reportes" class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-orange-700">Volver</RouterLink></div>
    <p v-if="loading" role="status" class="mt-6 text-sm text-slate-600">Consultando el servidor...</p>
    <p v-else-if="error" role="alert" class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{{ error }}</p>
    <div v-else-if="report" class="mt-5 space-y-4"><div class="flex min-w-0 flex-wrap justify-between gap-2"><span class="break-all text-sm font-semibold text-slate-600">#{{ report.id }}</span><span class="break-all rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">{{ report.status.replaceAll('_', ' ') }}</span></div><div v-for="field in [{label:'Fecha y hora',value:date(report.createdAt)}, {label:'Descripción',value:report.descripcion || 'No disponible'},{label:'Ubicación declarada',value:report.ubicacion || 'No disponible'}]" :key="field.label" class="min-w-0 rounded-xl bg-slate-50 p-4"><p class="text-xs font-bold uppercase tracking-wider text-slate-500">{{ field.label }}</p><p class="mt-2 break-words text-sm text-slate-900">{{ field.value }}</p></div><p v-if="report.alertId" class="break-words rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Alerta vinculada: #{{ report.alertId }}</p><img v-if="imageSrc(report.fotoUrl)" :src="imageSrc(report.fotoUrl) ?? undefined" alt="Fotografía vinculada al reporte" class="max-h-80 w-full rounded-xl border border-slate-200 object-contain"/></div>
  </div></div>
</template>
