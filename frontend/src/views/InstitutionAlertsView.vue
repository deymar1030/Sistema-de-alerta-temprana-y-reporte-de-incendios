<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { AlertTriangle, MapPin } from 'lucide-vue-next'
import StatusBadge from '../components/common/StatusBadge.vue'
import { useAuthStore } from '../stores/auth.store'
import { useDispatchStore } from '../stores/dispatch.store'
import { useIncidentStore } from '../stores/incident.store'

const authStore = useAuthStore()
const dispatchStore = useDispatchStore()
const incidentStore = useIncidentStore()
const institutionId = computed(() => authStore.user?.institucionId ?? 'INS-001')
const myDispatches = computed(() => dispatchStore.dispatches.filter((item) => item.institutionId === institutionId.value).sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()))
const incidentFor = (id: string) => incidentStore.incidents.find((item) => item.id === id)
const fmt = (value: string) => new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
onMounted(async () => { await Promise.all([dispatchStore.fetchDispatches(), incidentStore.fetchIncidents()]) })
</script>

<template>
  <div class="space-y-6">
    <section><p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500">Administración institucional</p><h2 class="mt-2 text-2xl font-semibold text-slate-900">Alertas recibidas</h2><p class="mt-2 text-sm text-slate-600">Vista de consulta de los despachos dirigidos exclusivamente a tu institución. El despacho inicial lo realiza el Operador Central.</p></section>
    <section class="grid gap-4 lg:grid-cols-2">
      <article v-for="dispatch in myDispatches" :key="dispatch.id" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex items-start justify-between gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><AlertTriangle class="h-5 w-5" /></div><StatusBadge :state="dispatch.status" :tone="dispatch.status === 'FINALIZADA' ? 'success' : dispatch.status === 'RECHAZADA' ? 'danger' : 'info'">{{ dispatch.status.replaceAll('_',' ') }}</StatusBadge></div><p class="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{{ dispatch.id }} · {{ dispatch.incidentId }}</p><h3 class="mt-2 text-lg font-semibold text-slate-900">{{ incidentFor(dispatch.incidentId)?.descripcion }}</h3><p class="mt-3 flex items-start gap-2 text-sm text-slate-600"><MapPin class="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />{{ incidentFor(dispatch.incidentId)?.ubicacion }}</p><p class="mt-3 text-xs text-slate-400">Recibida {{ fmt(dispatch.sentAt) }}</p></article>
      <div v-if="myDispatches.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 lg:col-span-2">No hay alertas asignadas a la institución.</div>
    </section>
  </div>
</template>
