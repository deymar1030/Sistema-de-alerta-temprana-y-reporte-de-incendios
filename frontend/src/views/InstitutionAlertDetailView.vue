<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AlertRoutePanel from '../components/alerts/AlertRoutePanel.vue'
import { useRoute } from 'vue-router'
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
const dispatchBusy = ref(false)
const dispatchError = ref('')
const context = computed(() => `${auth.user?.id}:${institutionId.value}:${route.params.id}`)
let generation = 0
let personnelRequest = 0
let controller: AbortController | undefined
const place = computed(() => alert.value?.predio?.nombre || alert.value?.reporte_origen?.ubicacion_tipo || 'Ubicación no disponible')

const myDelivery = computed<InstitutionDelivery | null>(() =>
  alert.value?.instituciones_notificadas?.find(
    row => String(row.id_institucion) === String(institutionId.value),
  ) ?? null,
)
const activeAlert = computed(() =>
  Boolean(alert.value && !['CERRADA', 'DESCARTADA', 'CANCELADA'].includes(alert.value.estado)),
)
const canAssign = computed(() => isHead.value && activeAlert.value && Boolean(myDelivery.value))

// JEFE_INSTITUCION u OPERATIVO de esta misma institución pueden mover el
// envío (ver AlertaController.autorizarInstitucion en el backend); no hace
// falta ser jefe para esto, a diferencia de la asignación de personal.
const siguienteAccionEnvio = computed<{ accion: 'recibir' | 'atender' | 'cerrar'; etiqueta: string } | null>(() => {
  switch (myDelivery.value?.estado) {
    case 'ENVIADA': return { accion: 'recibir', etiqueta: 'Marcar como recibida' }
    case 'RECIBIDA': return { accion: 'atender', etiqueta: 'Marcar como atendida' }
    case 'ATENDIDA': return { accion: 'cerrar', etiqueta: 'Cerrar envío' }
    default: return null
  }
})

async function avanzarEnvio() {
  const siguiente = siguienteAccionEnvio.value
  if (!siguiente || dispatchBusy.value || !alert.value || !institutionId.value) return
  dispatchBusy.value = true
  dispatchError.value = ''
  try {
    await backendAlertsService[siguiente.accion](String(alert.value.id_alerta), String(institutionId.value))
    await load()
  } catch (cause) {
    dispatchError.value = cause instanceof Error ? cause.message : 'No se pudo actualizar el estado del envío.'
  } finally {
    dispatchBusy.value = false
  }
}

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
  const version = generation
  const request = ++personnelRequest
  operativeLoading.value = true
  operativeError.value = ''
  try {
    const people = await operativeAssignmentService.getOperatives()
    if (version !== generation || request !== personnelRequest) return
    operatives.value = people
    // El estado pudo cambiar mientras estaba abierto el formulario.
    selected.value = selected.value.filter(id => operatives.value.some(person => person.id_usuario === id && person.disponible))
  } catch (cause) {
    if (version !== generation || request !== personnelRequest) return
    selected.value = []
    operatives.value = []
    operativeError.value = cause instanceof Error ? cause.message : 'No se pudieron obtener los operativos.'
  } finally {
    if (version === generation && request === personnelRequest) operativeLoading.value = false
  }
}

async function load() {
  if (loading.value || assigning.value) return
  const version = generation
  error.value = ''
  if (!institutionId.value) {
    error.value = 'Tu sesión no tiene una institución asignada.'
    return
  }
  loading.value = true
  try {
    controller = new AbortController()
    const id = String(route.params.id)
    const current = await backendAlertsService.detail(id, controller.signal)
    if (version !== generation) return
    if (String(current.id_alerta) !== id) throw new Error('La respuesta no corresponde a esta alerta.')
    const received = current.instituciones_notificadas?.some(
      delivery => String(delivery.id_institucion) === String(institutionId.value),
    )
    if (!received) { alert.value = null; throw new Error('Esta alerta no fue enviada a tu institución.') }
    alert.value = current
    await loadOperatives()
  } catch (cause) {
    if (version !== generation) return
    error.value = cause instanceof Error ? cause.message : 'No se pudo consultar el detalle de la alerta.'
  } finally {
    if (version === generation) loading.value = false
  }
}

function toggleOperative(id: string, checked: boolean) {
  if (checked && !selected.value.includes(id)) selected.value = [...selected.value, id]
  else if (!checked) selected.value = selected.value.filter(value => value !== id)
}

async function assign() {
  if (!canAssign.value || assigning.value || loading.value || operativeLoading.value || !selected.value.length || !alert.value) return
  // Se confirma la operación antes de notificar al personal seleccionado.
  if (!window.confirm(`¿Asignar ${selected.value.length} operativo(s) a la alerta #${alert.value.id_alerta}?`)) return
  assigning.value = true
  assignmentError.value = ''
  assignmentSuccess.value = ''
  const ids = [...selected.value]
  const count = ids.length
  const id = String(alert.value.id_alerta)
  const version = generation
  try {
    await operativeAssignmentService.assign(id, ids)
    if (version !== generation) return
    selected.value = []
    assignmentSuccess.value = `${count} operativo(s) asignado(s) a la alerta #${id}.`
    await loadOperatives()
  } catch (cause) {
    if (version !== generation) return
    // Los errores de validación ya llegan redactados en español desde el backend.
    assignmentError.value = cause instanceof Error ? cause.message : 'No se pudo asignar el personal.'
    await loadOperatives()
  } finally {
    if (version === generation) assigning.value = false
  }
}

watch(context, () => {
  generation += 1
  personnelRequest += 1
  controller?.abort()
  alert.value = null
  operatives.value = []
  selected.value = []
  assignmentError.value = ''
  assignmentSuccess.value = ''
  operativeError.value = ''
  operativeLoading.value = false
  loading.value = false
  assigning.value = false
  void load()
}, { immediate: true })

function perteneceAEstaAlerta(detail: unknown): boolean {
  const payload = detail as { payload?: { id_alerta?: unknown }; id_alerta?: unknown } | undefined
  const id = payload?.payload?.id_alerta ?? payload?.id_alerta
  return id != null && String(id) === String(route.params.id)
}

function onRealtimeAlerta(event: Event) {
  if (perteneceAEstaAlerta((event as CustomEvent).detail)) void load()
}

function onRealtimeEnvio(event: Event) {
  if (perteneceAEstaAlerta((event as CustomEvent).detail)) void load()
}

window.addEventListener('realtime:alerta', onRealtimeAlerta)
window.addEventListener('realtime:envio', onRealtimeEnvio)
onBeforeUnmount(() => {
  generation += 1
  controller?.abort()
  window.removeEventListener('realtime:alerta', onRealtimeAlerta)
  window.removeEventListener('realtime:envio', onRealtimeEnvio)
})
</script>

<template>
  <main class="al-modern-screen institution-detail mx-auto max-w-[1600px] space-y-5">
    <RouterLink to="/institucion/alertas" class="inline-flex font-semibold text-orange-700 underline">Volver a alertas</RouterLink>
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0"><h1 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{{ alert ? `Alerta #${alert.id_alerta}` : 'Detalle de alerta' }}</h1><p v-if="alert" class="mt-2 break-words text-base text-slate-700">{{ place }}</p></div>
      <button type="button" class="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 disabled:opacity-50" :disabled="loading || assigning" @click="load">Actualizar</button>
    </header>
    <p v-if="loading && !alert" role="status">Consultando el servidor...</p>
    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{{ error }}</p>

    <section v-if="alert && myDelivery" class="space-y-3 border-y border-slate-200 py-4">
      <dl class="flex flex-wrap items-end gap-x-8 gap-y-3 text-sm">
        <div><dt class="text-xs font-semibold text-slate-600">Estado global</dt><dd class="mt-1 font-bold text-slate-900">{{ alert.estado }}</dd></div>
        <div><dt class="text-xs font-semibold text-slate-600">Mi institución</dt><dd class="mt-1 font-bold text-slate-900">{{ myDelivery.estado }}</dd></div>
        <div><dt class="text-xs font-semibold text-slate-600">Clasificación</dt><dd class="mt-1 font-bold text-slate-900">{{ alert.clasificacion ?? 'Sin clasificar' }}</dd></div>
        <div v-if="siguienteAccionEnvio">
          <button type="button" class="min-h-11 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50" :disabled="dispatchBusy || loading" @click="avanzarEnvio">{{ dispatchBusy ? 'Actualizando...' : siguienteAccionEnvio.etiqueta }}</button>
        </div>
        <div v-if="isHead && canAssign && !operativeLoading && !operativeError" class="xl:ml-auto"><dt class="text-xs font-semibold text-slate-600">Personal libre</dt><dd class="mt-1 font-bold text-slate-900">{{ operatives.filter(person => person.disponible).length }} de {{ operatives.length }} <a href="#alert-personnel" class="ml-3 font-semibold text-orange-800 underline xl:hidden">Ir a personal</a></dd></div>
      </dl>
      <p v-if="dispatchError" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ dispatchError }}</p>
    </section>

    <div v-if="alert && myDelivery && isHead" class="grid items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
      <AlertRoutePanel :key="context" :alert="alert" :institution-id="String(institutionId)" @updated="alert = $event" />
    <section v-if="canAssign" id="alert-personnel" class="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <header>
        <h2 class="text-lg font-extrabold text-slate-900">Personal de la institución</h2>
        <p class="mt-1 text-sm text-slate-600">Selecciona personal libre. Un operativo con una alerta activa asignada no puede atender otra al mismo tiempo.</p>
      </header>
      <p v-if="assignmentError" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ assignmentError }}</p>
      <p v-if="assignmentSuccess" role="status" class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{{ assignmentSuccess }}</p>
      <p v-if="operativeError" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ operativeError }}</p>
      <p v-if="operativeLoading" role="status" class="text-sm text-slate-600">Actualizando disponibilidad del personal...</p>
      <p v-else-if="!operatives.length && !operativeError" class="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">No hay operativos activos registrados para esta institución.</p>
      <div v-else class="divide-y divide-slate-100">
        <label v-for="person in operatives" :key="person.id_usuario" class="flex min-h-16 items-start gap-3 py-3" :class="person.disponible ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'">
          <input type="checkbox" class="mt-1 h-5 w-5 shrink-0 accent-orange-700" :disabled="!person.disponible || assigning || operativeLoading" :checked="selected.includes(person.id_usuario)" @change="toggleOperative(person.id_usuario, ($event.target as HTMLInputElement).checked)" />
          <span class="min-w-0 text-sm">
            <span class="block font-bold text-slate-900">{{ person.nombre }}</span>
            <span v-if="person.correo" class="block break-words text-xs text-slate-600">{{ person.correo }}</span>
            <span v-if="person.disponible" class="mt-1 block font-semibold text-emerald-700">Disponible</span>
            <span v-else class="mt-1 block font-semibold text-amber-800">{{ person.id_alerta_asignada === String(alert?.id_alerta) ? 'Ya asignado a esta alerta' : person.id_alerta_asignada ? `Asignado a alerta #${person.id_alerta_asignada}` : 'Disponibilidad no confirmada' }}</span>
          </span>
        </label>
      </div>
      <div class="space-y-3 border-t pt-4">
        <span class="text-sm font-semibold text-slate-600">{{ selected.length }} seleccionado(s)</span>
        <button type="button" class="min-h-11 w-full rounded-lg bg-orange-700 px-4 py-3 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50" :disabled="assigning || loading || operativeLoading || !selected.length || !!operativeError" @click="assign">{{ assigning ? 'Asignando...' : 'Asignar operativos seleccionados' }}</button>
      </div>
    </section>
    <p v-else-if="!activeAlert" class="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Esta alerta ya no está activa. No admite nuevas asignaciones.</p>
    </div>
    <section v-if="alert && myDelivery" class="border-t border-slate-200 pt-5" aria-labelledby="alert-information">
      <h2 id="alert-information" class="text-base font-bold text-slate-900">Información de la alerta</h2>
      <dl class="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div><dt class="text-slate-600">Institución</dt><dd class="mt-1 font-medium text-slate-900">{{ myDelivery.nombre }}</dd></div>
        <div><dt class="text-slate-600">Fecha de envío</dt><dd class="mt-1 text-slate-900">{{ formatDate(myDelivery.fecha_envio) }}</dd></div>
        <div><dt class="text-slate-600">Último cambio del envío</dt><dd class="mt-1 text-slate-900">{{ formatDate(myDelivery.fecha_actualizacion) }}</dd></div>
        <div><dt class="text-slate-600">Puntaje de confianza</dt><dd class="mt-1 text-slate-900">{{ alert.puntaje ?? 'No disponible' }}</dd></div>
        <div v-if="alert.reporte_origen?.descripcion" class="sm:col-span-2 lg:col-span-4"><dt class="text-slate-600">Reporte de origen</dt><dd class="mt-1 max-w-prose whitespace-pre-line text-slate-900">{{ alert.reporte_origen.descripcion }}</dd></div>
      </dl>
    </section>
  </main>
</template>

<style scoped>
.institution-detail :is(a, button, input):focus-visible { outline: 2px solid #9a3412; outline-offset: 3px; }
</style>
