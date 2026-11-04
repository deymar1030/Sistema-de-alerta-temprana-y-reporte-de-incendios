
<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import L from 'leaflet'
import {
  AlertTriangle,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-vue-next'

import {
  backendAlertsService,
  type BackendAlert,
  type MapAlert,
} from '../services/backend-alerts.service'

const alerts = ref<BackendAlert[]>([])
const updatedScoreIds = ref<string[]>([])
let pollTimer: ReturnType<typeof setInterval> | null = null
const mapAlerts = ref<MapAlert[]>([])
const selected = ref<BackendAlert | null>(null)
const detailModalOpen = ref(false)
const detailDialog = ref<HTMLElement | null>(null)
const closeDetailButton = ref<HTMLButtonElement | null>(null)
let focusBeforeDetail: HTMLElement | null = null
let bodyOverflowBeforeDetail = ''
let detailRequestVersion = 0

const loading = ref(false)
const detailLoading = ref(false)
const mapLoading = ref(false)

const error = ref('')
const detailError = ref('')
const mapError = ref('')
const markerCount = ref(0)

const mapContainer = ref<HTMLElement | null>(null)

let map: L.Map | null = null
let markers: L.LayerGroup | null = null
let resizeObserver: ResizeObserver | null = null


function errorMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : 'Ocurrió un error inesperado.'
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const codes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return codes[char] ?? char
  })
}

function coordinates(
  lat: unknown,
  lng: unknown
): [number, number] | null {
  if (
    lat == null ||
    lng == null ||
    lat === '' ||
    lng === ''
  ) {
    return null
  }

  const latitude = Number(lat)
  const longitude = Number(lng)

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return null
  }

  return [latitude, longitude]
}

function alertColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'CONFIRMADA':
      return '#dc2626'

    case 'EN_EVALUACION':
      return '#f59e0b'

    case 'ATENDIDA':
      return '#059669'

    case 'CERRADA':
    case 'DESCARTADA':
    case 'CANCELADA':
      return '#64748b'

    default:
      return '#ea580c'
  }
}

function drawAlertMarkers(recenter = true) {
  if (!map || !markers) return

  markers.clearLayers()
  markerCount.value = 0

  const points: [number, number][] = []

  for (const alert of mapAlerts.value) {
    for (const location of alert.ubicaciones ?? []) {
      const point = coordinates(
        location.latitud,
        location.longitud
      )

      if (!point) continue

      const locationName =
        location.nombre ||
        (
          location.id_predio != null
            ? `Predio #${location.id_predio}`
            : 'Ubicación sin nombre'
        )

      const date = [
        alert.fecha,
        alert.hora,
      ].filter(Boolean).join(' ')

      const popup = `
        <div style="min-width:180px;line-height:1.5">
          <strong>
            Alerta #${escapeHtml(alert.id_alerta)}
          </strong>

          <div>
            <b>Estado:</b>
            ${escapeHtml(alert.estado)}
          </div>

          <div>
            <b>Clasificación:</b>
            ${escapeHtml(alert.clasificacion ?? 'Sin clasificar')}
          </div>

          <div>
            <b>Ubicación:</b>
            ${escapeHtml(locationName)}
          </div>

          <div>
            <b>Origen:</b>
            ${escapeHtml(location.origen)}
          </div>

          <div>
            <b>Fecha:</b>
            ${escapeHtml(date || 'Sin fecha')}
          </div>
        </div>
      `

      L.circleMarker(point, {
        radius: 11,
        color: '#ffffff',
        weight: 3,
        fillColor: alertColor(alert.estado),
        fillOpacity: 0.95,
      })
        .bindPopup(popup)
        .addTo(markers)

      points.push(point)
      markerCount.value += 1
    }
  }

  // Centrar el mapa en las ubicaciones reales.
  if (recenter && points.length === 1) {
    map.setView(points[0]!, 15)
  } else if (recenter && points.length > 1) {
    map.fitBounds(points, {
      padding: [30, 30],
      maxZoom: 15,
    })
  }
}

async function loadAlerts() {
  loading.value = true
  error.value = ''

  try {
    const next = await backendAlertsService.list()
    const previous = new Map(alerts.value.map(item => [String(item.id_alerta), item.puntaje]))
    // La misma alerta puede recibir mayor confianza sin generar otro ID.
    updatedScoreIds.value = next
      .filter(item => previous.has(String(item.id_alerta)) &&
        previous.get(String(item.id_alerta)) !== null && item.puntaje !== null &&
        Number(previous.get(String(item.id_alerta))) < Number(item.puntaje))
      .map(item => String(item.id_alerta))
    alerts.value = next
  } catch (cause) {
    alerts.value = []
    error.value = errorMessage(cause)
  } finally {
    loading.value = false
  }
}

async function loadMapAlerts(recenter = true) {
  mapLoading.value = true
  mapError.value = ''

  try {
    mapAlerts.value = await backendAlertsService.map()
  } catch (cause) {
    mapAlerts.value = []
    mapError.value = errorMessage(cause)
  } finally {
    mapLoading.value = false
    drawAlertMarkers(recenter)
  }
}

async function refresh(silent = false) {
  await Promise.all([
    loadAlerts(),
    loadMapAlerts(!silent),
  ])
}

async function openDetail(id: string) {
  const requestVersion = ++detailRequestVersion
  selected.value = null
  detailError.value = ''
  detailLoading.value = true
  focusBeforeDetail = document.activeElement instanceof HTMLElement ? document.activeElement : null
  bodyOverflowBeforeDetail = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  detailModalOpen.value = true
  await nextTick()
  closeDetailButton.value?.focus()

  try {
    const result = await backendAlertsService.detail(id)
    if (requestVersion === detailRequestVersion) selected.value = result
  } catch (cause) {
    if (requestVersion === detailRequestVersion) detailError.value = errorMessage(cause)
  } finally {
    if (requestVersion === detailRequestVersion) detailLoading.value = false
  }
}

function closeDetail() {
  ++detailRequestVersion
  detailModalOpen.value = false
  selected.value = null
  detailError.value = ''
  detailLoading.value = false
  document.body.style.overflow = bodyOverflowBeforeDetail
  void nextTick(() => focusBeforeDetail?.focus())
}

function onDialogKeydown(event: KeyboardEvent) {
  if (!detailModalOpen.value) return
  if (event.key === 'Escape') { event.preventDefault(); closeDetail(); return }
  if (event.key !== 'Tab' || !detailDialog.value) return
  const focusable = [...detailDialog.value.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled)')]
    .filter(item => item.getClientRects().length > 0)
  if (!focusable.length) return
  const first = focusable[0]!, last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}

function safePhotoUrl(
  value?: string | null
): string | null {
  if (!value) return null

  try {
    const candidate = new URL(
      value,
      window.location.origin
    )

    return ['http:', 'https:'].includes(candidate.protocol)
      ? candidate.href
      : null
  } catch {
    return null
  }
}

function dateLabel(
  value?: string | null
): string {
  if (!value) return 'Sin fecha'

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString('es-BO')
}

onMounted(async () => {
  document.addEventListener('keydown', onDialogKeydown)
  await nextTick()

  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {
    zoomControl: true,
    scrollWheelZoom: false,
  }).setView([-16.505, -68.12], 12)

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }
  ).addTo(map)

  markers = L.layerGroup().addTo(map)

  resizeObserver = new ResizeObserver(() => {
    map?.invalidateSize()
  })

  resizeObserver.observe(mapContainer.value)

  await refresh()

  map?.invalidateSize()
  // Sin cliente Socket.IO en la versión suministrada: sincronización periódica.
  // Nunca crea alertas locales; GET /alertas entrega los IDs persistidos.
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && !loading.value && !mapLoading.value) {
      void refresh(true)
    }
  }, 45_000)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDialogKeydown)
  if (detailModalOpen.value) document.body.style.overflow = bodyOverflowBeforeDetail
  if (pollTimer) clearInterval(pollTimer)
  resizeObserver?.disconnect()
  map?.remove()

  map = null
  markers = null
})
</script>

<template>
  <main
    class="admin-page mx-auto max-w-[1600px] space-y-5 p-3 sm:p-6"
  >
    <header
      class="flex flex-wrap items-center justify-between gap-3"
    >
      <div>
        <h1
          class="text-2xl font-extrabold text-slate-900 sm:text-3xl"
        >
          Alertas del sistema
        </h1>

        <p class="mt-2 text-sm text-slate-600">
          Información real del backend. Cada marcador
          corresponde a una ubicación registrada.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        :disabled="loading || mapLoading"
        @click="refresh()"
      >
        <RefreshCw
          class="h-4 w-4"
          :class="{
            'animate-spin': loading || mapLoading
          }"
        />
        Actualizar
      </button>
    </header>

    <!-- MAPA DE ALERTAS -->
    <section
      aria-label="Mapa de alertas"
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div
        class="mb-3 flex flex-wrap items-center justify-between gap-2"
      >
        <div>
          <h2
            class="flex items-center gap-2 text-lg font-bold text-slate-900"
          >
            <MapPin class="h-5 w-5 text-orange-600" />
            Ubicación de las alertas
          </h2>

          <p class="mt-1 text-xs text-slate-500">
            {{ markerCount }} ubicaciones con coordenadas válidas
          </p>
        </div>

        
        <span
          class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
        >
          {{
            mapLoading
              ? 'Actualizando ubicaciones...'
              : mapError
                ? 'No se pudieron actualizar'
                : 'Datos del servidor'
          }}
        </span>

      </div>

      <p
        v-if="mapError"
        role="alert"
        class="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
      >
        No se pudo cargar el mapa de alertas:
        {{ mapError }}
      </p>

      <p
        v-else-if="mapLoading"
        role="status"
        class="mb-3 text-sm text-slate-600"
      >
        Consultando ubicaciones...
      </p>

      <p
        v-else-if="markerCount === 0"
        class="mb-3 text-sm text-slate-600"
      >
        El backend no devolvió alertas con coordenadas válidas.
      </p>

      <div
        ref="mapContainer"
        class="h-[340px] w-full rounded-xl sm:h-[440px]"
        aria-label="Mapa interactivo de alertas"
      ></div>

      <!-- LEYENDA -->
      <div
        class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600"
      >
        <span class="flex items-center gap-2">
          <i class="h-3 w-3 rounded-full bg-red-600"></i>
          Confirmada
        </span>

        <span class="flex items-center gap-2">
          <i class="h-3 w-3 rounded-full bg-amber-500"></i>
          En evaluación
        </span>

        <span class="flex items-center gap-2">
          <i class="h-3 w-3 rounded-full bg-emerald-600"></i>
          Atendida
        </span>

        <span class="flex items-center gap-2">
          <i class="h-3 w-3 rounded-full bg-slate-500"></i>
          Cerrada / descartada
        </span>
      </div>
    </section>

    <!-- LISTADO DE ALERTAS -->
    <section
      aria-label="Directorio de alertas"
      class="space-y-3"
    >
      <h2
        class="flex items-center gap-2 text-lg font-bold text-slate-900"
      >
        <AlertTriangle class="h-5 w-5 text-orange-600" />

        Alertas registradas ({{ alerts.length }})
      </h2>

      <p
        v-if="loading"
        role="status"
        class="text-sm text-slate-600"
      >
        Consultando alertas...
      </p>

      <p
        v-if="error"
        role="alert"
        class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        {{ error }}
      </p>

      <p
        v-if="!loading && !error && !alerts.length"
        class="rounded-xl bg-slate-50 p-4 text-sm text-slate-600"
      >
        No hay alertas registradas.
      </p>

      <div
        v-if="!loading && !error"
        class="grid gap-3 md:grid-cols-2"
      >
        <article
          v-for="alert in alerts"
          :key="String(alert.id_alerta)"
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div
            class="flex items-start justify-between gap-3"
          >
            <strong class="text-lg text-slate-900">
              Alerta #{{ alert.id_alerta }}
            </strong>

            <span
              class="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-900"
            >
              {{ alert.estado }}
            </span>
          </div>

          <p class="mt-3 text-sm text-slate-700">
            Clasificación:
            {{ alert.clasificacion ?? 'Sin clasificar' }}
          </p>

          <p class="mt-1 text-sm text-slate-600">
            Puntaje:
            {{ alert.puntaje == null ? 'No disponible' : alert.puntaje }}
          </p>

          <p v-if="updatedScoreIds.includes(String(alert.id_alerta))" class="mt-1 text-xs font-semibold text-emerald-700">
            Puntaje actualizado en el servidor (sin duplicar la alerta)
          </p>
          <p class="mt-1 text-sm text-slate-600">
            Fecha: {{ alert.fecha }} {{ alert.hora }}
          </p>

          <button
            type="button"
            class="mt-4 min-h-11 font-semibold text-orange-700 underline underline-offset-4"
            @click="openDetail(String(alert.id_alerta))"
          >
            Ver detalle real
          </button>
        </article>
      </div>
    </section>

    <!-- Detalle en modal: visible inmediatamente, incluso con cientos de alertas. -->
    <Teleport to="body">
      <div v-if="detailModalOpen" class="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/65 p-3 sm:p-6" @click.self="closeDetail">
        <section ref="detailDialog" role="dialog" aria-modal="true" aria-labelledby="alert-detail-title" aria-describedby="alert-detail-description" class="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header class="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-wider text-orange-600">Monitoreo de alertas</p>
              <h2 id="alert-detail-title" class="mt-1 text-xl font-extrabold text-slate-900">{{ selected ? `Detalle de la alerta #${selected.id_alerta}` : 'Detalle de alerta' }}</h2>
            </div>
            <button ref="closeDetailButton" type="button" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100" aria-label="Cerrar detalle" @click="closeDetail"><X class="h-5 w-5" aria-hidden="true" /></button>
          </header>
          <div id="alert-detail-description" class="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
            <p v-if="detailLoading" role="status" class="py-8 text-center text-sm text-slate-600">Consultando detalle en el servidor...</p>
            <div v-else-if="detailError" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{{ detailError }}</div>
            <template v-else-if="selected">
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-xl bg-slate-50 p-4"><p class="text-xs font-bold uppercase tracking-wider text-slate-500">Estado global</p><p class="mt-1 text-lg font-extrabold text-slate-900">{{ selected.estado }}</p></div>
                <div class="rounded-xl bg-slate-50 p-4"><p class="text-xs font-bold uppercase tracking-wider text-slate-500">Origen</p><p class="mt-1 font-semibold text-slate-900">{{ selected.reporte_origen ? 'Reporte ciudadano' : selected.predio ? 'Predio / sensor' : 'No especificado' }}</p></div>
                <div class="rounded-xl bg-slate-50 p-4"><p class="text-xs font-bold uppercase tracking-wider text-slate-500">Ubicación</p><p class="mt-1 break-words text-sm text-slate-900">{{ selected.predio?.nombre ?? selected.reporte_origen?.ubicacion_tipo ?? 'No disponible' }}</p></div>
                <div class="rounded-xl bg-slate-50 p-4"><p class="text-xs font-bold uppercase tracking-wider text-slate-500">Puntaje de confianza</p><p class="mt-1 text-lg font-extrabold text-slate-900">{{ selected.puntaje == null ? 'No disponible' : selected.puntaje }}</p></div>
              </div>
              <div v-if="selected.reporte_origen?.descripcion || safePhotoUrl(selected.reporte_origen?.foto_url)" class="mt-4 space-y-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
                <p v-if="selected.reporte_origen?.descripcion"><strong>Reporte:</strong> {{ selected.reporte_origen.descripcion }}</p>
                <p v-if="safePhotoUrl(selected.reporte_origen?.foto_url)"><strong>Foto registrada:</strong> <a class="font-semibold text-orange-700 underline" :href="safePhotoUrl(selected.reporte_origen?.foto_url) ?? undefined" target="_blank" rel="noopener noreferrer">Ver evidencia</a></p>
              </div>
              <h3 class="mt-6 text-base font-bold text-slate-900">Instituciones notificadas ({{ selected.instituciones_notificadas?.length ?? 0 }})</h3>
              <ul v-if="selected.instituciones_notificadas?.length" class="mt-3 space-y-2">
                <li v-for="delivery in selected.instituciones_notificadas" :key="String(delivery.id_institucion)" class="rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                  <p class="font-semibold text-slate-900">{{ delivery.nombre }} <span class="font-normal text-slate-500">— {{ delivery.estado }}</span></p>
                  <p class="mt-1">Envío: {{ dateLabel(delivery.fecha_envio) }}</p>
                  <p>Actualizado: {{ dateLabel(delivery.fecha_actualizacion) }}</p>
                </li>
              </ul>
              <p v-else class="mt-2 text-sm text-slate-600">El servidor no devolvio instituciones notificadas para esta alerta.</p>
            </template>
          </div>
          <footer class="flex shrink-0 justify-end border-t border-slate-200 px-5 py-3 sm:px-6"><button type="button" class="min-h-11 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700" @click="closeDetail">Cerrar detalle</button></footer>
        </section>
      </div>
    </Teleport>
  </main>
</template>