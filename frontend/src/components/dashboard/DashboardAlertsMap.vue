<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LocateFixed, RefreshCw } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { backendAlertsService, type MapAlert } from '../../services/backend-alerts.service'
import { institutionService } from '../../services/institution.service'
import type { Institution } from '../../types'
import { dashboardAlerts, dashboardInstitutions, dashboardPoint, type DashboardScope, type DashboardPoint } from '../../utils/dashboard-map'

const props = withDefaults(defineProps<{ scope: DashboardScope; institutionId?: string | number | null }>(), { institutionId: null })
const router = useRouter()
const canvas = ref<HTMLElement | null>(null)
const alerts = ref<MapAlert[]>([])
const institutions = ref<Institution[]>([])
const loading = ref(false)
const alertError = ref('')
const institutionError = ref('')
const updatedAt = ref('')
const tilesFailed = ref(false)
const hasContext = computed(() => props.scope === 'admin' || (props.institutionId != null && String(props.institutionId).trim() !== ''))
const mappedAlerts = computed(() => dashboardAlerts(alerts.value))
const scopedInstitutions = computed(() => dashboardInstitutions(institutions.value, props.scope, props.institutionId))
const mappedInstitutions = computed(() => scopedInstitutions.value.flatMap(institution => {
  const point = dashboardPoint(institution.latitud, institution.longitud)
  return point ? [{ institution, point }] : []
}))
const locatedAlerts = computed(() => mappedAlerts.value.filter(item => item.locations.length > 0).length)
const missingAlerts = computed(() => mappedAlerts.value.length - locatedAlerts.value)
const missingInstitutions = computed(() => scopedInstitutions.value.length - mappedInstitutions.value.length)
let map: L.Map | null = null
let markers: L.LayerGroup | null = null
let bounds: L.LatLngBounds | null = null
let observer: ResizeObserver | null = null
let timer: ReturnType<typeof setInterval> | undefined
let controller: AbortController | null = null
let generation = 0
let fitted = false

async function refresh() {
  if (!hasContext.value || loading.value) return
  const version = ++generation
  controller = new AbortController()
  loading.value = true
  const institutionId = props.scope === 'institution' ? String(props.institutionId) : undefined
  const [alertResult, institutionResult] = await Promise.allSettled([
    backendAlertsService.map(institutionId, controller.signal),
    institutionService.getInstitutions(),
  ])
  if (version !== generation) return
  // No mantener marcadores obsoletos cuando falla una de las fuentes.
  alerts.value = alertResult.status === 'fulfilled' ? alertResult.value : []
  institutions.value = institutionResult.status === 'fulfilled' ? institutionResult.value : []
  alertError.value = alertResult.status === 'rejected' ? 'No se pudieron actualizar las alertas del mapa. Pulsa Actualizar mapa para reintentar.' : ''
  institutionError.value = institutionResult.status === 'rejected' ? 'No se pudieron actualizar las instituciones del mapa.' : ''
  updatedAt.value = alertResult.status === 'fulfilled' && institutionResult.status === 'fulfilled'
    ? new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
  loading.value = false
}

function fit() {
  map?.closePopup()
  if (bounds?.isValid()) map?.fitBounds(bounds, { padding: [36, 36], maxZoom: 15, animate: false })
}

function addMarker(point: DashboardPoint, kind: 'alert' | 'institution', title: string, lines: string[], alertId?: string) {
  if (!markers) return
  const popup = document.createElement('div')
  const heading = document.createElement('strong')
  heading.textContent = title
  popup.append(heading)
  for (const text of lines) {
    const line = document.createElement('p')
    line.textContent = text
    popup.append(line)
  }
  if (alertId) {
    const link = document.createElement('a')
    const path = props.scope === 'institution' ? `/institucion/alertas/${encodeURIComponent(alertId)}` : '/super-admin/alertas'
    link.href = router.resolve(path).href
    link.textContent = props.scope === 'institution' ? 'Ver alerta y ruta' : 'Ver alertas del sistema'
    link.className = 'dashboard-popup-link'
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      void router.push(path)
    })
    popup.append(link)
  }
  L.marker(point, {
    icon: L.divIcon({ className: `dashboard-pin dashboard-pin-${kind}`, html: `<span aria-hidden="true">${kind === 'alert' ? '!' : 'I'}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
    title, alt: title, keyboard: true, zIndexOffset: kind === 'alert' ? 100 : 0,
  }).bindPopup(popup, { maxWidth: 260, autoPanPadding: [20, 20] }).addTo(markers)
}

function draw() {
  if (!map || !markers) return
  markers.clearLayers()
  const points: DashboardPoint[] = []
  for (const { institution, point } of mappedInstitutions.value) {
    points.push(point)
    addMarker(point, 'institution', institution.nombre, [institution.tipo.replaceAll('_', ' '), `${institution.estado} · ${institution.disponibilidad.replaceAll('_', ' ')}`, institution.direccion])
  }
  for (const { alert, locations } of mappedAlerts.value) {
    for (const { point, name } of locations) {
      points.push(point)
      addMarker(point, 'alert', `Alerta #${alert.id_alerta}`, [name, `${alert.estado.replaceAll('_', ' ')} · ${alert.clasificacion ?? 'Sin clasificación'}`, `${alert.fecha} · ${alert.hora}`], String(alert.id_alerta))
    }
  }
  bounds = points.length ? L.latLngBounds(points) : null
  if (!fitted && points.length) { fit(); fitted = true }
}

function resetContext() {
  generation++
  controller?.abort()
  alerts.value = []; institutions.value = []; updatedAt.value = ''
  alertError.value = ''; institutionError.value = ''; loading.value = false
  fitted = false
  markers?.clearLayers()
  bounds = null
  map?.setView([-16.505, -68.12], 12, { animate: false })
  void refresh()
}

function refreshWhenVisible() { if (!document.hidden) void refresh() }

watch([() => props.scope, () => props.institutionId], resetContext)
watch([mappedAlerts, mappedInstitutions], draw)
onMounted(() => {
  if (!canvas.value) return
  map = L.map(canvas.value, { scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false }).setView([-16.505, -68.12], 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' })
    .on('tileerror', () => { tilesFailed.value = true }).addTo(map)
  markers = L.layerGroup().addTo(map)
  observer = new ResizeObserver(() => { map?.invalidateSize(); fit() })
  observer.observe(canvas.value)
  void refresh()
  timer = setInterval(refreshWhenVisible, 30_000)
  document.addEventListener('visibilitychange', refreshWhenVisible)
})
onBeforeUnmount(() => {
  generation++; controller?.abort(); clearInterval(timer)
  document.removeEventListener('visibilitychange', refreshWhenVisible)
  observer?.disconnect(); map?.remove(); map = null; markers = null
})
defineExpose({ refresh })
</script>

<template>
  <section class="dashboard-alerts-map min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Mapa de alertas e instituciones">
    <header class="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
      <div>
        <h2 class="text-lg font-extrabold text-slate-900">{{ scope === 'admin' ? 'Alertas activas e instituciones' : 'Mi institución y sus alertas activas' }}</h2>
        <p class="mt-1 text-sm text-slate-600">{{ scope === 'admin' ? 'Ubicación de las alertas actuales y de las instituciones registradas.' : 'Solo las alertas dirigidas a tu institución. El historial permanece en Actividad reciente.' }}</p>
      </div>
      <div class="flex flex-wrap gap-1">
        <button type="button" class="dashboard-map-action" :disabled="!locatedAlerts && !mappedInstitutions.length" @click="fit"><LocateFixed :size="16" aria-hidden="true" /> Ver todo</button>
        <button type="button" class="dashboard-map-action" :disabled="loading || !hasContext" @click="refresh"><RefreshCw :size="16" aria-hidden="true" /> {{ loading ? 'Actualizando…' : 'Actualizar mapa' }}</button>
      </div>
    </header>
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:px-5" aria-label="Leyenda del mapa">
      <span class="flex items-center gap-2"><span class="dashboard-key dashboard-key-alert" aria-hidden="true">!</span> {{ alertError || !hasContext ? 'Alertas no disponibles' : `${locatedAlerts} ${locatedAlerts === 1 ? 'alerta ubicada' : 'alertas ubicadas'}` }}</span>
      <span class="flex items-center gap-2"><span class="dashboard-key dashboard-key-institution" aria-hidden="true">I</span> {{ institutionError || !hasContext ? 'Instituciones no disponibles' : `${mappedInstitutions.length} ${mappedInstitutions.length === 1 ? 'institución ubicada' : 'instituciones ubicadas'}` }}</span>
      <span class="text-xs text-slate-600" role="status">{{ loading ? 'Consultando ubicaciones…' : updatedAt ? `Actualizado a las ${updatedAt}` : 'Sin actualización completa' }} · Consulta cada 30 s</span>
    </div>
    <div v-if="!hasContext || alertError || institutionError" role="alert" class="space-y-1 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p v-if="!hasContext">Tu cuenta no tiene una institución asignada. No se muestran datos de otras instituciones.</p>
      <p v-if="alertError">{{ alertError }}</p><p v-if="institutionError">{{ institutionError }}</p>
    </div>
    <div v-if="hasContext && !loading && !alertError && !institutionError" class="px-4 text-sm text-slate-700">
      <p v-if="!mappedAlerts.length" class="py-3">{{ scope === 'admin' ? 'No hay alertas activas en este momento.' : 'Tu institución no tiene alertas activas en este momento.' }}</p>
      <p v-if="scope === 'institution' && !scopedInstitutions.length" class="py-3">No se encontró la institución asignada a tu cuenta.</p>
      <p v-if="missingAlerts || missingInstitutions" class="py-3">Sin coordenadas válidas: {{ missingAlerts }} {{ missingAlerts === 1 ? 'alerta' : 'alertas' }} y {{ missingInstitutions }} {{ missingInstitutions === 1 ? 'institución' : 'instituciones' }}. No se dibujan ubicaciones aproximadas.</p>
    </div>
    <p v-if="tilesFailed" role="status" class="bg-amber-50 px-4 py-3 text-sm text-amber-900">No se pudo cargar parte del mapa base. Los marcadores conservan sus coordenadas.</p>
    <div ref="canvas" class="dashboard-map-canvas" aria-label="Mapa interactivo de alertas e instituciones"></div>
  </section>
</template>

<style scoped>
.dashboard-map-canvas { height: 360px; width: 100%; background: #eef2f3; }
@media (min-width: 768px) { .dashboard-map-canvas { height: 440px; } }
.dashboard-map-action { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 8px 10px; border-radius: 8px; font-size: 13px; font-weight: 600; color: #334155; }
.dashboard-map-action:hover:not(:disabled) { background: #f1f5f9; }
.dashboard-map-action:disabled { opacity: .5; cursor: not-allowed; }
.dashboard-map-action:focus-visible { outline: 2px solid #9a3412; outline-offset: 2px; }
.dashboard-key { display: inline-grid; place-items: center; width: 20px; height: 20px; color: #fafafa; font-weight: 800; font-size: 12px; }
.dashboard-key-alert { border-radius: 50%; background: #b91c1c; }
.dashboard-key-institution { border-radius: 4px; background: #334155; }
:deep(.dashboard-pin) { display: grid; place-items: center; border: 3px solid #fafafa; color: #fafafa; font-size: 16px; font-weight: 800; box-shadow: 0 1px 4px #17212b55; }
:deep(.dashboard-pin-alert) { border-radius: 50%; background: #b91c1c; }
:deep(.dashboard-pin-institution) { border-radius: 6px; background: #334155; }
:deep(.dashboard-popup-link) { display: inline-flex; align-items: center; min-height: 44px; color: #9a3412; font-weight: 700; }
</style>
