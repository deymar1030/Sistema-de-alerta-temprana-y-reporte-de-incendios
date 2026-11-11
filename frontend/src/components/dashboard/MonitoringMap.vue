<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import L from 'leaflet'

import { useSensorStore } from '../../stores/sensor.store'
import { useIncidentStore } from '../../stores/incident.store'
import { useInstitutionStore } from '../../stores/institution.store'
import { useCitizenReportStore } from '../../stores/citizen-report.store'
import { usePredioStore } from '../../stores/predio.store'
import { useDispatchStore } from '../../stores/dispatch.store'

const props = withDefaults(
  defineProps<{
    showSensors?: boolean
    showIncidents?: boolean
    showInstitutions?: boolean
    showReports?: boolean
    showPredios?: boolean
    mode?: 'all' | 'institution'
    institutionId?: string | null

    heightClass?: string

    focusLat?: number
    focusLng?: number
    focusZoom?: number
  }>(),
  {
    showSensors: true,
    showIncidents: true,
    showInstitutions: true,
    showReports: false,
    showPredios: false,
    mode: 'all',
    institutionId: null,

    heightClass: 'h-[430px]',
    focusZoom: 14,
  },
)

const sensorStore = useSensorStore()
const incidentStore = useIncidentStore()
const institutionStore = useInstitutionStore()
const citizenReportStore =
  useCitizenReportStore()
const predioStore = usePredioStore()
const dispatchStore = useDispatchStore()

const mapContainer =
  ref<HTMLElement | null>(null)

let map: L.Map | null = null

let sensorLayer: L.LayerGroup | null = null
let incidentLayer: L.LayerGroup | null = null
let institutionLayer: L.LayerGroup | null = null
let reportLayer: L.LayerGroup | null = null
let predioLayer: L.LayerGroup | null = null

const resolvedHeight = computed(() => {
  const match =
    props.heightClass.match(
      /h-\[(\d+)px\]/,
    ) ??
    props.heightClass.match(
      /h-(\d+)/,
    )

  return match
    ? `${match[1]}px`
    : '260px'
})

const sensorColors: Record<string, string> = {
  normal: '#47836b',
  warning: '#f2c94c',
  high: '#f4a259',
  critical: '#e4473d',
}

const incidentColors: Record<string, string> = {
  normal: '#47836b',
  warning: '#f2c94c',
  high: '#f4a259',
  critical: '#e4473d',
}

const riskFromIrp = (
  irp: number,
): 'normal' | 'warning' | 'high' | 'critical' => {
  if (irp >= 0.8) return 'critical'
  if (irp >= 0.6) return 'high'
  if (irp >= 0.4) return 'warning'
  return 'normal'
}

const escapeHtml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character] ?? character)

const popup = (
  title: string,
  rows: Array<[string, string]>,
) => `
  <div
    class="map-popup"
    style="
      color:#17212b;
      font-family:Manrope,Segoe UI,sans-serif;
      min-width:190px;
    "
  >
    <strong style="font-size:14px">
      ${escapeHtml(title)}
    </strong>

    ${rows
      .map(
        ([label, value]) => `
          <div
            style="
              margin-top:6px;
              font-size:12px;
              color:#58666f;
            "
          >
            <span
              style="
                font-weight:600;
                color:#17212b;
              "
            >
              ${escapeHtml(label)}:
            </span>

            ${escapeHtml(value)}
          </div>
        `,
      )
      .join('')}
  </div>
`

const hasValidCoordinates = (
  lat: number | undefined | null,
  lng: number | undefined | null,
): boolean =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  !(lat === 0 && lng === 0)

const emptyStateMessage = ref('')

const rebuildLayers = () => {
  if (
    !map ||
    !sensorLayer ||
    !incidentLayer ||
    !institutionLayer ||
    !reportLayer ||
    !predioLayer
  ) {
    return
  }

  sensorLayer.clearLayers()
  incidentLayer.clearLayers()
  institutionLayer.clearLayers()
  reportLayer.clearLayers()
  predioLayer.clearLayers()
  emptyStateMessage.value = ''

  let validIncidentMarkers = 0
  let validInstitutionMarkers = 0

  /*
   * SENSORES REALES
   */
  if (props.showSensors) {
    sensorStore.sensors.forEach(
      (sensor) => {
        if (
          !hasValidCoordinates(
            sensor.lat,
            sensor.lng,
          )
        ) {
          return
        }

        const color =
          sensorColors[sensor.riesgo] ??
          sensorColors.normal

        L.circleMarker(
          [sensor.lat, sensor.lng],
          {
            radius: 9,
            color: '#ffffff',
            weight: 3,
            fillColor: color,
            fillOpacity: 0.96,
          },
        )
          .bindPopup(
            popup(sensor.nombre, [
              [
                'Sensor',
                sensor.id_sensor,
              ],
              [
                'Estado',
                sensor.estado,
              ],
              [
                'Lectura',
                sensor.ultima_lectura !==
                null
                  ? `${sensor.ultima_lectura} ${sensor.unidad_medida}`
                  : 'Sin lecturas',
              ],
              [
                'Ubicación',
                sensor.ubicacion,
              ],
            ]),
          )
          .addTo(
            sensorLayer as L.LayerGroup,
          )
      },
    )
  }

  /*
   * ALERTAS / INCIDENTES REALES
   */
  if (props.showIncidents) {
    incidentStore.incidents
      .filter(
        (incident) =>
          ![
            'CERRADA',
            'CANCELADA',
            'FALSA_ALARMA',
          ].includes(incident.status),
      )
      .forEach((incident) => {
        if (
          props.mode === 'institution' &&
          props.institutionId &&
          !dispatchStore.dispatches.some(
            (dispatch) =>
              dispatch.institutionId ===
                String(props.institutionId) &&
              dispatch.incidentId ===
                incident.id,
          )
        ) {
          return
        }

        if (
          !hasValidCoordinates(
            incident.latitud,
            incident.longitud,
          )
        ) {
          return
        }

        validIncidentMarkers += 1

        const color =
          incidentColors[
            incident.riesgo
          ] ??
          incidentColors.warning

        L.circleMarker(
          [
            incident.latitud,
            incident.longitud,
          ],
          {
            radius: 14,
            color: '#ffffff',
            weight: 4,
            fillColor: color,
            fillOpacity: 0.95,
          },
        )
          .bindPopup(
            popup(
              `⚠ Alerta ${incident.id}`,
              [
                [
                  'Estado',
                  incident.status.replaceAll(
                    '_',
                    ' ',
                  ),
                ],
                [
                  'Riesgo',
                  incident.riesgo,
                ],
                [
                  'Origen',
                  incident.origen,
                ],
                [
                  'Ubicación',
                  incident.ubicacion,
                ],
              ],
            ),
          )
          .addTo(
            incidentLayer as L.LayerGroup,
          )
      })
  }

  /*
   * INSTITUCIONES REALES
   */
  if (props.showInstitutions) {
    institutionStore.institutions.forEach(
      (institution) => {
        if (
          props.mode === 'institution' &&
          props.institutionId &&
          String(institution.id) !==
            String(props.institutionId)
        ) {
          return
        }

        if (
          !hasValidCoordinates(
            institution.latitud,
            institution.longitud,
          )
        ) {
          return
        }

        validInstitutionMarkers += 1

        const color =
          institution.disponibilidad ===
          'DISPONIBLE'
            ? '#335f76'
            : institution.disponibilidad ===
                'ATENDIENDO'
              ? '#f4a259'
              : '#94a3b8'

        L.circleMarker(
          [
            institution.latitud,
            institution.longitud,
          ],
          {
            radius: 8,
            color: '#ffffff',
            weight: 3,
            fillColor: color,
            fillOpacity: 0.94,
          },
        )
          .bindPopup(
            popup(
              institution.nombre,
              [
                [
                  'Tipo',
                  institution.tipo.replaceAll(
                    '_',
                    ' ',
                  ),
                ],
                [
                  'Disponibilidad',
                  institution.disponibilidad.replaceAll(
                    '_',
                    ' ',
                  ),
                ],
                [
                  'Teléfono',
                  institution.telefono,
                ],
                [
                  'Dirección',
                  institution.direccion,
                ],
              ],
            ),
          )
          .addTo(
            institutionLayer as L.LayerGroup,
          )
      },
    )
  }

  /*
   * REPORTES CIUDADANOS REALES
   */
  if (props.showReports) {
    citizenReportStore.reports
      .filter(
        (report) =>
          ![
            'DESCARTADO',
            'ATENDIDO',
          ].includes(report.status),
      )
      .forEach((report) => {
        if (
          !hasValidCoordinates(
            report.latitud,
            report.longitud,
          )
        ) {
          return
        }

        L.circleMarker(
          [
            report.latitud,
            report.longitud,
          ],
          {
            radius: 10,
            color: '#ffffff',
            weight: 3,
            fillColor: '#b7791f',
            fillOpacity: 0.92,
          },
        )
          .bindPopup(
            popup(
              `Reporte ${report.id}`,
              [
                [
                  'Estado',
                  report.status.replaceAll(
                    '_',
                    ' ',
                  ),
                ],
                [
                  'Tipo',
                  report.tipo ??
                    'Sin especificar',
                ],
                [
                  'Descripción',
                  report.descripcion,
                ],
              ],
            ),
          )
          .addTo(
            reportLayer as L.LayerGroup,
          )
      })
  }

  /*
   * PREDIOS REALES
   */
  if (props.showPredios) {
    predioStore.predios.forEach(
      (predio) => {
        if (
          !hasValidCoordinates(
            predio.latitud,
            predio.longitud,
          )
        ) {
          return
        }

        const risk =
          riskFromIrp(predio.irp)

        const color =
          incidentColors[risk]

        L.circleMarker(
          [
            predio.latitud,
            predio.longitud,
          ],
          {
            radius: 7,
            color: '#ffffff',
            weight: 2,
            fillColor: color,
            fillOpacity: 0.8,
          },
        )
          .bindPopup(
            popup(predio.nombre, [
              [
                'Tipo',
                predio.tipo_predio.replaceAll(
                  '_',
                  ' ',
                ),
              ],
              [
                'IRP',
                predio.irp.toFixed(2),
              ],
              [
                'Nivel de riesgo',
                risk,
              ],
            ]),
          )
          .addTo(
            predioLayer as L.LayerGroup,
          )
      },
    )
  }

  if (
    props.mode === 'institution' &&
    props.institutionId
  ) {
    emptyStateMessage.value =
      validIncidentMarkers === 0 &&
      validInstitutionMarkers === 0
        ? 'No hay alertas georreferenciadas para esta institución.'
        : ''
  } else if (
    validIncidentMarkers === 0 &&
    validInstitutionMarkers === 0
  ) {
    emptyStateMessage.value =
      props.showInstitutions &&
      !props.showIncidents &&
      !props.showSensors &&
      !props.showReports &&
      !props.showPredios
        ? 'No hay ubicaciones geográficas disponibles para las instituciones.'
        : 'No hay ubicaciones geográficas disponibles.'
  }
}

const applyFocus = () => {
  if (
    !map ||
    props.focusLat === undefined ||
    props.focusLng === undefined
  ) {
    return
  }

  map.setView(
    [
      props.focusLat,
      props.focusLng,
    ],
    props.focusZoom,
  )
}

const handleResize = () => {
  map?.invalidateSize()
}

const refreshMapLayout = () => {
  nextTick(() => {
    if (!mapContainer.value) {
      return
    }

    mapContainer.value.style.height =
      '100%'

    mapContainer.value.style.width =
      '100%'

    if (map) {
      map.invalidateSize()

      requestAnimationFrame(() =>
        map?.invalidateSize(),
      )

      setTimeout(
        () =>
          map?.invalidateSize(),
        120,
      )
    }
  })
}

const loadMapData = async () => {
  const requests: Promise<unknown>[] = []

  if (
    props.showSensors &&
    sensorStore.sensors.length === 0
  ) {
    requests.push(
      sensorStore.fetchSensors(),
    )
  }

  if (
    props.showIncidents &&
    incidentStore.incidents.length === 0
  ) {
    requests.push(
      incidentStore.fetchIncidents(),
    )
  }

  if (
    props.showInstitutions &&
    institutionStore.institutions
      .length === 0
  ) {
    requests.push(
      institutionStore.fetchInstitutions(),
    )
  }

  if (
    props.showReports &&
    citizenReportStore.reports.length ===
      0
  ) {
    requests.push(
      citizenReportStore.fetchReports(),
    )
  }

  if (
    props.showPredios &&
    predioStore.predios.length === 0
  ) {
    requests.push(
      predioStore.fetchPrediosForMap(),
    )
  }

  if (
    props.mode === 'institution' &&
    props.institutionId &&
    dispatchStore.dispatches.length === 0
  ) {
    requests.push(
      dispatchStore.fetchDispatches(),
    )
  }

  if (requests.length > 0) {
    await Promise.all(requests)
  }

  rebuildLayers()
}

onMounted(async () => {
  if (!mapContainer.value) {
    return
  }

  if (map) {
    map.remove()
    map = null
  }

  map = L.map(
    mapContainer.value,
    {
      zoomControl: true,
      scrollWheelZoom: true,
    },
  ).setView(
    [-16.505, -68.12],
    13,
  )

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    },
  ).addTo(map)

  sensorLayer =
    L.layerGroup().addTo(map)

  incidentLayer =
    L.layerGroup().addTo(map)

  institutionLayer =
    L.layerGroup().addTo(map)

  reportLayer =
    L.layerGroup().addTo(map)

  predioLayer =
    L.layerGroup().addTo(map)

  await loadMapData()

  applyFocus()
  refreshMapLayout()

  window.addEventListener(
    'resize',
    handleResize,
  )

  setTimeout(
    () =>
      map?.invalidateSize(),
    300,
  )
})

watch(
  () => [
    props.showSensors,
    props.showIncidents,
    props.showInstitutions,
    props.showReports,
    props.showPredios,
    props.mode,
    props.institutionId,
  ],
  async () => {
    await loadMapData()
  },
)

watch(
  () => sensorStore.sensors,
  rebuildLayers,
  { deep: true },
)

watch(
  () => incidentStore.incidents,
  rebuildLayers,
  { deep: true },
)

watch(
  () =>
    institutionStore.institutions,
  rebuildLayers,
  { deep: true },
)

watch(
  () =>
    citizenReportStore.reports,
  rebuildLayers,
  { deep: true },
)

watch(
  () => predioStore.predios,
  rebuildLayers,
  { deep: true },
)

watch(
  () => dispatchStore.dispatches,
  rebuildLayers,
  { deep: true },
)

watch(
  () => [
    props.focusLat,
    props.focusLng,
  ],
  applyFocus,
)

watch(
  () => props.heightClass,
  refreshMapLayout,
)

onBeforeUnmount(() => {
  window.removeEventListener(
    'resize',
    handleResize,
  )

  map?.remove()
  map = null
})
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
      heightClass,
    ]"
    :style="{
      minHeight: resolvedHeight,
    }"
  >
    <div
      v-if="emptyStateMessage"
      class="absolute inset-0 z-[350] flex items-center justify-center bg-slate-50/80 px-6"
    >
      <p class="max-w-xs text-center text-sm text-slate-600">
        {{ emptyStateMessage }}
      </p>
    </div>

    <div
      ref="mapContainer"
      class="h-full w-full"
      :style="{
        height: '100%',
        width: '100%',
      }"
    ></div>

    <!-- Leyenda -->
    <div
      class="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-xl border border-white/80 bg-white/95 p-3 shadow-lg backdrop-blur-sm"
    >
      <p
        class="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500"
      >
        Leyenda
      </p>

      <div
        class="grid gap-1.5 text-[11px] text-slate-700 sm:grid-cols-2"
      >
        <span
          v-if="showSensors"
          class="flex items-center gap-2"
        >
          <i
            class="h-2.5 w-2.5 rounded-full bg-emerald-600"
          ></i>

          Sensores
        </span>

        <span
          v-if="showIncidents"
          class="flex items-center gap-2"
        >
          <i
            class="h-2.5 w-2.5 rounded-full bg-red-500"
          ></i>

          Alertas / incidentes
        </span>

        <span
          v-if="showInstitutions"
          class="flex items-center gap-2"
        >
          <i
            class="h-2.5 w-2.5 rounded-full bg-sky-800"
          ></i>

          Instituciones
        </span>

        <span
          v-if="showReports"
          class="flex items-center gap-2"
        >
          <i
            class="h-2.5 w-2.5 rounded-full bg-amber-600"
          ></i>

          Reporte ciudadano
        </span>

        <span
          v-if="showPredios"
          class="flex items-center gap-2"
        >
          <i
            class="h-2.5 w-2.5 rounded-full bg-orange-500"
          ></i>

          Predios
        </span>
      </div>
    </div>

    <!-- Indicador -->
    <span
      class="absolute right-3 top-3 z-[400] rounded-full border border-emerald-200 bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 shadow-sm"
    >
      Datos en tiempo real
    </span>
  </div>
</template>