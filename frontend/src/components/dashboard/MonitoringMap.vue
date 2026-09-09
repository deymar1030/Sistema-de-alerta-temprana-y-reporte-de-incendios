<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import L from 'leaflet'
import { sensorsMock } from '../../mocks/sensors'

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null

const markerColors: Record<string, string> = {
  normal: '#22c55e',
  warning: '#fbbf24',
  high: '#f97316',
  critical: '#ef4444',
}

onMounted(() => {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, { zoomControl: true }).setView([-16.5, -68.12], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  sensorsMock.forEach((sensor) => {
    const marker = L.circleMarker([sensor.lat, sensor.lng], {
      radius: 12,
      color: markerColors[sensor.riesgo],
      fillColor: markerColors[sensor.riesgo],
      fillOpacity: 0.8,
      weight: 2,
    }).addTo(map as L.Map)

    marker.bindPopup(`
      <div style="color:#0f172a; font-family:Inter, sans-serif; min-width: 180px;">
        <strong>${sensor.id_sensor}</strong><br>
        <span>${sensor.nombre}</span><br>
        <span>Tipo: ${sensor.tipo_sensor}</span><br>
        <span>Estado: ${sensor.estado}</span><br>
        <span>Última lectura: ${sensor.ultima_lectura} ${sensor.unidad_medida}</span><br>
        <span>Ubicación: ${sensor.ubicacion}</span><br>
        <span>Riesgo: ${sensor.riesgo}</span>
      </div>
    `)
  })
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="h-72 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
    <div ref="mapContainer" class="h-full w-full"></div>
  </div>
</template>
