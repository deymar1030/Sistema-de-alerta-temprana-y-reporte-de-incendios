
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
} from 'lucide-vue-next'

import {
  backendAlertsService,
  type BackendAlert,
  type MapAlert,
} from '../services/backend-alerts.service'

const alerts = ref<BackendAlert[]>([])
const mapAlerts = ref<MapAlert[]>([])
const selected = ref<BackendAlert | null>(null)

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

function drawAlertMarkers() {
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
  if (points.length === 1) {
    map.setView(points[0]!, 15)
  } else if (points.length > 1) {
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
    alerts.value = await backendAlertsService.list()
  } catch (cause) {
    alerts.value = []
    error.value = errorMessage(cause)
  } finally {
    loading.value = false
  }
}

async function loadMapAlerts() {
  mapLoading.value = true
  mapError.value = ''

  try {
    mapAlerts.value = await backendAlertsService.map()
  } catch (cause) {
    mapAlerts.value = []
    mapError.value = errorMessage(cause)
  } finally {
    mapLoading.value = false
    drawAlertMarkers()
  }
}

async function refresh() {
  await Promise.all([
    loadAlerts(),
    loadMapAlerts(),
  ])
}

async function openDetail(id: string) {
  selected.value = null
  detailError.value = ''
  detailLoading.value = true

  try {
    selected.value =
      await backendAlertsService.detail(id)
  } catch (cause) {
    detailError.value = errorMessage(cause)
  } finally {
    detailLoading.value = false
  }
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
})

onBeforeUnmount(() => {
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
        @click="refresh"
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

    <!-- DETALLE DE UNA ALERTA -->
    <p
      v-if="detailLoading"
      role="status"
      class="text-sm text-slate-600"
    >
      Cargando detalle...
    </p>

    <p
      v-if="detailError"
      role="alert"
      class="text-sm text-red-700"
    >
      {{ detailError }}
    </p>

    <section
      v-if="selected"
      aria-label="Detalle de la alerta"
      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div
        class="flex items-start justify-between gap-2"
      >
        <h2 class="text-xl font-bold text-slate-900">
          Detalle de la alerta #{{ selected.id_alerta }}
        </h2>

        <button
          type="button"
          class="min-h-11 rounded-lg border px-3 py-2 text-slate-700"
          aria-label="Cerrar detalle"
          @click="selected = null"
        >
          Cerrar
        </button>
      </div>

      <p class="mt-3 text-sm text-slate-700">
        Estado global:
        <strong>{{ selected.estado }}</strong>
      </p>

      <p class="mt-1 text-sm text-slate-700">
        Origen:
        {{
          selected.reporte_origen
            ? 'Reporte ciudadano'
            : selected.predio
              ? 'Predio / sensor'
              : 'No especificado'
        }}
      </p>

      <p class="mt-1 text-sm text-slate-700">
        Ubicación:
        {{
          selected.predio?.nombre ??
          selected.reporte_origen?.ubicacion_tipo ??
          'No disponible'
        }}
      </p>

      <p
        v-if="selected.reporte_origen?.descripcion"
        class="mt-1 text-sm text-slate-700"
      >
        Reporte: {{ selected.reporte_origen.descripcion }}
      </p>

      <p
        v-if="safePhotoUrl(selected.reporte_origen?.foto_url)"
        class="mt-1 text-sm text-slate-700"
      >
        Foto registrada:

        <a
          :href="safePhotoUrl(selected.reporte_origen?.foto_url) ?? undefined"
          target="_blank"
          rel="noopener noreferrer"
          class="underline"
        >
          Ver evidencia
        </a>
      </p>

      <h3 class="mt-5 font-semibold text-slate-900">
        Instituciones notificadas
        ({{ selected.instituciones_notificadas?.length ?? 0 }})
      </h3>

      <ul
        v-if="selected.instituciones_notificadas?.length"
        class="mt-2 space-y-2"
      >
        <li
          v-for="delivery in selected.instituciones_notificadas"
          :key="String(delivery.id_institucion)"
          class="rounded-lg border border-slate-200 p-3 text-sm text-slate-700"
        >
          <strong>{{ delivery.nombre }}</strong>
          — {{ delivery.estado }}

          <p>
            Envío: {{ dateLabel(delivery.fecha_envio) }}
          </p>

          <p>
            Actualizado: {{ dateLabel(delivery.fecha_actualizacion) }}
          </p>
        </li>
      </ul>

      <p
        v-else
        class="mt-2 text-sm text-slate-600"
      >
        El backend no devolvió instituciones notificadas
        para esta alerta.
      </p>
    </section>
  </main>
</template>
