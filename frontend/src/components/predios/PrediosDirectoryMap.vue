<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import { MapPin, MapPinned } from 'lucide-vue-next'
import type { PredioDetail } from '../../services/predio.service'

const props = defineProps<{ items: PredioDetail[] }>()
const emit = defineEmits<{ select: [id: string] }>()
const container = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let layer: L.LayerGroup | null = null
let observer: ResizeObserver | null = null

function position(item: PredioDetail): [number, number] | null {
  if (item.latitud == null || item.longitud == null) return null
  const lat = Number(item.latitud)
  const lng = Number(item.longitud)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null
  return [lat, lng]
}
const mapped = computed(() => props.items.filter(item => position(item) !== null))
const unmapped = computed(() => props.items.length - mapped.value.length)

function draw() {
  if (!map || !layer) return
  layer.clearLayers()
  const bounds: L.LatLngExpression[] = []
  for (const item of mapped.value) {
    const point = position(item)!
    bounds.push(point)
    const marker = L.circleMarker(point, {
      radius: 9, weight: 2, color: '#fff', fillColor: '#ea580c', fillOpacity: 0.95,
    }).addTo(layer)
    const tooltip = document.createElement('div')
    const strong = document.createElement('strong')
    strong.textContent = item.nombre || `Predio #${item.id_predio}`
    const detail = document.createElement('div')
    detail.textContent = [item.tipo_predio, item.direccion].filter(Boolean).join(' · ')
    tooltip.append(strong, detail)
    marker.bindTooltip(tooltip)
    marker.on('click', () => emit('select', item.id_predio))
  }
  if (bounds.length === 1) map.setView(bounds[0]!, 15)
  else if (bounds.length > 1) map.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 15 })
  else map.setView([-16.505, -68.12], 12)
  map.invalidateSize()
}

onMounted(async () => {
  await nextTick()
  if (!container.value) return
  map = L.map(container.value, { scrollWheelZoom: false }).setView([-16.505, -68.12], 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
  layer = L.layerGroup().addTo(map)
  observer = new ResizeObserver(() => map?.invalidateSize())
  observer.observe(container.value)
  draw()
})
watch(() => props.items, () => draw(), { deep: true })
onBeforeUnmount(() => { observer?.disconnect(); map?.remove(); map = null; layer = null })
</script>

<template>
  <section aria-label="Mapa de predios" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
      <div>
        <h2 class="flex items-center gap-2 text-lg font-bold text-slate-900"><MapPinned class="h-5 w-5 text-orange-600" aria-hidden="true" /> Mapa de predios</h2>
        <p class="mt-1 text-sm text-slate-600">{{ mapped.length }} ubicaciones con coordenadas · {{ unmapped }} sin coordenadas</p>
      </div>
      <p class="text-xs text-slate-500">Selecciona un marcador para consultar el predio. Usa la busqueda del directorio para filtrar.</p>
    </div>
    <p v-if="!mapped.length" role="status" class="px-4 pt-4 text-sm text-amber-800">No hay predios con coordenadas válidas entre los resultados actuales.</p>
    <div ref="container" class="h-[340px] w-full sm:h-[480px]" aria-label="Mapa interactivo de predios"></div>
    <div v-if="mapped.length" class="flex flex-wrap items-center gap-2 border-t border-slate-100 p-4">
      <MapPin class="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />
      <span class="mr-1 text-sm font-semibold text-slate-700">Predios visibles:</span>
      <button v-for="item in mapped" :key="item.id_predio" type="button" class="min-h-11 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600" @click="emit('select', item.id_predio)">{{ item.nombre || `Predio #${item.id_predio}` }}</button>
    </div>
  </section>
</template>