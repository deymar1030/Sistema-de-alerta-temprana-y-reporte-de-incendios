<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { MapPin, RefreshCw, Route } from 'lucide-vue-next'
import { backendAlertsService, type BackendAlert } from '../../services/backend-alerts.service'
import { alertDestination, dateLabel, deliveryFor, distanceLabel, isRouteInfo, routeState } from '../../utils/alert-route'
import AlertRouteMap from './AlertRouteMap.vue'

const props = defineProps<{ alert: BackendAlert; institutionId?: string | null; administration?: boolean }>()
const emit = defineEmits<{ updated: [alert: BackendAlert] }>()
const selectId = useId()
const snapshot = ref(props.alert)
const chosen = ref('')
const refreshing = ref(false)
const refreshError = ref('')
const attempts = ref(0)
let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
let generation = 0
let disposed = false
const institutions = computed(() => snapshot.value.instituciones_notificadas ?? [])
const selectedId = computed(() => props.administration ? chosen.value : String(props.institutionId ?? ''))
const delivery = computed(() => deliveryFor(snapshot.value, selectedId.value))
const state = computed(() => routeState(delivery.value))
const validRoute = computed(() => isRouteInfo(delivery.value?.ruta) ? delivery.value!.ruta! : null)
const destination = computed(() => validRoute.value
  ? [validRoute.value.destination.latitude, validRoute.value.destination.longitude] as [number, number]
  : alertDestination(snapshot.value))
const place = computed(() => snapshot.value.predio?.nombre || snapshot.value.reporte_origen?.ubicacion_tipo || 'Lugar reportado')
const closed = computed(() => ['CERRADA', 'DESCARTADA', 'CANCELADA'].includes(snapshot.value.estado))
const canPoll = computed(() => Boolean(delivery.value) && state.value === 'pending' && !closed.value && attempts.value < 10 && !refreshError.value)
const message = computed(() => {
  if (state.value === 'error') return 'No se pudo obtener el recorrido vial. Puedes consultar de nuevo o revisar la ubicación de la alerta.'
  if (state.value === 'invalid') return 'Los datos del recorrido no son válidos. La ubicación de la alerta permanece disponible si tiene coordenadas.'
  if (closed.value) return 'Esta alerta ya terminó y no tiene un recorrido guardado disponible.'
  if (state.value === 'unavailable') return 'No hay un recorrido guardado disponible para esta institución.'
  return attempts.value >= 10
    ? 'La ruta sigue sin estar disponible. Se detuvo la consulta automática; puedes volver a consultar.'
    : 'Ruta aún no disponible. Consultaremos unos instantes por si termina de calcularse.'
})

function schedule() {
  clearTimeout(timer)
  if (disposed || !canPoll.value) return
  timer = setTimeout(() => {
    if (document.visibilityState === 'hidden') schedule()
    else void refresh(false)
  }, 3000)
}

async function refresh(manual = true) {
  if (refreshing.value || !delivery.value) return
  clearTimeout(timer)
  if (manual) attempts.value = 0
  else attempts.value += 1
  refreshing.value = true
  refreshError.value = ''
  const version = generation
  controller = new AbortController()
  try {
    const result = await backendAlertsService.detail(String(props.alert.id_alerta), controller.signal)
    if (disposed || version !== generation) return
    if (String(result.id_alerta) !== String(props.alert.id_alerta)) throw new Error('La respuesta no corresponde a esta alerta.')
    snapshot.value = result
    emit('updated', result)
  } catch (cause) {
    if (disposed || version !== generation) return
    refreshError.value = cause instanceof Error ? cause.message : 'No se pudo actualizar la ruta.'
  } finally {
    if (!disposed && version === generation) { refreshing.value = false; schedule() }
  }
}

watch(() => props.alert, value => {
  if (value === snapshot.value) return
  // A newer parent refresh must win over an older route-only request.
  generation += 1
  controller?.abort()
  refreshing.value = false
  snapshot.value = value
  schedule()
})
watch([() => String(props.alert.id_alerta), selectedId], () => {
  generation += 1
  controller?.abort()
  refreshing.value = false
  refreshError.value = ''
  attempts.value = 0
  schedule()
}, { immediate: true })
watch(canPoll, schedule)
onBeforeUnmount(() => { disposed = true; generation += 1; clearTimeout(timer); controller?.abort() })
</script>

<template>
  <section class="route-panel min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Ruta hacia la alerta">
    <header class="flex flex-wrap items-start justify-between gap-3 p-5">
      <div>
        <h2 class="flex items-center gap-2 text-lg font-bold text-slate-900"><Route class="h-5 w-5 text-orange-700" aria-hidden="true" /> Ruta hacia la alerta</h2>
        <p class="mt-1 text-sm text-slate-600">{{ administration ? 'Consulta el recorrido desde cada institución notificada.' : 'Recorrido desde tu institución hasta el lugar reportado.' }}</p>
      </div>
      <button v-if="delivery" type="button" class="route-button" :disabled="refreshing" @click="refresh()"><RefreshCw class="h-4 w-4" aria-hidden="true" /> {{ refreshing ? 'Consultando…' : 'Actualizar ruta' }}</button>
    </header>

    <div v-if="administration && institutions.length" class="px-5 pb-5">
      <label :for="selectId" class="mb-2 block text-sm font-semibold text-slate-800">Institución de origen</label>
      <select :id="selectId" v-model="chosen" class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
        <option value="" disabled>Selecciona una institución para ver su ruta</option>
        <option v-for="institution in institutions" :key="String(institution.id_institucion)" :value="String(institution.id_institucion)">{{ institution.nombre }} · {{ institution.estado }}</option>
      </select>
    </div>
    <p v-if="!delivery" role="status" class="mx-5 mb-5 rounded-lg bg-slate-50 p-5 text-sm text-slate-600">{{ administration && institutions.length ? 'Cada institución tiene un punto de partida distinto. Selecciona una para consultar el recorrido.' : 'No hay un envío institucional disponible para consultar su ruta.' }}</p>

    <template v-else>
      <div class="grid gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-2">
        <div class="flex min-w-0 gap-3"><span class="route-label bg-[#245c6f]">A</span><div class="min-w-0"><p class="text-xs font-semibold text-slate-600">Institución de origen</p><p class="break-words text-sm font-bold text-slate-900">{{ delivery.nombre }}</p><p v-if="validRoute" class="mt-1 text-xs tabular-nums text-slate-600">{{ validRoute.origin.latitude.toFixed(5) }}, {{ validRoute.origin.longitude.toFixed(5) }}</p></div></div>
        <div class="flex min-w-0 gap-3"><span class="route-label bg-red-700">B</span><div class="min-w-0"><p class="text-xs font-semibold text-slate-600">Lugar de la alerta</p><p class="break-words text-sm font-bold text-slate-900">{{ place }}</p><p v-if="destination" class="mt-1 text-xs tabular-nums text-slate-600">{{ destination[0].toFixed(5) }}, {{ destination[1].toFixed(5) }}</p></div></div>
      </div>
      <div v-if="validRoute" class="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-4">
        <p class="text-sm text-slate-600"><strong class="mr-1 text-2xl font-bold tracking-tight text-slate-900">{{ distanceLabel(validRoute.distance_m) }}</strong> por la red vial</p>
        <p class="text-xs text-slate-600">Calculada: {{ dateLabel(delivery.ruta_calculada_en) }}</p>
      </div>
      <p v-else role="status" class="mx-5 mb-4 rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{{ message }}</p>
      <p v-if="refreshing" role="status" class="px-5 pb-3 text-sm text-slate-600">Consultando la ruta guardada…</p>
      <p v-if="refreshError" role="alert" class="mx-5 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">No se pudo actualizar: {{ refreshError }}. Los datos visibles corresponden a la última consulta disponible.</p>
      <AlertRouteMap v-if="validRoute || destination" :route="validRoute" :destination="destination" :context="`${alert.id_alerta}:${selectedId}`" />
      <div v-else class="flex min-h-48 flex-col items-center justify-center gap-3 border-y border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600"><MapPin class="h-7 w-7" aria-hidden="true" /><p>No hay coordenadas suficientes para mostrar el mapa.</p></div>
      <p class="px-5 py-4 text-xs leading-relaxed text-slate-600">{{ closed ? 'Recorrido histórico. ' : '' }}La ruta parte de la sede institucional. Indica distancia vial, sin tráfico en tiempo real ni tiempo estimado de llegada.</p>
    </template>
  </section>
</template>

<style scoped>
.route-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-weight: 600; color: #334155; }
.route-button:hover { background: #f1f5f9; }
.route-button:disabled { opacity: .6; cursor: wait; }
.route-label { display: grid; place-items: center; flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; color: #fafafa; font-size: 12px; font-weight: 800; }
.route-panel :is(button, select):focus-visible { outline: 2px solid #9a3412; outline-offset: 3px; }
</style>
