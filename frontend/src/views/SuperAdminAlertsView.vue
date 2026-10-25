<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { backendAlertsService, type BackendAlert } from '../services/backend-alerts.service'

const alerts = ref<BackendAlert[]>([])
const selected = ref<BackendAlert | null>(null)
const loading = ref(false)
const detailLoading = ref(false)
const error = ref('')
const detailError = ref('')

const safePhotoUrl = (value?: string | null): string | null => {
  if (!value) return null
  try {
    const candidate = new URL(value, window.location.origin)
    return candidate.protocol === 'http:' || candidate.protocol === 'https:' ? candidate.href : null
  } catch { return null }
}

const dateLabel = (value?: string | null) => {
  if (!value) return 'Sin fecha'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('es-BO')
}

async function loadAlerts() {
  loading.value = true
  error.value = ''
  try {
    alerts.value = await backendAlertsService.list()
  } catch (cause) {
    alerts.value = [] // Nunca presentar fixtures como datos actuales.
    error.value = cause instanceof Error ? cause.message : 'No se pudieron cargar las alertas.'
  } finally {
    loading.value = false
  }
}

async function openDetail(id: string) {
  selected.value = null
  detailError.value = ''
  detailLoading.value = true
  try {
    selected.value = await backendAlertsService.detail(id)
  } catch (cause) {
    detailError.value = cause instanceof Error ? cause.message : 'No se pudo cargar el detalle.'
  } finally {
    detailLoading.value = false
  }
}

onMounted(loadAlerts)
</script>

<template>
  <main class="space-y-5 p-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Alertas del sistema</h1>
        <p class="mt-2 text-sm text-slate-600">Datos del backend. Las instituciones se notifican automáticamente; aquí no se simulan despachos.</p>
      </div>
      <button type="button" class="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60" :disabled="loading" @click="loadAlerts">Actualizar</button>
    </header>

    <p v-if="loading" role="status" class="text-slate-600">Consultando alertas...</p>
    <div v-if="error" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{{ error }}</div>
    <p v-if="!loading && !error && !alerts.length" class="text-sm text-slate-600">No hay alertas registradas.</p>

    <div v-if="!loading && !error" class="grid gap-3 md:grid-cols-2">
      <article v-for="alert in alerts" :key="String(alert.id_alerta)" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <strong class="text-lg text-slate-900">Alerta #{{ alert.id_alerta }}</strong>
          <span class="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-900">{{ alert.estado }}</span>
        </div>
        <p class="mt-3 text-sm text-slate-700">Clasificación: {{ alert.clasificacion ?? 'Sin clasificar' }}</p>
        <p class="mt-1 text-sm text-slate-600">Puntaje: {{ alert.puntaje == null ? 'No disponible' : alert.puntaje }}</p>
        <p class="mt-1 text-sm text-slate-600">Fecha: {{ alert.fecha }} {{ alert.hora }}</p>
        <button type="button" class="mt-4 font-semibold text-orange-700 underline underline-offset-4" @click="openDetail(String(alert.id_alerta))">Ver detalle real</button>
      </article>
    </div>

    <p v-if="detailLoading" role="status" class="text-slate-600">Cargando detalle...</p>
    <p v-if="detailError" role="alert" class="text-red-700">{{ detailError }}</p>
    <section v-if="selected" aria-label="Detalle de la alerta" class="rounded-2xl border border-slate-200 bg-white p-5">
      <div class="flex items-start justify-between gap-2">
        <h2 class="text-xl font-bold text-slate-900">Detalle de la alerta #{{ selected.id_alerta }}</h2>
        <button type="button" class="rounded border px-3 py-2 text-slate-700" aria-label="Cerrar detalle" @click="selected = null">Cerrar</button>
      </div>
      <p class="mt-3 text-sm text-slate-700">Estado global: <strong>{{ selected.estado }}</strong></p>
      <p class="mt-1 text-sm text-slate-700">Origen: {{ selected.reporte_origen ? 'Reporte ciudadano' : selected.predio ? 'Predio / sensor' : 'No especificado' }}</p>
      <p class="mt-1 text-sm text-slate-700">Ubicación: {{ selected.predio?.nombre ?? selected.reporte_origen?.ubicacion_tipo ?? 'No disponible' }}</p>
      <p v-if="selected.reporte_origen?.descripcion" class="mt-1 text-sm text-slate-700">Reporte: {{ selected.reporte_origen.descripcion }}</p>
      <p v-if="safePhotoUrl(selected.reporte_origen?.foto_url)" class="mt-1 text-sm text-slate-700">Foto registrada: <a :href="safePhotoUrl(selected.reporte_origen?.foto_url) ?? undefined" target="_blank" rel="noopener noreferrer" class="underline">Ver evidencia</a></p>
      <h3 class="mt-5 font-semibold text-slate-900">Instituciones notificadas ({{ selected.instituciones_notificadas?.length ?? 0 }})</h3>
      <ul v-if="selected.instituciones_notificadas?.length" class="mt-2 space-y-2">
        <li v-for="delivery in selected.instituciones_notificadas" :key="String(delivery.id_institucion)" class="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
          <strong>{{ delivery.nombre }}</strong> — {{ delivery.estado }}
          <p>Envío: {{ dateLabel(delivery.fecha_envio) }}</p>
          <p>Actualizado: {{ dateLabel(delivery.fecha_actualizacion) }}</p>
        </li>
      </ul>
      <p v-else class="mt-2 text-sm text-slate-600">El backend no devolvió instituciones notificadas para esta alerta.</p>
    </section>
  </main>
</template>
