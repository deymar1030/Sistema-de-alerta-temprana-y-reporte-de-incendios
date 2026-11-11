<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { AlertTriangle, Building2, CheckCircle2, RefreshCw } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.store'
import { useInstitutionStore } from '../stores/institution.store'
import { backendAlertsService, type BackendAlert } from '../services/backend-alerts.service'
import { operativeAssignmentService, type InstitutionOperative } from '../services/operative-assignment.service'
import DashboardAlertsMap from '../components/dashboard/DashboardAlertsMap.vue'

const auth = useAuthStore()
const institutions = useInstitutionStore()
const id = computed(() => auth.user?.institutionId ?? auth.user?.institucionId ?? null)
const isHead = computed(() => auth.role === 'JEFE_INSTITUCION')
const institution = computed(() => institutions.institutions.find(item => String(item.id) === String(id.value)))
const availability = computed(() => institution.value?.disponibilidad ?? 'DISPONIBLE')
const isUnavailable = computed(() => availability.value === 'NO_DISPONIBLE')
const dashboardMap = ref<InstanceType<typeof DashboardAlertsMap> | null>(null)
const alerts = ref<BackendAlert[]>([])
const operatives = ref<InstitutionOperative[]>([])
const operativesLoaded = ref(false)
const loading = ref(false)
const availabilityBusy = ref(false)
const error = ref('')
const operativeError = ref('')
const availabilityError = ref('')
const availabilityNotice = ref('')
const active = computed(() => alerts.value.filter(item => !['CERRADA', 'DESCARTADA', 'CANCELADA'].includes(item.estado)))
const closed = computed(() => alerts.value.filter(item => item.instituciones_notificadas?.some(delivery => String(delivery.id_institucion) === String(id.value) && delivery.estado === 'CERRADA')).length)
const hasNoFreeOperatives = computed(() => isHead.value && operatives.value.length > 0 && operatives.value.every(person => !person.disponible))
const hasNoOperatives = computed(() => isHead.value && operativesLoaded.value && !operativeError.value && operatives.value.length === 0 && !loading.value)
function fmt(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('es-BO')
}

async function load() {
  void dashboardMap.value?.refresh()
  error.value = ''
  operativeError.value = ''
  operativesLoaded.value = false
  if (!id.value) {
    error.value = 'Tu usuario no tiene una institución asignada.'
    return
  }
  loading.value = true
  try {
    // El servicio de instituciones ya administra su propio estado de error.
    await institutions.fetchInstitutions()
    if (institutions.error) error.value = institutions.error
    const tasks: Array<Promise<unknown>> = [backendAlertsService.byInstitution(String(id.value))]
    if (isHead.value) tasks.push(operativeAssignmentService.getOperatives())
    const results = await Promise.allSettled(tasks)
    const alertResult = results[0]
    if (alertResult?.status === 'fulfilled') alerts.value = alertResult.value as BackendAlert[]
    else {
      alerts.value = []
      error.value = alertResult?.reason instanceof Error ? alertResult.reason.message : 'No se pudieron obtener alertas.'
    }
    const personnelResult = results[1]
    if (isHead.value) {
      if (personnelResult?.status === 'fulfilled') {
        operatives.value = personnelResult.value as InstitutionOperative[]
        operativesLoaded.value = true
      }
      else {
        operatives.value = []
        operativeError.value = personnelResult?.reason instanceof Error ? personnelResult.reason.message : 'No se pudieron consultar los operativos.'
      }
    }
  } finally {
    loading.value = false
  }
}

async function toggleAvailability() {
  if (!isHead.value || !id.value || availabilityBusy.value || !institution.value) return
  const next = isUnavailable.value ? 'DISPONIBLE' : 'NO_DISPONIBLE'
  const question = next === 'NO_DISPONIBLE'
    ? '¿Marcar tu institución como NO DISPONIBLE? Dejará de recibir alertas nuevas hasta que vuelvas a habilitarla.'
    : '¿Marcar tu institución como DISPONIBLE para volver a recibir alertas nuevas?'
  if (!window.confirm(question)) return
  availabilityBusy.value = true
  availabilityError.value = ''
  availabilityNotice.value = ''
  try {
    await institutions.updateAvailability(String(id.value), next)
    void dashboardMap.value?.refresh()
    availabilityNotice.value = next === 'NO_DISPONIBLE'
      ? 'Tu institución se marcó como no disponible.'
      : 'Tu institución vuelve a estar disponible para nuevas alertas.'
  } catch (cause) {
    availabilityError.value = cause instanceof Error ? cause.message : 'No se pudo cambiar la disponibilidad.'
  } finally {
    availabilityBusy.value = false
  }
}

function onRealtimeAlerta() { void load() }

onMounted(() => {
  void load()
  window.addEventListener('realtime:alerta', onRealtimeAlerta)
})
onBeforeUnmount(() => window.removeEventListener('realtime:alerta', onRealtimeAlerta))
</script>

<template>
  <main class="al-modern-screen admin-page mx-auto max-w-[1600px] space-y-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-orange-600">Administración institucional</p>
        <h1 class="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">{{ institution?.nombre ?? 'Mi institución' }}</h1>
        <p class="mt-2 max-w-xl text-sm text-slate-600">Alertas dirigidas a tu institución y estados persistidos en el backend.</p>
      </div>
      <button type="button" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 disabled:opacity-50" :disabled="loading || availabilityBusy" @click="load"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" /> Actualizar</button>
    </header>
    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{{ error }}</p>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-extrabold text-slate-900">Disponibilidad operativa</h2>
          <p class="mt-1 text-sm text-slate-600">Estado informado por el servidor.</p>
          <span class="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold" :class="isUnavailable ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'">{{ availability }}</span>
        </div>
        <button v-if="isHead && institution" type="button" class="min-h-11 rounded-xl px-5 py-2 font-bold text-white disabled:opacity-50" :class="isUnavailable ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-700 hover:bg-red-800'" :disabled="availabilityBusy || loading" @click="toggleAvailability">
          {{ availabilityBusy ? 'Actualizando...' : isUnavailable ? 'Marcar como disponible' : 'Marcar como no disponible' }}
        </button>
      </div>
      <p v-if="availabilityError" role="alert" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ availabilityError }}</p>
      <p v-if="availabilityNotice" role="status" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{{ availabilityNotice }}</p>
      <p v-if="operativeError && isHead" role="alert" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">No se pudo comprobar el personal disponible: {{ operativeError }}</p>
      <p v-else-if="hasNoFreeOperatives" role="status" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">No tienes operativos libres en este momento. La disponibilidad de la institución no se cambia automáticamente: solo tú decides si deseas marcarla como no disponible.</p>
      <p v-else-if="hasNoOperatives" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Tu institución no tiene operativos activos registrados. Puedes cambiar la disponibilidad manualmente.</p>
    </section>

    <section class="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Resumen de alertas">
      <div v-for="item in [
        { label: 'Alertas recibidas', value: error ? '—' : alerts.length, icon: AlertTriangle },
        { label: 'En seguimiento', value: error ? '—' : active.length, icon: Building2 },
        { label: 'Envíos cerrados', value: error ? '—' : closed, icon: CheckCircle2 },
      ]" :key="item.label" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex justify-between gap-3"><span class="text-sm font-semibold text-slate-600">{{ item.label }}</span><component :is="item.icon" class="h-5 w-5 shrink-0 text-orange-600" /></div>
        <p class="mt-3 text-3xl font-extrabold text-slate-900">{{ item.value }}</p>
      </div>
    </section>

    <DashboardAlertsMap ref="dashboardMap" scope="institution" :institution-id="id" />

    <div class="min-w-0">
      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap justify-between gap-2"><h2 class="text-lg font-extrabold text-slate-900">Actividad reciente</h2><RouterLink to="/institucion/alertas" class="text-sm font-bold text-orange-700">Ver todas</RouterLink></div>
        <p v-if="loading" class="mt-4 text-sm text-slate-600">Cargando...</p>
        <p v-else-if="!alerts.length" class="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No se registran alertas de esta institución.</p>
        <ul v-else class="mt-4 divide-y divide-slate-100">
          <li v-for="entry in alerts.slice(0, 5)" :key="String(entry.id_alerta)" class="flex flex-wrap justify-between gap-3 py-3">
            <div><RouterLink :to="`/institucion/alertas/${encodeURIComponent(String(entry.id_alerta))}`" class="font-bold text-slate-900 hover:text-orange-700">Alerta #{{ entry.id_alerta }}</RouterLink><p class="text-xs text-slate-500">{{ fmt(`${entry.fecha}T${entry.hora}Z`) }}</p></div>
            <span class="rounded-full bg-orange-50 px-2 py-1 text-xs font-bold text-orange-800">{{ entry.instituciones_notificadas?.find(row => String(row.id_institucion) === String(id))?.estado ?? 'Sin estado' }}</span>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>