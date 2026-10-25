<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L, { type LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, MapPin } from 'lucide-vue-next'

const props = defineProps<{ latitud: number | null; longitud: number | null }>()
const emit = defineEmits<{
  'update:latitud': [value: number | null]
  'update:longitud': [value: number | null]
}>()

const element = ref<HTMLElement | null>(null)
const geolocationError = ref('')
const obtainingLocation = ref(false)
let map: L.Map | null = null
let marker: L.CircleMarker | null = null

function valid(lat: number | null, lng: number | null): boolean {
  return lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

function selectLocation(lat: number, lng: number) {
  emit('update:latitud', Number(lat.toFixed(7)))
  emit('update:longitud', Number(lng.toFixed(7)))
}

function updateMarker() {
  if (!map) return
  if (valid(props.latitud, props.longitud)) {
    const point: L.LatLngExpression = [props.latitud!, props.longitud!]
    if (!marker) {
      marker = L.circleMarker(point, {
        radius: 9, weight: 3, color: '#ea580c',
        fillColor: '#fff7ed', fillOpacity: 1,
      }).addTo(map)
    } else marker.setLatLng(point)
  } else if (marker) {
    marker.remove()
    marker = null
  }
}

function useMyLocation() {
  geolocationError.value = ''
  if (!navigator.geolocation) {
    geolocationError.value = 'El navegador no permite geolocalización. Elige un punto en el mapa.'
    return
  }
  obtainingLocation.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      selectLocation(coords.latitude, coords.longitude)
      map?.setView([coords.latitude, coords.longitude], 16)
      obtainingLocation.value = false
    },
    () => {
      geolocationError.value = 'No se pudo obtener la ubicación. Puedes marcar el punto o ingresar coordenadas.'
      obtainingLocation.value = false
    },
    { enableHighAccuracy: true, timeout: 12000 },
  )
}

function updateCoordinate(type: 'latitud' | 'longitud', event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const value = raw === '' ? null : Number(raw)
  if (type === 'latitud') emit('update:latitud', value)
  else emit('update:longitud', value)
}

onMounted(async () => {
  await nextTick()
  if (!element.value) return
  const hasPoint = valid(props.latitud, props.longitud)
  const center: L.LatLngExpression = hasPoint
    ? [props.latitud!, props.longitud!] : [-16.5, -68.15]
  // El centro del mapa es visual. Nunca se envía como ubicación seleccionada.
  map = L.map(element.value, { scrollWheelZoom: false })
    .setView(center, hasPoint ? 15 : 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
  map.on('click', (event: LeafletMouseEvent) => {
    selectLocation(event.latlng.lat, event.latlng.lng)
  })
  updateMarker()
  // Redibuja las baldosas si el modal apareció inmediatamente antes.
  requestAnimationFrame(() => map?.invalidateSize())
})

watch(() => [props.latitud, props.longitud], updateMarker)
onBeforeUnmount(() => { map?.remove(); map = null })
</script>

<template>
  <div class="min-w-0 space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <span class="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
        <MapPin class="h-4 w-4 text-orange-600" /> Seleccionar ubicación (opcional)
      </span>
      <button
        type="button"
        class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        :disabled="obtainingLocation"
        @click="useMyLocation"
      >
        <LocateFixed class="h-4 w-4" />
        {{ obtainingLocation ? 'Buscando ubicación...' : 'Usar mi ubicación' }}
      </button>
    </div>

    <div
      ref="element"
      class="location-picker-map h-52 w-full overflow-hidden rounded-xl border border-slate-200 sm:h-60"
      role="region"
      aria-label="Mapa interactivo para seleccionar ubicación"
    ></div>
    <p class="text-sm leading-relaxed text-slate-600">
      Haz clic en el mapa o escribe ambas coordenadas. Desplazar el mapa no selecciona una ubicación.
    </p>
    <p v-if="geolocationError" role="alert" class="break-words text-sm text-amber-800">
      {{ geolocationError }}
    </p>
    <div class="grid min-w-0 gap-3 sm:grid-cols-2">
      <label class="block min-w-0 text-sm font-medium text-slate-700">
        Latitud
        <input
          :value="latitud ?? ''" type="number" step="any" min="-90" max="90"
          placeholder="Ej.: -16.5" class="form-input mt-1"
          @input="updateCoordinate('latitud', $event)"
        />
      </label>
      <label class="block min-w-0 text-sm font-medium text-slate-700">
        Longitud
        <input
          :value="longitud ?? ''" type="number" step="any" min="-180" max="180"
          placeholder="Ej.: -68.15" class="form-input mt-1"
          @input="updateCoordinate('longitud', $event)"
        />
      </label>
    </div>
    <p v-if="latitud !== null || longitud !== null" class="text-sm" :class="valid(latitud, longitud) ? 'text-emerald-700' : 'text-amber-800'">
      {{ valid(latitud, longitud) ? 'Ubicación seleccionada correctamente.' : 'Completa ambos valores dentro del rango permitido o deja los dos vacíos.' }}
    </p>
    <button
      v-if="latitud !== null || longitud !== null"
      type="button" class="min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-600 underline hover:text-slate-900"
      @click="emit('update:latitud', null); emit('update:longitud', null)"
    >
      Quitar la selección del formulario
    </button>
  </div>
</template>