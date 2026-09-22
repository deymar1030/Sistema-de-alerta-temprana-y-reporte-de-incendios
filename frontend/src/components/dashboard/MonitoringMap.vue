<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import { sensorsMock } from '../../mocks/sensors'
import { incidentsMock } from '../../mocks/incidents'
import { institutionsMock } from '../../mocks/institutions'
import { citizenReportsMock } from '../../mocks/citizenReports'

const props = withDefaults(defineProps<{
  showSensors?: boolean
  showIncidents?: boolean
  showInstitutions?: boolean
  showReports?: boolean
  heightClass?: string
  focusLat?: number
  focusLng?: number
  focusZoom?: number
}>(), {
  showSensors: true,
  showIncidents: true,
  showInstitutions: true,
  showReports: false,
  heightClass: 'h-[430px]',
  focusZoom: 14,
})

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let sensorLayer: L.LayerGroup | null = null
let incidentLayer: L.LayerGroup | null = null
let institutionLayer: L.LayerGroup | null = null
let reportLayer: L.LayerGroup | null = null

const sensorColors: Record<string, string> = {
  normal: '#47836b', warning: '#f2c94c', high: '#f4a259', critical: '#e4473d',
}
const incidentColors: Record<string, string> = {
  normal: '#47836b', warning: '#f2c94c', high: '#f4a259', critical: '#e4473d',
}

const popup = (title: string, rows: Array<[string, string]>) => `
  <div class="map-popup" style="color:#17212b;font-family:Manrope,Segoe UI,sans-serif;min-width:190px">
    <strong style="font-size:14px">${title}</strong>
    ${rows.map(([label, value]) => `<div style="margin-top:6px;font-size:12px;color:#58666f"><span style="font-weight:600;color:#17212b">${label}:</span> ${value}</div>`).join('')}
  </div>`

const rebuildLayers = () => {
  if (!map || !sensorLayer || !incidentLayer || !institutionLayer || !reportLayer) return
  sensorLayer.clearLayers(); incidentLayer.clearLayers(); institutionLayer.clearLayers(); reportLayer.clearLayers()

  if (props.showSensors) {
    sensorsMock.forEach((sensor) => {
      L.circleMarker([sensor.lat, sensor.lng], {
        radius: 9, color: '#ffffff', weight: 3, fillColor: sensorColors[sensor.riesgo], fillOpacity: 0.96,
      }).bindPopup(popup(sensor.nombre, [
        ['Sensor', sensor.id_sensor], ['Estado', sensor.estado], ['Lectura', `${sensor.ultima_lectura} ${sensor.unidad_medida}`], ['Riesgo', sensor.riesgo], ['Ubicación', sensor.ubicacion],
      ])).addTo(sensorLayer as L.LayerGroup)
    })
  }

  if (props.showIncidents) {
    incidentsMock.filter((incident) => !['CERRADA', 'CANCELADA', 'FALSA_ALARMA'].includes(incident.status)).forEach((incident) => {
      L.circleMarker([incident.latitud, incident.longitud], {
        radius: 14, color: '#ffffff', weight: 4, fillColor: incidentColors[incident.riesgo], fillOpacity: 0.95,
      }).bindPopup(popup(`⚠ ${incident.id}`, [
        ['Estado', incident.status], ['Riesgo', incident.riesgo], ['Origen', incident.origen], ['Ubicación', incident.ubicacion],
      ])).addTo(incidentLayer as L.LayerGroup)
    })
  }

  if (props.showInstitutions) {
    institutionsMock.forEach((institution) => {
      const color = institution.disponibilidad === 'DISPONIBLE' ? '#335f76' : institution.disponibilidad === 'ATENDIENDO' ? '#f4a259' : '#94a3b8'
      L.circleMarker([institution.latitud, institution.longitud], {
        radius: 8, color: '#ffffff', weight: 3, fillColor: color, fillOpacity: 0.94,
      }).bindPopup(popup(institution.nombre, [
        ['Tipo', institution.tipo], ['Disponibilidad', institution.disponibilidad], ['Teléfono', institution.telefono], ['Dirección', institution.direccion],
      ])).addTo(institutionLayer as L.LayerGroup)
    })
  }

  if (props.showReports) {
    citizenReportsMock.filter((report) => !['DESCARTADO', 'ATENDIDO'].includes(report.status)).forEach((report) => {
      L.circleMarker([report.latitud, report.longitud], {
        radius: 10, color: '#ffffff', weight: 3, fillColor: '#b7791f', fillOpacity: 0.92,
      }).bindPopup(popup(report.id, [
        ['Estado', report.status], ['Ubicación', report.ubicacion], ['Descripción', report.descripcion],
      ])).addTo(reportLayer as L.LayerGroup)
    })
  }
}

const applyFocus = () => {
  if (!map || props.focusLat === undefined || props.focusLng === undefined) return
  map.setView([props.focusLat, props.focusLng], props.focusZoom)
}

onMounted(() => {
  if (!mapContainer.value) return
  map = L.map(mapContainer.value, { zoomControl: true, scrollWheelZoom: true }).setView([-16.505, -68.12], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors', maxZoom: 19,
  }).addTo(map)
  sensorLayer = L.layerGroup().addTo(map)
  incidentLayer = L.layerGroup().addTo(map)
  institutionLayer = L.layerGroup().addTo(map)
  reportLayer = L.layerGroup().addTo(map)
  rebuildLayers()
  applyFocus()
  setTimeout(() => map?.invalidateSize(), 80)
})

watch(() => [props.showSensors, props.showIncidents, props.showInstitutions, props.showReports], rebuildLayers)
watch(() => [props.focusLat, props.focusLng], applyFocus)

onBeforeUnmount(() => { map?.remove(); map = null })
</script>

<template>
  <div :class="['relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm', heightClass]">
    <div ref="mapContainer" class="h-full w-full"></div>
    <div class="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-xl border border-white/80 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
      <p class="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Leyenda</p>
      <div class="grid gap-1.5 text-[11px] text-slate-700 sm:grid-cols-2">
        <span v-if="showSensors" class="flex items-center gap-2"><i class="h-2.5 w-2.5 rounded-full bg-emerald-600"></i>Sensores</span>
        <span v-if="showIncidents" class="flex items-center gap-2"><i class="h-2.5 w-2.5 rounded-full bg-red-500"></i>Peligro / incidente</span>
        <span v-if="showInstitutions" class="flex items-center gap-2"><i class="h-2.5 w-2.5 rounded-full bg-sky-800"></i>Instituciones</span>
        <span v-if="showReports" class="flex items-center gap-2"><i class="h-2.5 w-2.5 rounded-full bg-amber-600"></i>Reporte ciudadano</span>
      </div>
    </div>
    <span class="absolute right-3 top-3 z-[400] rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-sm">Datos demo · La Paz</span>
  </div>
</template>
