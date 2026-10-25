<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AlertTriangle, Building2, ChevronRight, RefreshCw, ShieldCheck, Users } from 'lucide-vue-next'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'
import { backendAlertsService, type BackendAlert } from '../services/backend-alerts.service'
import { useInstitutionStore } from '../stores/institution.store'
import { useUserStore } from '../stores/user.store'

const institutionStore = useInstitutionStore()
const userStore = useUserStore()
const alerts = ref<BackendAlert[]>([])
const loading = ref(false)
const error = ref('')
const active = computed(() => alerts.value.filter(a => !['CERRADA', 'DESCARTADA'].includes(a.estado)).length)
const recent = computed(() => [...alerts.value].sort((a,b) => `${b.fecha}T${b.hora}`.localeCompare(`${a.fecha}T${a.hora}`)).slice(0, 5))
async function load() {
  loading.value = true; error.value = ''
  await Promise.all([userStore.fetchUsers(), institutionStore.fetchInstitutions()])
  try { alerts.value = await backendAlertsService.list() }
  catch (cause) { alerts.value = []; error.value = cause instanceof Error ? cause.message : 'No se pudieron cargar las alertas.' }
  finally { loading.value = false }
}
onMounted(() => { void load() })
</script>

<template>
  <div class="admin-page mx-auto max-w-[1600px] space-y-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0"><p class="text-xs font-extrabold uppercase tracking-[0.17em] text-orange-600">Panel de administración</p><h1 class="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Centro de control</h1><p class="mt-2 max-w-xl text-sm text-slate-600">Visión general de usuarios, instituciones y alertas registradas en el servidor.</p></div>
      <button type="button" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40" :disabled="loading" @click="load"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }"/> Actualizar datos</button>
    </header>
    <div v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Alertas: {{ error }}</div>
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
      <div v-for="metric in [
        { label:'Usuarios', value: userStore.error ? '—' : userStore.users.length, icon: Users, note: 'Cuentas registradas' },
        { label:'Instituciones', value: institutionStore.error ? '—' : institutionStore.institutions.length, icon: Building2, note: 'Organizaciones' },
        { label:'Alertas', value: error ? '—' : alerts.length, icon: AlertTriangle, note:'Registros de alertas' },
        { label:'Alertas por atender', value: error ? '—' : active, icon: ShieldCheck, note:'No cerradas ni descartadas' }
      ]" :key="metric.label" class="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-2"><span class="break-words text-sm font-semibold text-slate-600">{{ metric.label }}</span><span class="rounded-xl bg-orange-50 p-2.5 text-orange-600"><component :is="metric.icon" class="h-5 w-5"/></span></div>
        <p class="mt-3 text-3xl font-extrabold text-slate-900">{{ metric.value }}</p><p class="mt-1 text-xs text-slate-500">{{ metric.note }}</p>
      </div>
    </section>
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div class="flex items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-wider text-orange-600">Actividad</p><h2 class="mt-1 text-lg font-extrabold text-slate-900">Últimas alertas</h2></div><RouterLink to="/super-admin/alertas" class="inline-flex items-center gap-1 text-sm font-bold text-orange-700 hover:underline">Ver todas <ChevronRight class="h-4 w-4"/></RouterLink></div>
        <p v-if="loading" class="mt-6 text-sm text-slate-500">Consultando alertas...</p>
        <p v-else-if="!recent.length" class="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">{{ error ? 'No se pudo cargar el historial de alertas.' : 'No hay alertas registradas.' }}</p>
        <ul v-else class="mt-4 divide-y divide-slate-100"><li v-for="alert in recent" :key="String(alert.id_alerta)" class="flex min-w-0 flex-wrap items-center justify-between gap-2 py-3"><div class="min-w-0"><p class="break-words text-sm font-bold text-slate-900">Alerta #{{ alert.id_alerta }}</p><p class="mt-1 text-xs text-slate-500">{{ alert.fecha }} · {{ alert.hora }}</p></div><span class="min-w-0 max-w-full break-all rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800">{{ alert.estado }}</span></li></ul>
      </section>
      <section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><p class="text-xs font-bold uppercase tracking-wider text-orange-600">Acceso rápido</p><h2 class="mt-1 text-lg font-extrabold text-slate-900">Gestión del sistema</h2><nav class="mt-4 space-y-2"><RouterLink v-for="entry in [{ name: 'Administrar usuarios', path: '/super-admin/usuarios', icon: Users },{ name: 'Instituciones', path: '/super-admin/instituciones', icon: Building2 },{ name: 'Alertas del sistema', path: '/super-admin/alertas', icon: AlertTriangle }]" :key="entry.path" :to="entry.path" class="flex min-h-12 min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50"><span class="flex min-w-0 items-center gap-2 break-words"><component :is="entry.icon" class="h-4 w-4 shrink-0 text-orange-600"/>{{ entry.name }}</span><ChevronRight class="h-4 w-4 shrink-0"/></RouterLink></nav></section>
    </div>
    <section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><p class="text-xs font-bold uppercase tracking-wider text-orange-600">Mapa</p><h2 class="mt-1 mb-4 text-lg font-extrabold text-slate-900">Ubicación de instituciones</h2><MonitoringMap :show-sensors="false" :show-incidents="false" :show-institutions="true" :show-reports="false" height-class="h-[330px]" /></section>
  </div>
</template>
