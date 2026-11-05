<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import { useAuthStore } from '../stores/auth.store'
import { backendAlertsService, type BackendAlert, type InstitutionDelivery } from '../services/backend-alerts.service'
import { operativeAssignmentService, type InstitutionOperative } from '../services/operative-assignment.service'

const route = useRoute()
const auth = useAuthStore()
const institutionId = computed(() => auth.user?.institucionId ?? auth.user?.institutionId ?? null)
const isHead = computed(() => auth.role === 'JEFE_INSTITUCION')
const alert = ref<BackendAlert | null>(null)
const loading = ref(false)
const error = ref('')
const operatives = ref<InstitutionOperative[]>([])
const operativeLoading = ref(false)
const operativeError = ref('')
const selected = ref<string[]>([])
const assigning = ref(false)
const assignmentError = ref('')
const assignmentSuccess = ref('')

const myDelivery = computed<InstitutionDelivery | null>(() =>
  alert.value?.instituciones_notificadas?.find(
    row => String(row.id_institucion) === String(institutionId.value),
  ) ?? null,
)
const activeAlert = computed(() =>
  Boolean(alert.value && !['CERRADA', 'DESCARTADA', 'CANCELADA'].includes(alert.value.estado)),
)
const canAssign = computed(() => isHead.value && activeAlert.value && Boolean(myDelivery.value))

function formatDate(date?: string | null): string {
  if (!date) return 'No registrada'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString('es-BO')
}

async function loadOperatives() {
  if (!canAssign.value) {
    operatives.value = []
    return
  }
  operativeLoading.value = true
  operativeError.value = ''
  try {
    operatives.value = await operativeAssignmentService.getOperatives()
    // El estado pudo cambiar mientras estaba abierto el formulario.
    selected.value = selected.value.filter(id => operatives.value.some(person => person.id_usuario === id && person.disponible))
  } catch (cause) {
    operatives.value = []
    operativeError.value = cause instanceof Error ? cause.message : 'No se pudieron obtener los operativos.'
  } finally {
    operativeLoading.value = false
  }
}

async function load() {
  alert.value = null
  error.value = ''
  assignmentError.value = ''
  assignmentSuccess.value = ''
  selected.value = []
  if (!institutionId.value) {
    error.value = 'Tu sesión no tiene una institución asignada.'
    return
  }
  loading.value = true
  try {
    const current = await backendAlertsService.detail(String(route.params.id))
    const received = current.instituciones_notificadas?.some(
      delivery => String(delivery.id_institucion) === String(institutionId.value),
    )
    if (!received) throw new Error('Esta alerta no fue enviada a tu institución.')
    alert.value = current
    await loadOperatives()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo consultar el detalle de la alerta.'
  } finally {
    loading.value = false
  }
}

function toggleOperative(id: string, checked: boolean) {
  if (checked && !selected.value.includes(id)) selected.value = [...selected.value, id]
  else if (!checked) selected.value = selected.value.filter(value => value !== id)
}

async function assign() {
  if (!canAssign.value || assigning.value || !selected.value.length || !alert.value) return
  // Se confirma la operación antes de notificar al personal seleccionado.
  if (!window.confirm(`¿Asignar ${selected.value.length} operativo(s) a la alerta #${alert.value.id_alerta}?`)) return
  assigning.value = true
  assignmentError.value = ''
  assignmentSuccess.value = ''
  const count = selected.value.length
  try {
    await operativeAssignmentService.assign(String(alert.value.id_alerta), selected.value)
    selected.value = []
    assignmentSuccess.value = `${count} operativo(s) asignado(s) a la alerta #${alert.value.id_alerta}.`
    await loadOperatives()
  } catch (cause) {
    // Los errores de validación ya llegan redactados en español desde el backend.
    assignmentError.value = cause instanceof Error ? cause.message : 'No se pudo asignar el personal.'
    await loadOperatives()
  } finally {
    assigning.value = false
  }
}

onMounted(() => { void load() })
watch(() => route.params.id, () => { void load() })

// Mapa de la ruta mas corta (institucion -> predio/reporte), calculada por
// el routing-service y persistida en envia.ruta_json. Es fire-and-forget en
// el backend: puede tardar unos segundos tras confirmarse la alerta.
const routeMapContainer = ref<HTMLElement | null>(null)
let routeMap: L.Map | null = null
const distanceKmLabel = computed(() => {
  const metros = myDelivery.value?.ruta?.distance_m
  return typeof metros === 'number' ? `${(metros / 1000).toFixed(1)} km` : null
})

function renderRouteMap() {
  const ruta = myDelivery.value?.ruta
  if (!routeMapContainer.value || !ruta) return

  if (routeMap) {
    routeMap.remove()
    routeMap = null
  }

  routeMap = L.map(routeMapContainer.value, { zoomControl: true, scrollWheelZoom: false })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(routeMap)

  const origen: [number, number] = [ruta.origin.latitude, ruta.origin.longitude]
  const destino: [number, number] = [ruta.destination.latitude, ruta.destination.longitude]

  L.circleMarker(origen, { radius: 9, color: '#ffffff', weight: 3, fillColor: '#335f76', fillOpacity: 0.95 })
    .bindPopup('Institución (origen)')
    .addTo(routeMap)
  L.circleMarker(destino, { radius: 9, color: '#ffffff', weight: 3, fillColor: '#e4473d', fillOpacity: 0.95 })
    .bindPopup('Incendio (destino)')
    .addTo(routeMap)

  const linea = L.polyline(ruta.geometry, { color: '#d62828', weight: 5, opacity: 0.9 }).addTo(routeMap)
  routeMap.fitBounds(linea.getBounds(), { padding: [24, 24] })

  nextTick(() => routeMap?.invalidateSize())
}

watch(() => myDelivery.value?.ruta, () => nextTick(renderRouteMap))

onBeforeUnmount(() => {
  routeMap?.remove()
  routeMap = null
})
</script>

<template>
  <main class="al-modern-screen mx-auto max-w-[1200px] space-y-5">
    <RouterLink to="/institucion/alertas" class="inline-flex font-semibold text-orange-700 underline">Volver a alertas</RouterLink>
    <header class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold text-slate-900">Detalle institucional</h1>
      <button type="button" class="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 disabled:opacity-50" :disabled="loading || assigning" @click="load">Actualizar</button>
    </header>
    <p v-if="loading" role="status">Consultando el servidor...</p>
    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{{ error }}</p>

    <section v-if="alert && myDelivery" class="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <strong class="text-xl text-slate-900">Alerta #{{ alert.id_alerta }}</strong>
        <span class="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-900">{{ alert.estado }}</span>
      </div>
      <dl class="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div><dt class="font-semibold">Estado de tu institución</dt><dd>{{ myDelivery.estado }}</dd></div>
        <div><dt class="font-semibold">Institución</dt><dd>{{ myDelivery.nombre }}</dd></div>
        <div><dt class="font-semibold">Fecha de envío</dt><dd>{{ formatDate(myDelivery.fecha_envio) }}</dd></div>
        <div><dt class="font-semibold">Última actualización</dt><dd>{{ formatDate(myDelivery.fecha_actualizacion) }}</dd></div>
        <div><dt class="font-semibold">Clasificación</dt><dd>{{ alert.clasificacion ?? 'Sin clasificar' }}</dd></div>
        <div><dt class="font-semibold">Puntaje de confianza</dt><dd>{{ alert.puntaje ?? 'No disponible' }}</dd></div>
        <div class="sm:col-span-2"><dt class="font-semibold">Ubicación</dt><dd>{{ alert.predio?.nombre ?? alert.reporte_origen?.ubicacion_tipo ?? 'No disponible' }}</dd></div>
        <div v-if="alert.reporte_origen?.descripcion" class="sm:col-span-2"><dt class="font-semibold">Reporte de origen</dt><dd>{{ alert.reporte_origen.descripcion }}</dd></div>
      </dl>

      <div class="space-y-2 border-t pt-4">
        <h2 class="text-base font-bold text-slate-900">Ruta más corta hacia el incendio</h2>
        <p v-if="myDelivery.ruta" class="text-slate-700">Distancia por calle: <strong>{{ distanceKmLabel }}</strong></p>
        <p v-else-if="myDelivery.ruta_error" role="alert" class="text-sm text-red-700">No se pudo calcular la ruta: {{ myDelivery.ruta_error }}</p>
        <p v-else class="text-sm text-slate-500">Calculando ruta… Presiona "Actualizar" en unos segundos.</p>
        <div
          v-if="myDelivery.ruta"
          ref="routeMapContainer"
          class="h-[320px] w-full overflow-hidden rounded-xl border border-slate-200"
        ></div>
      </div>

      <p class="border-t pt-4 text-sm text-slate-500">La atención de alertas se registra mediante el flujo operativo existente. La asignación del personal desde la web corresponde únicamente al jefe de institución.</p>
    </section>

    <section v-if="canAssign" class="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <header>
        <h2 class="text-lg font-extrabold text-slate-900">Asignar operativos a esta alerta</h2>
        <p class="mt-1 text-sm text-slate-600">Selecciona personal libre. Un operativo con una alerta activa asignada no puede atender otra al mismo tiempo.</p>
      </header>
      <p v-if="assignmentError" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ assignmentError }}</p>
      <p v-if="assignmentSuccess" role="status" class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{{ assignmentSuccess }}</p>
      <p v-if="operativeError" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ operativeError }}</p>
      <p v-if="operativeLoading" role="status" class="text-sm text-slate-600">Actualizando disponibilidad del personal...</p>
      <p v-else-if="!operatives.length && !operativeError" class="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">No hay operativos activos registrados para esta institución.</p>
      <div v-else class="grid gap-3 sm:grid-cols-2">
        <label v-for="person in operatives" :key="person.id_usuario" class="flex items-start gap-3 rounded-xl border border-slate-200 p-4" :class="person.disponible ? 'cursor-pointer hover:bg-slate-50' : 'bg-slate-50 opacity-75'">
          <input type="checkbox" class="mt-1 h-4 w-4 accent-orange-600" :disabled="!person.disponible || assigning || operativeLoading" :checked="selected.includes(person.id_usuario)" @change="toggleOperative(person.id_usuario, ($event.target as HTMLInputElement).checked)" />
          <span class="min-w-0 text-sm">
            <span class="block font-bold text-slate-900">{{ person.nombre }}</span>
            <span v-if="person.correo" class="block break-words text-slate-500">{{ person.correo }}</span>
            <span v-if="person.disponible" class="mt-1 block font-semibold text-emerald-700">Disponible</span>
            <span v-else class="mt-1 block font-semibold text-amber-800">{{ person.id_alerta_asignada === String(alert?.id_alerta) ? 'Ya asignado a esta alerta' : person.id_alerta_asignada ? `Asignado a alerta #${person.id_alerta_asignada}` : 'No disponible' }}</span>
          </span>
        </label>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <span class="text-sm font-semibold text-slate-600">{{ selected.length }} seleccionado(s)</span>
        <button type="button" class="min-h-11 rounded-xl bg-orange-600 px-5 py-2 font-bold text-white hover:bg-orange-700 disabled:opacity-50" :disabled="assigning || operativeLoading || !selected.length || !!operativeError" @click="assign">{{ assigning ? 'Asignando...' : 'Asignar alerta a seleccionados' }}</button>
      </div>
    </section>
    <p v-else-if="alert && myDelivery && isHead && !activeAlert" class="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Esta alerta ya no está activa. No admite nuevas asignaciones.</p>
  </main>
</template>
