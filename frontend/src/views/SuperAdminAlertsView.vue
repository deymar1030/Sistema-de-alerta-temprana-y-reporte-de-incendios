
<script setup lang="ts">
import {
  computed,
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
  Search,
  Flame,
  Clock3,
  Layers3,
  ShieldCheck,
  RadioTower,
  TrendingUp,
  ArrowUpRight,
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


// Filtros locales: no cambian la consulta HTTP ni el estado de los registros.
const searchTerm = ref('')
const filterState = ref<'TODAS' | 'ACTIVAS' | 'FINALIZADAS'>('TODAS')
const terminalStates = ['CERRADA', 'DESCARTADA', 'CANCELADA']
const activeCount = computed(() => alerts.value.filter(a => !terminalStates.includes(a.estado.toUpperCase())).length)
const confirmedCount = computed(() => alerts.value.filter(a => a.estado.toUpperCase() === 'CONFIRMADA').length)
const closedCount = computed(() => alerts.value.filter(a => a.estado.toUpperCase() === 'CERRADA').length)
const filteredAlerts = computed(() => {
  const query = searchTerm.value.trim().toLocaleLowerCase('es-BO').replace(/^alerta\s*#?\s*/, '')
  return alerts.value.filter((alert) => {
    const isTerminal = terminalStates.includes(alert.estado.toUpperCase())
    if (filterState.value === 'ACTIVAS' && isTerminal) return false
    if (filterState.value === 'FINALIZADAS' && !isTerminal) return false
    if (!query) return true
    const text = `${alert.id_alerta} ${alert.estado} ${alert.clasificacion ?? ''}`.toLocaleLowerCase('es-BO')
    return text.includes(query)
  })
})

function readableStatus(value: string): string {
  return value.replace(/_/g, ' ')
}

function statusTone(value: string): string {
  switch (value.toUpperCase()) {
    case 'CONFIRMADA': return 'state-confirmed'
    case 'ATENDIDA': return 'state-progress'
    case 'CERRADA': return 'state-closed'
    case 'DESCARTADA': case 'CANCELADA': return 'state-muted'
    default: return 'state-pending'
  }
}

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
  <!-- Prueba de diseño aislada. La API, los marcadores y el modal existentes se mantienen. -->
  <main class="admin-page alerts-design mx-auto w-full max-w-[1600px]">
    <header class="alerts-heading">
      <div class="alerts-heading-copy">
        <div class="alerts-eyebrow"><span class="alerts-eyebrow-dot" aria-hidden="true"></span>ALERTA / MONITOREO</div>
        <h1>Alertas del sistema<span class="alerts-accent">.</span></h1>
        <p>Supervisa los eventos registrados, consulta sus ubicaciones y revisa los detalles de cada alerta.</p>
      </div>
      <button type="button" class="alerts-refresh" :disabled="loading || mapLoading" @click="refresh()">
        <RefreshCw :size="17" :class="{ 'animate-spin': loading || mapLoading }" aria-hidden="true" />
        {{ loading || mapLoading ? 'Actualizando...' : 'Actualizar datos' }}
      </button>
    </header>

    <div class="alerts-data-strip" role="status">
      <RadioTower :size="17" aria-hidden="true" />
      <strong>Monitoreo conectado al servidor</strong>
      <span class="alerts-strip-divider" aria-hidden="true"></span>
      <span>Sincronización automática cada 45 segundos</span>
      <span class="alerts-strip-count">{{ alerts.length }} alertas registradas</span>
    </div>

    <p v-if="error" class="alerts-inline-error" role="alert">
      <AlertTriangle :size="19" aria-hidden="true" />
      <span><strong>No se pudieron cargar las alertas.</strong> {{ error }}</span>
    </p>

    <section class="alerts-metrics" aria-label="Resumen de alertas">
      <article class="alerts-metric">
        <div class="alerts-metric-top"><span>Total registradas</span><span class="alerts-metric-icon"><Layers3 :size="21" aria-hidden="true" /></span></div>
        <strong class="alerts-metric-value">{{ error ? '—' : alerts.length }}</strong>
        <p>Historial del sistema</p>
      </article>
      <article class="alerts-metric">
        <div class="alerts-metric-top"><span>Confirmadas</span><span class="alerts-metric-icon alerts-metric-danger"><Flame :size="21" aria-hidden="true" /></span></div>
        <strong class="alerts-metric-value">{{ error ? '—' : confirmedCount }}</strong>
        <p>Eventos confirmados</p>
      </article>
      <article class="alerts-metric">
        <div class="alerts-metric-top"><span>Por atender</span><span class="alerts-metric-icon alerts-metric-ember"><AlertTriangle :size="21" aria-hidden="true" /></span></div>
        <strong class="alerts-metric-value">{{ error ? '—' : activeCount }}</strong>
        <p>No cerradas ni descartadas</p>
      </article>
      <article class="alerts-metric">
        <div class="alerts-metric-top"><span>Cerradas</span><span class="alerts-metric-icon alerts-metric-success"><ShieldCheck :size="21" aria-hidden="true" /></span></div>
        <strong class="alerts-metric-value">{{ error ? '—' : closedCount }}</strong>
        <p>Atención finalizada</p>
      </article>
    </section>

    <div class="alerts-panels">
      <section class="alerts-panel alerts-panel-list" aria-labelledby="alerts-list-heading">
        <header class="alerts-panel-heading">
          <div>
            <div class="alerts-kicker"><Clock3 :size="15" aria-hidden="true" /> REGISTRO</div>
            <h2 id="alerts-list-heading">Alertas registradas</h2>
            <p>Consulta los registros sin salir del panel.</p>
          </div>
          <span class="alerts-count-pill">{{ filteredAlerts.length }} resultados</span>
        </header>

        <div class="alerts-filter-area">
          <label for="alerts-search" class="alerts-field-label">Buscar por ID, estado o clasificación</label>
          <div class="alerts-search-field">
            <Search :size="19" aria-hidden="true" />
            <input id="alerts-search" v-model.trim="searchTerm" type="search" autocomplete="off" placeholder="Ej.: alerta #79, incendio..." />
          </div>
          <div class="alerts-filter-buttons" role="group" aria-label="Filtrar por estado">
            <button type="button" :class="{ 'is-active': filterState === 'TODAS' }" :aria-pressed="filterState === 'TODAS'" @click="filterState = 'TODAS'">Todas</button>
            <button type="button" :class="{ 'is-active': filterState === 'ACTIVAS' }" :aria-pressed="filterState === 'ACTIVAS'" @click="filterState = 'ACTIVAS'">Por atender</button>
            <button type="button" :class="{ 'is-active': filterState === 'FINALIZADAS' }" :aria-pressed="filterState === 'FINALIZADAS'" @click="filterState = 'FINALIZADAS'">Finalizadas</button>
          </div>
        </div>

        <div v-if="loading && !alerts.length" class="alerts-list-message" role="status">
          <RefreshCw :size="19" class="animate-spin" aria-hidden="true" /> Consultando alertas del servidor...
        </div>
        <div v-else-if="error" class="alerts-list-message" role="status">No se pudieron recuperar los registros. Prueba con «Actualizar datos».</div>
        <div v-else-if="!alerts.length" class="alerts-list-message" role="status">
          <ShieldCheck :size="22" aria-hidden="true" /> Todavía no hay alertas registradas.
        </div>
        <div v-else-if="!filteredAlerts.length" class="alerts-list-message" role="status">
          <Search :size="21" aria-hidden="true" /> No hay alertas que coincidan con los filtros.
        </div>
        <div v-else class="alerts-list-scroll" tabindex="0" aria-label="Listado desplazable de alertas">
          <article v-for="alert in filteredAlerts" :key="String(alert.id_alerta)" class="alerts-record">
            <div class="alerts-record-icon" aria-hidden="true"><Flame :size="19" /></div>
            <div class="alerts-record-body">
              <div class="alerts-record-heading">
                <strong>Alerta #{{ alert.id_alerta }}</strong>
                <span class="alerts-state" :class="statusTone(alert.estado)"><span class="alerts-state-dot" aria-hidden="true"></span>{{ readableStatus(alert.estado) }}</span>
              </div>
              <p class="alerts-record-classification">{{ alert.clasificacion ?? 'Sin clasificación' }}</p>
              <p class="alerts-record-date"><Clock3 :size="13" aria-hidden="true" /> {{ alert.fecha || 'Sin fecha' }} <span aria-hidden="true">·</span> {{ alert.hora || 'Sin hora' }}</p>
              <p v-if="updatedScoreIds.includes(String(alert.id_alerta))" class="alerts-updated-note"><TrendingUp :size="14" aria-hidden="true" /> Puntaje de confianza actualizado</p>
              <div class="alerts-record-bottom">
                <span>Puntaje: <strong>{{ alert.puntaje == null ? 'No disponible' : alert.puntaje }}</strong></span>
                <button type="button" class="alerts-detail-action" :aria-label="`Ver detalle de alerta ${alert.id_alerta}`" @click="openDetail(String(alert.id_alerta))">
                  Ver detalle <ArrowUpRight :size="16" aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="alerts-panel alerts-panel-map" aria-labelledby="alerts-map-heading">
        <header class="alerts-panel-heading">
          <div>
            <div class="alerts-kicker"><MapPin :size="15" aria-hidden="true" /> UBICACIONES</div>
            <h2 id="alerts-map-heading">Mapa de alertas</h2>
            <p>Ubicaciones reales registradas en el sistema.</p>
          </div>
          <span class="alerts-map-count"><MapPin :size="14" aria-hidden="true" />{{ markerCount }} puntos</span>
        </header>

        <p v-if="mapError" class="alerts-map-message alerts-map-error" role="alert">No se pudieron consultar las ubicaciones: {{ mapError }}</p>
        <p v-else-if="mapLoading" class="alerts-map-message" role="status">Actualizando las ubicaciones del mapa...</p>
        <p v-else-if="markerCount === 0" class="alerts-map-message" role="status">No hay alertas con coordenadas válidas.</p>

        <div class="alerts-map-frame">
          <div ref="mapContainer" class="alerts-map-canvas" aria-label="Mapa interactivo de alertas"></div>
        </div>

        <div class="alerts-map-legend" aria-label="Leyenda de estados">
          <span><i class="legend-dot legend-red" aria-hidden="true"></i>Confirmada</span>
          <span><i class="legend-dot legend-amber" aria-hidden="true"></i>En evaluación</span>
          <span><i class="legend-dot legend-blue" aria-hidden="true"></i>Atendida</span>
          <span><i class="legend-dot legend-gray" aria-hidden="true"></i>Cerrada / descartada</span>
        </div>
        <p class="alerts-map-footnote">Puedes ampliar, desplazarte y consultar cada marcador para ver su ubicación.</p>
      </section>
    </div>

    <!-- Mismo modal con foco, Escape y peticiones del original. Solo se moderniza su presentación. -->
    <Teleport to="body">
      <div v-if="detailModalOpen" class="alerts-backdrop" @click.self="closeDetail">
        <section ref="detailDialog" role="dialog" aria-modal="true" aria-labelledby="alert-detail-title" aria-describedby="alert-detail-description" class="alerts-dialog">
          <header class="alerts-dialog-header">
            <div>
              <div class="alerts-kicker"><Flame :size="15" aria-hidden="true" /> DETALLE / ALERTA</div>
              <h2 id="alert-detail-title">{{ selected ? `Alerta #${selected.id_alerta}` : 'Detalle de alerta' }}</h2>
              <p>Información consultada directamente del servidor.</p>
            </div>
            <button ref="closeDetailButton" type="button" class="alerts-dialog-close" aria-label="Cerrar detalle de alerta" @click="closeDetail"><X :size="21" aria-hidden="true" /></button>
          </header>

          <div id="alert-detail-description" class="alerts-dialog-content">
            <div v-if="detailLoading" class="alerts-list-message" role="status"><RefreshCw :size="19" class="animate-spin" aria-hidden="true" /> Consultando el detalle...</div>
            <p v-else-if="detailError" class="alerts-inline-error" role="alert">{{ detailError }}</p>
            <template v-else-if="selected">
              <div class="alerts-dialog-summary">
                <div class="alerts-detail-field">
                  <span>Estado global</span>
                  <strong><span class="alerts-state" :class="statusTone(selected.estado)"><span class="alerts-state-dot" aria-hidden="true"></span>{{ readableStatus(selected.estado) }}</span></strong>
                </div>
                <div class="alerts-detail-field"><span>Clasificación</span><strong>{{ selected.clasificacion ?? 'Sin clasificar' }}</strong></div>
                <div class="alerts-detail-field"><span>Origen</span><strong>{{ selected.reporte_origen ? 'Reporte ciudadano' : selected.predio ? 'Predio / sensor' : 'No especificado' }}</strong></div>
                <div class="alerts-detail-field"><span>Ubicación</span><strong>{{ selected.predio?.nombre ?? selected.reporte_origen?.ubicacion_tipo ?? 'No disponible' }}</strong></div>
                <div class="alerts-detail-field"><span>Puntaje de confianza</span><strong>{{ selected.puntaje == null ? 'No disponible' : selected.puntaje }}</strong></div>
                <div class="alerts-detail-field"><span>Fecha de registro</span><strong>{{ selected.fecha || 'Sin fecha' }} · {{ selected.hora || 'Sin hora' }}</strong></div>
              </div>

              <section v-if="selected.reporte_origen?.descripcion || safePhotoUrl(selected.reporte_origen?.foto_url)" class="alerts-detail-section" aria-label="Información de reporte ciudadano">
                <h3>Reporte ciudadano</h3>
                <p v-if="selected.reporte_origen?.descripcion">{{ selected.reporte_origen.descripcion }}</p>
                <a v-if="safePhotoUrl(selected.reporte_origen?.foto_url)" class="alerts-evidence-link" :href="safePhotoUrl(selected.reporte_origen?.foto_url) ?? undefined" target="_blank" rel="noopener noreferrer">Ver fotografía registrada <ArrowUpRight :size="16" aria-hidden="true" /></a>
              </section>

              <section class="alerts-detail-section" aria-labelledby="alert-deliveries-title">
                <div class="alerts-detail-section-head"><h3 id="alert-deliveries-title">Instituciones notificadas</h3><span class="alerts-count-pill">{{ selected.instituciones_notificadas?.length ?? 0 }} instituciones</span></div>
                <ul v-if="selected.instituciones_notificadas?.length" class="alerts-deliveries">
                  <li v-for="delivery in selected.instituciones_notificadas" :key="String(delivery.id_institucion)" class="alerts-delivery">
                    <div class="alerts-delivery-top"><strong>{{ delivery.nombre }}</strong><span class="alerts-delivery-badge">{{ readableStatus(delivery.estado) }}</span></div>
                    <span>Envío: {{ dateLabel(delivery.fecha_envio) }}</span>
                    <span>Actualizado: {{ dateLabel(delivery.fecha_actualizacion) }}</span>
                  </li>
                </ul>
                <p v-else class="alerts-empty-delivery">El servidor no devolvió instituciones notificadas para esta alerta.</p>
              </section>
            </template>
          </div>
          <footer class="alerts-dialog-footer"><button type="button" class="alerts-dialog-finish" @click="closeDetail">Cerrar detalle</button></footer>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
/* ALERTA Design / prueba de una sola vista. No modifica estilos globales. */
.alerts-design {
  --a-orange: #c83e12;
  --a-ink: #262626;
  --a-muted: #626970;
  --a-line: #e5e7eb;
  --a-white: #ffffff;
  --a-vellum: #f9f9f9;
  font-family: Inter, Manrope, 'Segoe UI', sans-serif;
  color: var(--a-ink);
  padding: 8px 0 34px;
}
.alerts-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 8px 0 24px; }
.alerts-heading-copy { min-width: 0; }
.alerts-eyebrow, .alerts-kicker { display: flex; align-items: center; gap: 9px; font-size: 12px; font-weight: 750; letter-spacing: .11em; color: #8f513b; }
.alerts-eyebrow-dot { display: inline-block; width: 7px; height: 7px; flex: none; background: #ff4d00; border-radius: 50%; }
.alerts-heading h1 { margin: 12px 0 8px; font-size: clamp(29px, 3.3vw, 43px); line-height: 1.15; font-weight: 750; letter-spacing: -.04em; }
.alerts-accent { color: #f15a2d; }
.alerts-heading-copy p { margin: 0; max-width: 700px; font-size: 15px; line-height: 1.65; color: var(--a-muted); }
.alerts-refresh { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 44px; padding: 10px 18px; flex: none; background: #fff; border: 1px solid #d3d7dc; border-radius: 999px; font-size: 14px; font-weight: 700; color: var(--a-ink); white-space: nowrap; transition: border-color .15s, background-color .15s; }
.alerts-refresh:hover:not(:disabled) { border-color: #e69e81; background: #fff8f5; }
.alerts-refresh:disabled { opacity: .55; cursor: not-allowed; }
.alerts-data-strip { display: flex; flex-wrap: wrap; align-items: center; gap: 11px; padding: 13px 15px; min-height: 49px; background: #fff; border: 1px solid var(--a-line); border-radius: 11px; color: #555c63; font-size: 13px; line-height: 1.45; }
.alerts-data-strip > svg { color: var(--a-orange); flex: none; }
.alerts-data-strip strong { color: #343a40; font-weight: 700; }
.alerts-strip-divider { width: 1px; height: 16px; background: #dadde0; }
.alerts-strip-count { margin-left: auto; font-weight: 700; color: #7c4c3e; }
.alerts-inline-error { display: flex; align-items: start; gap: 10px; margin-top: 14px; padding: 15px; border: 1px solid #fecaca; border-radius: 11px; background: #fff1f2; color: #991b1b; font-size: 14px; line-height: 1.5; }
.alerts-inline-error svg { flex: none; }
.alerts-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin: 20px 0; }
.alerts-metric { min-width: 0; padding: 21px 22px; border: 1px solid var(--a-line); border-radius: 16px; background: #fff; box-shadow: 0 9px 25px -24px rgba(20, 25, 30, .16); }
.alerts-metric-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; min-height: 45px; color: #4c5259; font-size: 13px; font-weight: 700; }
.alerts-metric-icon { display: inline-flex; flex: none; align-items: center; justify-content: center; height: 42px; width: 42px; border-radius: 13px; border: 1px solid #eceff1; background: #f8f9fa; color: #646a71; }
.alerts-metric-danger { background: #fff1f2; border-color: #ffe0e5; color: #b91c1c; }
.alerts-metric-ember { background: #fff4ed; border-color: #ffe7d8; color: #bf4216; }
.alerts-metric-success { background: #f0fdf4; border-color: #dcfce7; color: #166534; }
.alerts-metric-value { display: block; margin-top: 7px; font-size: 35px; line-height: 1.1; font-weight: 760; letter-spacing: -.035em; font-variant-numeric: tabular-nums; }
.alerts-metric > p { margin: 11px 0 0; color: #71777e; font-size: 12px; line-height: 1.5; }
.alerts-panels { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 18px; align-items: start; }
.alerts-panel { min-width: 0; padding: 22px; background: var(--a-white); border: 1px solid var(--a-line); border-radius: 16px; box-shadow: 0 12px 35px -35px rgba(0,0,0,.14); }
.alerts-panel-heading { display: flex; align-items: start; justify-content: space-between; gap: 14px; }
.alerts-kicker { gap: 7px; font-size: 11px; color: #96513d; }
.alerts-panel-heading h2 { margin: 9px 0 5px; font-size: 21px; line-height: 1.2; font-weight: 750; letter-spacing: -.025em; }
.alerts-panel-heading p { margin: 0; color: var(--a-muted); font-size: 13px; line-height: 1.5; }
.alerts-count-pill, .alerts-map-count { display: inline-flex; flex: none; align-items: center; gap: 6px; border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 999px; padding: 7px 11px; color: #575f67; font-size: 12px; font-weight: 700; white-space: nowrap; }
.alerts-filter-area { margin: 20px 0 10px; }
.alerts-field-label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 700; color: #48515a; }
.alerts-search-field { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 14px; border: 1px solid #d6dbe0; border-radius: 11px; color: #68727d; background: #fff; transition: border-color .15s, box-shadow .15s; }
.alerts-search-field:focus-within { border-color: #bb5b39; box-shadow: 0 0 0 3px #fff1e9; }
.alerts-search-field input { width: 100%; min-width: 0; height: 46px; border: 0; outline: 0; background: transparent; color: #262626; font-size: 15px; }
.alerts-search-field input::placeholder { color: #8b949d; }
.alerts-filter-buttons { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
.alerts-filter-buttons button { min-height: 40px; padding: 7px 13px; border: 1px solid #e5e7eb; border-radius: 999px; background: #fafafa; color: #535b63; font-size: 13px; font-weight: 650; transition: background-color .15s, border-color .15s; }
.alerts-filter-buttons button:hover { background: #fff1eb; border-color: #f3cab9; }
.alerts-filter-buttons button.is-active { color: #fff; background: #b73c17; border-color: #b73c17; }
.alerts-list-scroll { max-height: 615px; overflow-y: auto; overscroll-behavior: contain; padding-right: 4px; scrollbar-color: #c8ced2 transparent; }
.alerts-list-message { display: flex; align-items: center; gap: 12px; min-height: 144px; padding: 20px; border: 1px dashed #e5e7eb; border-radius: 12px; background: #fafafa; color: #667079; font-size: 14px; line-height: 1.55; }
.alerts-list-message svg { flex: none; color: #c2410c; }
.alerts-record { display: flex; gap: 13px; border-top: 1px solid #edeff1; padding: 17px 1px 17px 0; }
.alerts-record:first-child { border-top: 0; }
.alerts-record-icon { display: flex; flex: none; align-items: center; justify-content: center; width: 43px; height: 43px; border: 1px solid #ffe4d5; border-radius: 13px; background: #fff4ed; color: #bc4118; }
.alerts-record-body { min-width: 0; flex: 1; }
.alerts-record-heading { display: flex; align-items: center; justify-content: space-between; gap: 9px; flex-wrap: wrap; }
.alerts-record-heading > strong { font-size: 16px; font-weight: 750; color: #262626; }
.alerts-state { display: inline-flex; flex: none; align-items: center; gap: 7px; max-width: 100%; padding: 6px 9px; border: 1px solid transparent; border-radius: 999px; font-size: 11px; font-weight: 750; line-height: 1.35; overflow-wrap: anywhere; }
.alerts-state-dot { width: 7px; height: 7px; flex: none; border-radius: 50%; background: currentColor; }
.state-confirmed { border-color: #fee2e2; background: #fef2f2; color: #b91c1c; }
.state-progress { border-color: #dbeafe; background: #eff6ff; color: #1d4ed8; }
.state-closed { border-color: #dcfce7; background: #f0fdf4; color: #166534; }
.state-muted { border-color: #e5e7eb; background: #f4f5f6; color: #596168; }
.state-pending { border-color: #fde68a; background: #fffbeb; color: #92400e; }
.alerts-record-classification { margin: 6px 0 4px; color: #4e565e; font-size: 14px; font-weight: 600; }
.alerts-record-date { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin: 0; color: #747c84; font-size: 12px; }
.alerts-updated-note { display: flex; align-items: center; gap: 6px; margin: 7px 0 0; color: #166534; font-size: 12px; font-weight: 700; }
.alerts-record-bottom { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 9px; margin-top: 12px; color: #677079; font-size: 12px; }
.alerts-record-bottom strong { color: #31383e; }
.alerts-detail-action { display: inline-flex; min-height: 44px; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 999px; background: transparent; color: #a83711; font-size: 13px; font-weight: 750; }
.alerts-detail-action:hover { background: #fff2ec; }
.alerts-map-count svg { color: #bb411b; }
.alerts-map-message { margin-top: 14px; padding: 10px 12px; color: #6d5860; background: #fff9f0; border: 1px solid #f6e3ca; border-radius: 9px; font-size: 13px; line-height: 1.45; }
.alerts-map-error { color: #991b1b; background: #fff1f2; border-color: #fecaca; }
.alerts-map-frame { overflow: hidden; margin-top: 20px; padding: 5px; border: 1px solid #e5e7eb; border-radius: 13px; background: #f8f9f9; }
.alerts-map-canvas { height: 515px; min-height: 350px; width: 100%; border-radius: 9px; z-index: 0; }
.alerts-map-legend { display: flex; flex-wrap: wrap; gap: 13px 15px; margin-top: 18px; }
.alerts-map-legend > span { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; color: #59636b; }
.legend-dot { width: 9px; height: 9px; flex: none; border-radius: 50%; }
.legend-red { background: #dc2626; }.legend-amber { background: #f59e0b; }.legend-blue { background: #059669; }.legend-gray { background: #64748b; }
.alerts-map-footnote { margin: 15px 0 0; color: #7a838a; font-size: 12px; line-height: 1.5; }
.alerts-backdrop { position: fixed; inset: 0; z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 12px; background: rgba(15, 23, 42, .68); }
.alerts-dialog { display: flex; flex-direction: column; overflow: hidden; width: 100%; max-width: 820px; max-height: 92dvh; border: 1px solid #e5e7eb; border-radius: 18px; background: #fff; box-shadow: 0 30px 80px rgba(9, 13, 19, .22); }
.alerts-dialog-header { display: flex; align-items: start; justify-content: space-between; gap: 16px; flex: none; padding: 22px 25px; border-bottom: 1px solid #e5e7eb; }
.alerts-dialog-header h2 { margin: 8px 0 5px; font-size: 27px; line-height: 1.2; font-weight: 760; letter-spacing: -.03em; }
.alerts-dialog-header p { margin: 0; color: #67717a; font-size: 13px; line-height: 1.5; }
.alerts-dialog-close { display: flex; flex: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 1px solid #e2e6e9; border-radius: 12px; background: #fff; color: #454d55; }
.alerts-dialog-close:hover { background: #fff4ed; border-color: #efc5b3; }
.alerts-dialog-content { min-height: 0; overflow-y: auto; padding: 22px 25px; overscroll-behavior: contain; }
.alerts-dialog-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px; }
.alerts-detail-field { display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: 15px; background: #fafafa; border: 1px solid #eaeced; border-radius: 11px; }
.alerts-detail-field > span { color: #69747c; font-size: 12px; font-weight: 700; }
.alerts-detail-field > strong { color: #242b30; font-size: 15px; font-weight: 700; overflow-wrap: anywhere; }
.alerts-detail-field > strong .alerts-state { vertical-align: middle; }
.alerts-detail-section { margin-top: 18px; padding-top: 18px; border-top: 1px solid #edeff1; }
.alerts-detail-section h3 { margin: 0 0 12px; font-size: 18px; line-height: 1.3; font-weight: 750; }
.alerts-detail-section > p { margin: 0 0 12px; color: #4e5962; font-size: 15px; line-height: 1.6; overflow-wrap: anywhere; }
.alerts-evidence-link { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: #a83b15; font-size: 14px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.alerts-detail-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.alerts-deliveries { display: grid; gap: 9px; padding: 0; margin: 15px 0 0; list-style: none; }
.alerts-delivery { display: flex; flex-direction: column; gap: 6px; padding: 14px; background: #fff; border: 1px solid #e6e9eb; border-radius: 11px; color: #657078; font-size: 12px; line-height: 1.4; }
.alerts-delivery-top { display: flex; justify-content: space-between; align-items: start; gap: 12px; flex-wrap: wrap; }
.alerts-delivery-top strong { font-size: 14px; color: #303840; }
.alerts-delivery-badge { padding: 4px 9px; border-radius: 999px; border: 1px solid #e5e7eb; background: #f8f9fa; color: #586069; font-size: 11px; font-weight: 700; }
.alerts-empty-delivery { color: #657079; font-size: 14px; }
.alerts-dialog-footer { display: flex; justify-content: flex-end; flex: none; padding: 14px 25px; border-top: 1px solid #e5e7eb; }
.alerts-dialog-finish { min-height: 44px; padding: 10px 20px; border-radius: 999px; background: #b73c17; color: #fff; font-size: 14px; font-weight: 750; }
.alerts-dialog-finish:hover { background: #993311; }
.alerts-design button:focus-visible, .alerts-design input:focus-visible, .alerts-design [tabindex]:focus-visible, .alerts-dialog button:focus-visible, .alerts-dialog a:focus-visible { outline: 3px solid #9a3412; outline-offset: 3px; }
@media (max-width: 1200px) { .alerts-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }.alerts-panels { grid-template-columns: 1fr; } .alerts-map-canvas { height: 420px; } .alerts-list-scroll { max-height: 560px; } }
@media (max-width: 680px) { .alerts-design { padding-top: 2px; }.alerts-heading { flex-direction: column; align-items: stretch; gap: 14px; }.alerts-heading-copy p { font-size: 14px; }.alerts-refresh { width: 100%; }.alerts-metrics { gap: 10px; }.alerts-metric { padding: 16px; }.alerts-metric-value { font-size: 30px; }.alerts-metric-top { font-size: 12px; }.alerts-panel { padding: 16px; }.alerts-panel-heading { flex-wrap: wrap; }.alerts-data-strip { gap: 8px; }.alerts-strip-count { margin-left: 0; width: 100%; }.alerts-strip-divider { display: none; }.alerts-map-canvas { height: 355px; }.alerts-list-scroll { max-height: 570px; }.alerts-dialog-header, .alerts-dialog-content { padding: 18px 16px; }.alerts-dialog-footer { padding: 12px 16px; }.alerts-dialog-header h2 { font-size: 23px; }.alerts-dialog-summary { grid-template-columns: 1fr; } .alerts-state { font-size: 10px; } }
@media (max-width: 400px) { .alerts-metrics { grid-template-columns: 1fr; }.alerts-metric { min-height: 125px; }.alerts-record { gap: 9px; }.alerts-record-icon { width: 36px; height: 36px; }.alerts-record-heading { align-items: flex-start; }.alerts-dialog { border-radius: 12px; } }
@media (prefers-reduced-motion: reduce) { .alerts-design *, .alerts-dialog * { animation-duration: .01ms !important; transition: none !important; scroll-behavior: auto !important; } }
</style>
