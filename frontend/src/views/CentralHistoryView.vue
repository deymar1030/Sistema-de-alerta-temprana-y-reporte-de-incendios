<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { backendAlertsService, type BackendAlert } from '../services/backend-alerts.service'
const alerts = ref<BackendAlert[]>([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const rows = computed(() => alerts.value.filter((item) =>
  `${item.id_alerta} ${item.estado} ${item.clasificacion ?? ''}`.toLowerCase().includes(search.value.trim().toLowerCase())))
async function load() {
  loading.value = true; error.value = ''
  try { alerts.value = await backendAlertsService.list() }
  catch (cause) { alerts.value = []; error.value = cause instanceof Error ? cause.message : 'No se pudieron obtener las alertas.' }
  finally { loading.value = false }
}
onMounted(load)
</script>
<template>
  <div class="admin-page mx-auto max-w-5xl space-y-5 p-0 sm:p-2">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div><p class="text-xs font-bold uppercase tracking-widest text-orange-600">Centro de monitoreo</p>
      <h1 class="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Historial de alertas</h1>
      <p class="mt-2 text-sm text-slate-600">Estados y fechas reales registrados en el servidor. No se muestran eventos de auditoría simulados.</p></div>
      <button type="button" class="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-60" :disabled="loading" @click="load"><RefreshCw class="h-4 w-4"/>Actualizar</button>
    </header>
    <label class="block max-w-lg text-sm font-semibold text-slate-700">Buscar por alerta o estado
      <input v-model="search" class="form-input mt-2" type="search" placeholder="Ej. CONFIRMADA"/>
    </label>
    <p v-if="loading" role="status" class="rounded-xl bg-white p-5 text-slate-600">Cargando desde la API...</p>
    <p v-else-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{{ error }}</p>
    <p v-else-if="!rows.length" class="rounded-xl bg-white p-5 text-slate-600">No se encontraron alertas.</p>
    <div v-else class="grid min-w-0 gap-3 sm:grid-cols-2">
      <article v-for="alert in rows" :key="String(alert.id_alerta)" class="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex min-w-0 flex-wrap items-center justify-between gap-2"><strong class="break-all text-slate-900">Alerta #{{ alert.id_alerta }}</strong><span class="break-all rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-800">{{ alert.estado }}</span></div>
        <p class="mt-2 text-sm text-slate-600">{{ alert.clasificacion || 'Sin clasificación' }}</p>
        <p class="mt-2 text-xs text-slate-500">{{ alert.fecha }} · {{ alert.hora }}</p>
      </article>
    </div>
  </div>
</template>
