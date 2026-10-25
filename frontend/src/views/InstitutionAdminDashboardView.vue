<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AlertTriangle, Building2, CheckCircle2, RefreshCw } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.store'
import { useInstitutionStore } from '../stores/institution.store'
import { backendAlertsService, type BackendAlert } from '../services/backend-alerts.service'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'
const auth = useAuthStore()
const institutions = useInstitutionStore()
const id = computed(() => auth.user?.institutionId ?? auth.user?.institucionId ?? null)
const institution = computed(() => institutions.institutions.find((v) => v.id === id.value))
const alerts = ref<BackendAlert[]>([])
const loading = ref(false)
const error = ref('')
const active = computed(() => alerts.value.filter((a) => !['CERRADA', 'DESCARTADA'].includes(a.estado)))
const closed = computed(() => alerts.value.filter((a) => a.instituciones_notificadas?.some((v) => String(v.id_institucion) === String(id.value) && v.estado === 'CERRADA')).length)
const fmt = (date: string) => { const parsed = new Date(date); return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString('es-BO') }
async function load() {
  error.value = ''
  if (!id.value) { error.value = 'Tu usuario no tiene una institución asignada.'; return }
  loading.value = true
  await institutions.fetchInstitutions()
  try { alerts.value = await backendAlertsService.byInstitution(id.value) }
  catch (cause) { alerts.value = []; error.value = cause instanceof Error ? cause.message : 'No se pudieron cargar alertas.' }
  finally { loading.value = false }
}
onMounted(() => { void load() })
</script>
<template>
  <div class="admin-page mx-auto max-w-[1600px] space-y-6"><header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div class="min-w-0"><p class="text-xs font-bold uppercase tracking-wider text-orange-600">Administración institucional</p><h1 class="mt-1 break-words text-2xl font-extrabold text-slate-900 sm:text-3xl">{{ institution?.nombre ?? 'Mi institución' }}</h1><p class="mt-2 max-w-xl text-sm text-slate-600">Alertas dirigidas a tu institución y estados persistidos en el backend.</p></div><button type="button" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50" :disabled="loading" @click="load"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" /> Actualizar</button></header><p v-if="error" role="alert" class="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{{ error }}</p>
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-3"><div v-for="item in [{ label: 'Alertas recibidas', value: error ? '—' : alerts.length, icon: AlertTriangle }, {label: 'En seguimiento', value: error ? '—' : active.length, icon: Building2}, {label:'Envíos cerrados', value: error ? '—' : closed, icon: CheckCircle2}]" :key="item.label" class="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex items-center justify-between gap-2"><span class="text-sm font-semibold text-slate-600">{{ item.label }}</span><component :is="item.icon" class="h-5 w-5 shrink-0 text-orange-600" /></div><p class="mt-3 text-3xl font-extrabold text-slate-900">{{ item.value }}</p></div></section>
    <div class="grid min-w-0 gap-5 xl:grid-cols-2"><section class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div class="flex flex-wrap justify-between gap-2"><h2 class="text-lg font-extrabold text-slate-900">Actividad reciente</h2><RouterLink to="/institucion/alertas" class="text-sm font-bold text-orange-700">Ver todas</RouterLink></div><p v-if="loading" class="mt-4 text-sm text-slate-600">Cargando...</p><p v-else-if="!alerts.length" class="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No se registran alertas de esta institución.</p><ul v-else class="mt-4 divide-y divide-slate-100"><li v-for="alert in alerts.slice(0,5)" :key="String(alert.id_alerta)" class="flex min-w-0 flex-wrap justify-between gap-2 py-3"><div class="min-w-0"><RouterLink :to="`/institucion/alertas/${encodeURIComponent(String(alert.id_alerta))}`" class="break-words font-bold text-slate-900 hover:text-orange-700">Alerta #{{ alert.id_alerta }}</RouterLink><p class="text-xs text-slate-500">{{ fmt(`${alert.fecha}T${alert.hora}Z`) }}</p></div><span class="max-w-full break-all rounded-full bg-orange-50 px-2 py-1 text-xs font-bold text-orange-800">{{ alert.instituciones_notificadas?.find(d => String(d.id_institucion) === String(id))?.estado ?? 'Sin estado' }}</span></li></ul></section><section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 class="mb-4 text-lg font-extrabold text-slate-900">Ubicación de la institución</h2><MonitoringMap :show-sensors="false" :show-incidents="false" :show-institutions="true" :show-reports="false" height-class="h-[300px]" /></section></div>
  </div>
</template>
