<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AlertTriangle, Building2, Clock3, MapPin, Radio, Search, X } from 'lucide-vue-next'
import { useAlertStore } from '../stores/alert.store'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import RiskBadge from '../components/common/RiskBadge.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import type { AlertEntry, InstitutionDeliveryState } from '../types'

const alertStore = useAlertStore()
const activeFilter = ref<'TODAS' | 'ACTIVA' | 'EN REVISIÓN' | 'RESUELTA'>('TODAS')
const search = ref('')
const selectedAlert = ref<AlertEntry | null>(null)

const filteredAlerts = computed(() => alertStore.alerts.filter((alert) => {
  const matchesFilter = activeFilter.value === 'TODAS' || alert.estado === activeFilter.value
  const query = search.value.toLowerCase()
  return matchesFilter && (!query || `${alert.id_alerta} ${alert.sensor} ${alert.ubicacion}`.toLowerCase().includes(query))
}))

const countFor = (state: 'ACTIVA' | 'EN REVISIÓN' | 'RESUELTA') => alertStore.alerts.filter((alert) => alert.estado === state).length
const riskLevel = (nivel: AlertEntry['nivel']) => ({ BAJO: 'normal', MEDIO: 'warning', ALTO: 'high', 'CRÍTICO': 'critical' })[nivel] as 'normal' | 'warning' | 'high' | 'critical'
const statusTone = (estado: AlertEntry['estado']) => estado === 'ACTIVA' ? 'danger' : estado === 'EN REVISIÓN' ? 'warning' : 'success'
const deliveryTone = (estado: InstitutionDeliveryState) => estado === 'RECIBIDA' ? 'success' : estado === 'FALLIDA' ? 'danger' : estado === 'EN_PROCESO' ? 'warning' : 'info'

onMounted(async () => {
  await alertStore.fetchAlerts()
})
</script>

<template>
  <div class="alerts-page space-y-6">
    <section class="alerts-hero rounded-3xl border border-orange-400/20 p-5 sm:p-7">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300"><AlertTriangle class="h-4 w-4" /> Centro de alertas</div>
          <h2 class="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Respuesta y coordinación operativa</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Supervisa eventos detectados y confirma la entrega de cada notificación a las instituciones de respuesta.</p>
        </div>
        <div class="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"><span class="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Monitoreo activo</div>
      </div>
    </section>

    <section class="grid gap-3 sm:grid-cols-3">
      <button v-for="item in [{ label: 'Activas', state: 'ACTIVA' }, { label: 'En revisión', state: 'EN REVISIÓN' }, { label: 'Resueltas', state: 'RESUELTA' }]" :key="item.state" class="metric-filter rounded-2xl border p-4 text-left" :class="activeFilter === item.state ? 'metric-filter-active' : ''" @click="activeFilter = item.state as typeof activeFilter">
        <span class="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{{ item.label }}</span>
        <strong class="mt-2 block text-3xl text-white">{{ countFor(item.state as 'ACTIVA' | 'EN REVISIÓN' | 'RESUELTA') }}</strong>
      </button>
    </section>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button v-for="filter in ['TODAS', 'ACTIVA', 'EN REVISIÓN', 'RESUELTA']" :key="filter" class="rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition" :class="activeFilter === filter ? 'border-orange-400/50 bg-orange-400/10 text-orange-200' : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'" @click="activeFilter = filter as typeof activeFilter">{{ filter }}</button>
      </div>
      <label class="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-400 sm:w-72"><Search class="h-4 w-4" /><input v-model="search" class="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Buscar alerta..." /></label>
    </div>

    <div v-if="alertStore.loading" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><LoadingSpinner /></div>
    <div v-else-if="alertStore.error" class="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-red-200">{{ alertStore.error }}</div>
    <div v-else-if="filteredAlerts.length" class="grid gap-4 xl:grid-cols-2">
      <article v-for="alert in filteredAlerts" :key="alert.id_alerta" class="alert-card rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div class="flex items-start justify-between gap-4"><div><span class="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300">{{ alert.id_alerta }}</span><h3 class="mt-2 text-lg font-semibold text-white">{{ alert.sensor }}</h3></div><RiskBadge :level="riskLevel(alert.nivel)" /></div>
        <p class="mt-4 text-sm leading-6 text-slate-300">{{ alert.descripcion }}</p>
        <div class="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-2"><div class="flex items-center gap-2"><Clock3 class="h-4 w-4 text-slate-500" />{{ alert.fecha }} · {{ alert.hora }}</div><div class="flex items-center gap-2"><MapPin class="h-4 w-4 text-slate-500" />{{ alert.ubicacion }}</div><div class="flex items-center gap-2"><Radio class="h-4 w-4 text-slate-500" />Sensor {{ alert.id_sensor }}</div><div class="flex items-center gap-2"><Building2 class="h-4 w-4 text-slate-500" />{{ alert.instituciones_notificadas.length }} instituciones</div></div>
        <div class="mt-5 flex items-center justify-between border-t border-slate-800 pt-4"><StatusBadge :state="alert.estado" :tone="statusTone(alert.estado)">{{ alert.estado }}</StatusBadge><button class="text-xs font-semibold text-orange-300 transition hover:text-orange-200" @click="selectedAlert = alert">Ver detalle <span aria-hidden="true">→</span></button></div>
      </article>
    </div>
    <div v-else class="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">No hay alertas que coincidan con el filtro.</div>

    <div v-if="selectedAlert" class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" @click.self="selectedAlert = null">
      <section class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-slate-700 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div class="flex items-start justify-between gap-4"><div><span class="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300">Detalle de alerta · {{ selectedAlert.id_alerta }}</span><h2 class="mt-2 text-2xl font-semibold text-white">{{ selectedAlert.sensor }}</h2></div><button class="rounded-xl border border-slate-700 p-2 text-slate-300 hover:text-white" aria-label="Cerrar detalle" @click="selectedAlert = null"><X class="h-5 w-5" /></button></div>
        <div class="mt-6 grid gap-3 sm:grid-cols-3"><div class="rounded-xl bg-slate-950/60 p-4"><span class="detail-label">Riesgo</span><div class="mt-2"><RiskBadge :level="riskLevel(selectedAlert.nivel)" /></div></div><div class="rounded-xl bg-slate-950/60 p-4"><span class="detail-label">Estado</span><div class="mt-2"><StatusBadge :state="selectedAlert.estado" :tone="statusTone(selectedAlert.estado)">{{ selectedAlert.estado }}</StatusBadge></div></div><div class="rounded-xl bg-slate-950/60 p-4"><span class="detail-label">Lectura</span><strong class="mt-2 block text-white">{{ selectedAlert.lectura_referencia }}</strong></div></div>
        <p class="mt-5 text-sm leading-6 text-slate-300">{{ selectedAlert.descripcion }} Ubicación: <strong class="text-white">{{ selectedAlert.ubicacion }}</strong>.</p>
        <div class="mt-7"><div class="mb-3 flex items-center justify-between"><h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-white">Instituciones notificadas</h3><span class="text-xs text-slate-500">{{ selectedAlert.instituciones_notificadas.length }} destinos</span></div><div class="overflow-hidden rounded-xl border border-slate-800"><div v-for="institution in selectedAlert.instituciones_notificadas" :key="institution.nombre" class="grid gap-2 border-b border-slate-800 bg-slate-950/40 p-4 last:border-0 sm:grid-cols-[1.5fr_0.8fr_0.6fr_auto] sm:items-center"><span class="text-sm font-medium text-slate-200">{{ institution.nombre }}</span><span class="text-xs text-slate-400">{{ institution.fecha_envio }}</span><span class="text-xs text-slate-400">{{ institution.hora_envio }}</span><StatusBadge :state="institution.estado_envio" :tone="deliveryTone(institution.estado_envio)">{{ institution.estado_envio.replace('_', ' ') }}</StatusBadge></div></div></div>
      </section>
    </div>
  </div>
</template>
