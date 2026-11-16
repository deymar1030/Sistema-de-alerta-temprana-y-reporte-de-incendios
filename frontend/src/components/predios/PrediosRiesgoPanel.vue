<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import { ChevronLeft, ChevronRight, House, Landmark, LocateFixed } from 'lucide-vue-next'
import { dashboardPoint, type DashboardPoint } from '../../utils/dashboard-map'
import { DEFAULT_COLORS, IRP_LEVELS, IRP_SIN_EVALUAR, baseTileLayer, irpDescripcion, irpLevel, mapIcon } from '../../utils/map-icons'

export interface PredioRiesgoItem {
  id_predio: string
  nombre: string
  tipo_predio: string
  latitud: number | null
  longitud: number | null
  irp: number | null
  direccion?: string | null
  zona?: string | null
}

const props = withDefaults(defineProps<{
  items: PredioRiesgoItem[]
  loading?: boolean
  // Institución de referencia (vista del jefe); null en la vista del admin.
  institution?: { nombre: string; direccion?: string | null; latitud: unknown; longitud: unknown } | null
  emptyText?: string
}>(), { loading: false, institution: null, emptyText: 'No hay predios para mostrar.' })

// #tools: controles en la cabecera de la lista (búsqueda, actualizar).
// #actions="{ predio }": botones por fila (ver, editar, eliminar).
defineSlots<{
  tools?: () => unknown
  actions?: (props: { predio: PredioRiesgoItem }) => unknown
}>()

const PAGE_SIZE = 10
const LEVELS = [...IRP_LEVELS, IRP_SIN_EVALUAR]

const selectedLevels = ref<string[]>([])
const page = ref(1)
const canvas = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let layer: L.LayerGroup | null = null
let observer: ResizeObserver | null = null
let bounds: L.LatLngBounds | null = null
const markersById = new Map<string, L.Marker>()

const located = computed(() => props.items.flatMap(predio => {
  const point = dashboardPoint(predio.latitud, predio.longitud)
  return point ? [{ predio, point }] : []
}))

const levels = computed(() => LEVELS.map(item => ({
  ...item,
  count: props.items.filter(predio => irpLevel(predio.irp).level === item.level).length,
})))

const matchesFilter = (predio: PredioRiesgoItem) =>
  !selectedLevels.value.length || selectedLevels.value.includes(irpLevel(predio.irp).level)

// Sin niveles marcados = se muestran todos. El mapa solo puede dibujar los que tienen coordenadas.
const visible = computed(() => located.value.filter(({ predio }) => matchesFilter(predio)))

// La lista incluye también los predios sin ubicación, para poder editarlos.
// Más riesgosos primero; los no evaluados al final.
const ranking = computed(() => props.items.filter(matchesFilter).sort((a, b) => (b.irp ?? -1) - (a.irp ?? -1)))
const locatedIds = computed(() => new Set(located.value.map(({ predio }) => predio.id_predio)))
const pageCount = computed(() => Math.max(1, Math.ceil(ranking.value.length / PAGE_SIZE)))
const pageItems = computed(() => ranking.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const institutionPoint = computed(() => props.institution ? dashboardPoint(props.institution.latitud, props.institution.longitud) : null)

function toggleLevel(level: string) {
  selectedLevels.value = selectedLevels.value.includes(level)
    ? selectedLevels.value.filter(item => item !== level)
    : [...selectedLevels.value, level]
}

function fit() {
  map?.closePopup()
  if (bounds?.isValid()) map?.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: false })
}

function popupContent(title: string, lines: string[]) {
  const popup = document.createElement('div')
  const heading = document.createElement('strong')
  heading.textContent = title
  popup.append(heading)
  for (const text of lines) {
    const line = document.createElement('p')
    line.textContent = text
    popup.append(line)
  }
  return popup
}

function draw() {
  if (!map || !layer) return
  layer.clearLayers()
  markersById.clear()
  const points: DashboardPoint[] = []
  for (const { predio, point } of visible.value) {
    points.push(point)
    const marker = L.marker(point, { icon: mapIcon('predio', { color: irpLevel(predio.irp).color }), title: predio.nombre, keyboard: true })
      .bindPopup(popupContent(predio.nombre, [predio.tipo_predio.replaceAll('_', ' '), irpDescripcion(predio.irp)]), { maxWidth: 260 })
      .addTo(layer)
    markersById.set(predio.id_predio, marker)
  }
  if (props.institution && institutionPoint.value) {
    points.push(institutionPoint.value)
    L.marker(institutionPoint.value, { icon: mapIcon('institution'), title: props.institution.nombre, zIndexOffset: 1000, keyboard: true })
      .bindPopup(popupContent(props.institution.nombre, ['Tu institución', props.institution.direccion ?? '']), { maxWidth: 260 })
      .addTo(layer)
  }
  bounds = points.length ? L.latLngBounds(points) : null
  fit()
}

function focus(id: string) {
  const marker = markersById.get(id)
  if (!marker || !map) return
  map.setView(marker.getLatLng(), 17, { animate: false })
  marker.openPopup()
  canvas.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

watch(selectedLevels, () => { page.value = 1 })
watch(pageCount, count => { if (page.value > count) page.value = count })
watch([visible, institutionPoint], draw)

onMounted(() => {
  if (!canvas.value) return
  map = L.map(canvas.value, { scrollWheelZoom: true }).setView([-16.505, -68.12], 13)
  baseTileLayer().addTo(map)
  layer = L.layerGroup().addTo(map)
  observer = new ResizeObserver(() => map?.invalidateSize())
  observer.observe(canvas.value)
  draw()
})

onBeforeUnmount(() => { observer?.disconnect(); map?.remove(); map = null; layer = null })
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <section class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Mapa de predios por riesgo">
      <div ref="canvas" class="predios-riesgo-map w-full bg-slate-100" aria-label="Mapa interactivo de predios"></div>
      <p v-if="!loading && !visible.length" class="pointer-events-none absolute inset-x-0 top-4 z-[400] mx-auto w-fit rounded-xl bg-white/95 px-4 py-2 text-sm text-slate-700 shadow">
        {{ located.length ? 'Ningún predio coincide con el filtro.' : 'No hay predios con ubicación registrada.' }}
      </p>

      <!-- Leyenda y filtro a la vez: cada nivel se puede activar/desactivar. -->
      <div class="absolute bottom-6 left-3 z-[400] w-56 rounded-xl border border-white/80 bg-white/95 p-3 text-sm shadow-lg backdrop-blur-sm" role="group" aria-label="Filtrar predios por criticidad">
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Riesgo del predio (IRP)</p>
          <button v-if="selectedLevels.length" type="button" class="text-xs font-semibold text-orange-700 underline" @click="selectedLevels = []">Todos</button>
        </div>
        <ul class="space-y-0.5">
          <li v-for="item in levels" :key="item.level">
            <button
              type="button"
              class="flex min-h-9 w-full items-center gap-2 rounded-lg px-1.5 text-left transition"
              :class="selectedLevels.length && !selectedLevels.includes(item.level) ? 'opacity-40 hover:opacity-70' : 'hover:bg-slate-100'"
              :aria-pressed="selectedLevels.includes(item.level)"
              :title="selectedLevels.includes(item.level) ? `Quitar ${item.label} del filtro` : `Ver solo predios ${item.label.toLowerCase()}`"
              @click="toggleLevel(item.level)"
            >
              <i class="map-legend-key" :style="{ background: item.color }" aria-hidden="true"><House :size="11" /></i>
              <span class="flex-1 text-slate-700" :class="{ 'font-bold text-slate-900': selectedLevels.includes(item.level) }">{{ item.label }}</span>
              <span class="font-bold text-slate-900">{{ item.count }}</span>
            </button>
          </li>
          <li v-if="institution" class="mt-1 flex items-center gap-2 border-t border-slate-200 px-1.5 pt-2 text-slate-700">
            <i class="map-legend-key" :style="{ background: DEFAULT_COLORS.institution }" aria-hidden="true"><Landmark :size="11" /></i>
            Tu institución
          </li>
        </ul>
        <p class="mt-2 text-[11px] leading-snug text-slate-500">Pulsa un nivel para filtrar el mapa y la lista.</p>
      </div>
      <button type="button" class="absolute right-3 top-3 z-[400] inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 text-sm font-semibold text-slate-700 shadow hover:bg-white disabled:opacity-50" :disabled="!visible.length" @click="fit">
        <LocateFixed :size="16" aria-hidden="true" /> Ver todo
      </button>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white" aria-label="Predios ordenados por riesgo">
      <div class="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Predios ordenados por riesgo</h2>
          <p class="text-sm text-slate-500">{{ ranking.length }} {{ ranking.length === 1 ? 'predio' : 'predios' }}</p>
        </div>
        <slot name="tools" />
      </div>
      <p v-if="loading" role="status" class="px-4 py-6 text-sm text-slate-600">Cargando predios...</p>
      <p v-else-if="!ranking.length" class="px-4 py-6 text-sm text-slate-600">{{ items.length ? 'Ningún predio coincide con el filtro de criticidad.' : emptyText }}</p>
      <ul class="divide-y divide-slate-100">
        <li v-for="predio in pageItems" :key="predio.id_predio" class="flex flex-wrap items-center gap-2 pr-3 sm:flex-nowrap">
          <button
            type="button"
            class="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 disabled:cursor-default disabled:hover:bg-transparent"
            :disabled="!locatedIds.has(predio.id_predio)"
            :title="locatedIds.has(predio.id_predio) ? `Ubicar ${predio.nombre} en el mapa` : 'Este predio no tiene ubicación registrada'"
            @click="focus(predio.id_predio)"
          >
            <i class="map-legend-key" :style="{ background: irpLevel(predio.irp).color }" aria-hidden="true"><House :size="12" /></i>
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold text-slate-900">{{ predio.nombre || `Predio #${predio.id_predio}` }}</span>
              <span class="block truncate text-xs text-slate-500">
                {{ [predio.tipo_predio.replaceAll('_', ' '), predio.direccion, predio.zona].filter(Boolean).join(' · ') }}
              </span>
              <span v-if="!locatedIds.has(predio.id_predio)" class="block text-xs font-semibold text-amber-700">Sin ubicación en el mapa</span>
            </span>
            <span class="text-right text-sm">
              <span class="block font-semibold" :style="{ color: irpLevel(predio.irp).color }">{{ irpLevel(predio.irp).label }}</span>
              <span class="block text-xs text-slate-500">{{ predio.irp == null ? 'IRP sin calcular' : `IRP ${predio.irp.toFixed(2)}` }}</span>
            </span>
          </button>
          <div v-if="$slots.actions" class="flex shrink-0 gap-2 pb-2 pl-4 sm:pb-0 sm:pl-0">
            <slot name="actions" :predio="predio" />
          </div>
        </li>
      </ul>
      <nav v-if="pageCount > 1" class="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3" aria-label="Paginación de predios">
        <button type="button" class="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40" :disabled="page === 1" @click="page--">
          <ChevronLeft :size="16" aria-hidden="true" /> Anterior
        </button>
        <span class="text-sm text-slate-600">Página {{ page }} de {{ pageCount }}</span>
        <button type="button" class="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40" :disabled="page === pageCount" @click="page++">
          Siguiente <ChevronRight :size="16" aria-hidden="true" />
        </button>
      </nav>
    </section>
  </div>
</template>

<style scoped>
.predios-riesgo-map { height: 60dvh; min-height: 380px; }
</style>
