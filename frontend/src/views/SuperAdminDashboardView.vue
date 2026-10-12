<script setup lang="ts">
import { computed, onMounted } from 'vue'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'
import { useAlertStore } from '../stores/alert.store'
import { useAuditStore } from '../stores/audit.store'
import { useIncidentStore } from '../stores/incident.store'
import { useInstitutionStore } from '../stores/institution.store'
import { useUserStore } from '../stores/user.store'

const alertStore = useAlertStore()
const auditStore = useAuditStore()
const incidentStore = useIncidentStore()
const institutionStore = useInstitutionStore()
const userStore = useUserStore()

const totalUsers = computed(() => userStore.users.length)
const totalAlerts = computed(() => alertStore.alerts.length)
const activeAlerts = computed(() =>
  alertStore.alerts.filter((alert) => alert.estado !== 'RESUELTA').length,
)
const totalIncidents = computed(() => incidentStore.incidents.length)
const totalInstitutions = computed(() => institutionStore.institutions.length)
const auditDisplay = computed(() => '—')

onMounted(async () => {
  await Promise.all([
    userStore.fetchUsers(),
    institutionStore.fetchInstitutions(),
    alertStore.fetchAlerts(),
    incidentStore.fetchIncidents(),
    auditStore.fetchLogs(),
  ])
})
</script>

<template>
  <div class="space-y-6 p-6">
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Administración general</p>
      <h1 class="mt-2 text-3xl font-bold text-slate-900">Dashboard general</h1>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-slate-500">Usuarios</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">{{ totalUsers }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-slate-500">Alertas</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">{{ totalAlerts }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-slate-500">Incidentes</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">{{ totalIncidents }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-slate-500">Auditoría</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">{{ auditDisplay }}</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">Resumen operativo</h2>
        <ul class="mt-4 space-y-3 text-sm text-slate-600">
          <li>• Monitoreo central activo.</li>
          <li>• {{ totalInstitutions }} instituciones registradas.</li>
          <li>• {{ activeAlerts }} alertas activas.</li>
          <li v-if="auditDisplay === '—'" class="text-slate-500">• Auditoría: sin datos del backend.</li>
        </ul>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">Accesos rápidos</h2>
        <div class="mt-4 grid gap-2 text-sm font-medium text-slate-700">
          <button class="rounded-xl bg-slate-50 p-3 text-left">Usuarios del sistema</button>
          <button class="rounded-xl bg-slate-50 p-3 text-left">Alertas por validar</button>
          <button class="rounded-xl bg-slate-50 p-3 text-left">Auditoría reciente</button>
        </div>
      </div>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4">
        <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Mapa operativo</p>
        <h2 class="mt-1 text-xl font-semibold text-slate-900">Mapa de alertas e instituciones</h2>
      </div>
      <MonitoringMap
        :show-sensors="false"
        :show-incidents="true"
        :show-institutions="true"
        :show-reports="false"
        height-class="h-[400px]"
      />
    </section>
  </div>
</template>
