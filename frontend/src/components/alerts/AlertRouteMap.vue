<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Expand, Flame, Landmark, LocateFixed, Minimize } from 'lucide-vue-next'
import { DEFAULT_COLORS, baseTileLayer, mapIcon } from '../../utils/map-icons'
import L from 'leaflet'
import type { RouteInfo } from '../../services/backend-alerts.service'
import { gapInMeters, type MapPoint } from '../../utils/alert-route'

const props = defineProps<{ route: RouteInfo | null; destination: MapPoint | null; context: string }>()
const container = ref<HTMLElement | null>(null)
const expanded = ref(false)
const tilesFailed = ref(false)
let map: L.Map | null = null
let layer: L.LayerGroup | null = null
let observer: ResizeObserver | null = null
let lastContext = ''
let hadRoute = false
let bounds: L.LatLngBounds | null = null
const approximate = computed(() => {
  const route = props.route
  if (!route) return false
  return gapInMeters([route.origin.latitude, route.origin.longitude], route.geometry[0]!) > 25 ||
    gapInMeters([route.destination.latitude, route.destination.longitude], route.geometry[route.geometry.length - 1]!) > 25
})

function fit() {
  if (bounds?.isValid()) map?.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: false })
}

function marker(point: MapPoint, label: 'A' | 'B') {
  if (!layer) return
  L.marker(point, {
    icon: label === 'A' ? mapIcon('institution') : mapIcon('alert', { pulse: true }),
    title: label === 'A' ? 'Institución de origen' : 'Lugar de la alerta',
    alt: label === 'A' ? 'Institución de origen' : 'Lugar de la alerta',
    keyboard: true,
    zIndexOffset: label === 'B' ? 1000 : 0,
  }).addTo(layer)
}

function draw() {
  if (!map || !layer) return
  layer.clearLayers()
  const points: MapPoint[] = []
  if (props.route) {
    const route = props.route
    const origin: MapPoint = [route.origin.latitude, route.origin.longitude]
    const destination: MapPoint = [route.destination.latitude, route.destination.longitude]
    points.push(...route.geometry, origin, destination)
    L.polyline(route.geometry, { color: '#fafafa', weight: 8, opacity: 0.95 }).addTo(layer)
    L.polyline(route.geometry, { color: '#245c6f', weight: 5, opacity: 1 }).addTo(layer)
    marker(origin, 'A')
    marker(destination, 'B')
  } else if (props.destination) {
    points.push(props.destination)
    marker(props.destination, 'B')
  }
  bounds = points.length ? L.latLngBounds(points) : null
  const recenter = props.context !== lastContext || (!hadRoute && Boolean(props.route))
  if (recenter) fit()
  lastContext = props.context
  hadRoute = Boolean(props.route)
}

async function toggleExpanded() {
  expanded.value = !expanded.value
  await nextTick()
  map?.invalidateSize()
  fit()
}

onMounted(() => {
  if (!container.value) return
  map = L.map(container.value, { scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false })
    .setView(props.destination ?? [-16.505, -68.12], 13)
  const tiles = baseTileLayer().addTo(map)
  tiles.on('tileerror', () => { tilesFailed.value = true })
  layer = L.layerGroup().addTo(map)
  observer = new ResizeObserver(() => { map?.invalidateSize(); fit() })
  observer.observe(container.value)
  draw()
})
watch(() => [props.route, props.destination, props.context], draw, { deep: true })
onBeforeUnmount(() => { observer?.disconnect(); map?.remove(); map = null; layer = null })
</script>

<template>
  <div class="route-map" :class="{ 'route-map-expanded': expanded }">
    <div class="flex flex-wrap items-center justify-between gap-2 border-y border-slate-200 bg-slate-50 px-4 py-2">
      <span class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-700">
        <span v-if="route" class="flex items-center gap-2"><i class="map-legend-key" :style="{ background: DEFAULT_COLORS.institution }" aria-hidden="true"><Landmark :size="11" /></i>Institución</span>
        <span class="flex items-center gap-2"><i class="map-legend-key map-legend-round" :style="{ background: DEFAULT_COLORS.alert }" aria-hidden="true"><Flame :size="11" /></i>Alerta</span>
        <span v-if="route" class="flex items-center gap-2"><span class="h-1 w-6 rounded bg-[#245c6f]" aria-hidden="true"></span>Recorrido vial calculado</span>
      </span>
      <div class="flex flex-wrap gap-1">
        <button type="button" class="map-action" @click="fit"><LocateFixed class="h-4 w-4" aria-hidden="true" /> Ver recorrido completo</button>
        <button type="button" class="map-action" :aria-expanded="expanded" @click="toggleExpanded"><component :is="expanded ? Minimize : Expand" class="h-4 w-4" aria-hidden="true" /> {{ expanded ? 'Reducir mapa' : 'Ampliar mapa' }}</button>
      </div>
    </div>
    <p v-if="tilesFailed" role="status" class="bg-amber-50 px-4 py-3 text-sm text-amber-900">No se pudo cargar parte del mapa base. Las coordenadas y el recorrido siguen disponibles.</p>
    <div ref="container" class="route-canvas" aria-label="Mapa del recorrido desde la institución hasta la alerta."></div>
    <p v-if="approximate" class="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">La vía calculada no coincide exactamente con uno de los puntos. El acceso entre la vía y ese punto no está incluido en el recorrido.</p>
  </div>
</template>

<style scoped>
.route-canvas { height: 340px; width: 100%; background: #eef2f3; }
@media (min-width: 1024px) { .route-canvas { height: 480px; } }
.route-map-expanded .route-canvas { height: 70dvh; min-height: 340px; }
.map-action { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 8px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; color: #334155; }
.map-action:hover { background: #e2e8f0; }
.map-action:focus-visible { outline: 2px solid #9a3412; outline-offset: 2px; }
</style>
