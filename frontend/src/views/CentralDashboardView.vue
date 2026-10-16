<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  AlertTriangle,
  Building2,
  Flame,
  MapPinned,
  RadioTower,
} from 'lucide-vue-next'

import MetricCard from '../components/common/MetricCard.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'

import { useIncidentStore } from '../stores/incident.store'
import { useInstitutionStore } from '../stores/institution.store'

import type {
  IncidentStatus,
  RiskLevel,
} from '../types'

const incidentStore = useIncidentStore()
const institutionStore = useInstitutionStore()

const showSensors = ref(true)
const showIncidents = ref(true)
const showInstitutions = ref(true)
const showReports = ref(true)

const activeIncidents = computed(() =>
  incidentStore.incidents.filter(
    (item) =>
      ![
        'CERRADA',
        'FINALIZADA',
        'FALSA_ALARMA',
        'CANCELADA',
      ].includes(item.status),
  ),
)

const pending = computed(() =>
  incidentStore.incidents.filter((item) =>
    [
      'NUEVA',
      'EN_VALIDACION',
      'VALIDADA',
    ].includes(item.status),
  ),
)

const critical = computed(() =>
  activeIncidents.value.filter(
    (item) =>
      item.riesgo === 'critical' ||
      item.riesgo === 'high',
  ),
)

const availableInstitutions = computed(() =>
  institutionStore.institutions.filter(
    (item) =>
      item.disponibilidad === 'DISPONIBLE',
  ),
)

const metrics = computed(() => [
  {
    title: 'Alertas por revisar',
    value: String(pending.value.length),
    detail: 'Requieren decisión humana',
    trend: 'Centro de monitoreo',
    tone: 'warning' as const,
    icon: AlertTriangle,
  },
  {
    title: 'Incidentes activos',
    value: String(activeIncidents.value.length),
    detail: 'Seguimiento operativo',
    trend: `${critical.value.length} prioritarios`,
    tone: critical.value.length
      ? 'danger' as const
      : 'success' as const,
    icon: Flame,
  },
  {
    title: 'Instituciones disponibles',
    value: String(
      availableInstitutions.value.length,
    ),
    detail: 'Disponibilidad operativa actual',
    trend: `${institutionStore.institutions.length} registradas`,
    tone: 'success' as const,
    icon: Building2,
  },
])

const statusTone = (
  status: IncidentStatus,
) => {
  if (
    [
      'CERRADA',
      'FINALIZADA',
      'CONTROLADA',
    ].includes(status)
  ) {
    return 'success' as const
  }

  if (
    [
      'EN_VALIDACION',
      'VALIDADA',
    ].includes(status)
  ) {
    return 'warning' as const
  }

  if (
    [
      'DESPACHADA',
      'ACEPTADA',
      'EN_CAMINO',
      'EN_SITIO',
    ].includes(status)
  ) {
    return 'info' as const
  }

  return 'neutral' as const
}

const riskTone = (
  risk: RiskLevel,
) => {
  if (risk === 'critical') {
    return 'danger' as const
  }

  if (
    risk === 'high' ||
    risk === 'warning'
  ) {
    return 'warning' as const
  }

  return 'success' as const
}

const formatTime = (
  value: string,
) => {
  const date = new Date(value)

  if (
    Number.isNaN(date.getTime())
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    },
  ).format(date)
}

onMounted(async () => {
  await Promise.all([
    incidentStore.fetchIncidents(),
    institutionStore.fetchInstitutions(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <section
      class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div>
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500"
        >
          Centro de Monitoreo
        </p>

        <h2
          class="mt-2 text-2xl font-semibold text-slate-900"
        >
          Vista general de riesgo y coordinación
        </h2>

        <p
          class="mt-2 max-w-3xl text-sm text-slate-600"
        >
          Monitoreo de alertas, sensores,
          instituciones y reportes ciudadanos
          registrados en el sistema.
        </p>
      </div>

      <RouterLink
        to="/central/alertas"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f24a23] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#df3f1c]"
      >
        <RadioTower class="h-4 w-4" />

        Revisar alertas
      </RouterLink>
    </section>

    <!-- Métricas -->
    <section
      class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <MetricCard
        v-for="metric in metrics"
        :key="metric.title"
        v-bind="metric"
      />
    </section>

    <!-- Mapa + prioridad -->
    <section
      class="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]"
    >
      <!-- Mapa -->
      <div
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div
          class="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <p
              class="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Mapa operativo
            </p>

            <h3
              class="mt-1 text-xl font-semibold text-slate-900"
            >
              Puntos de peligro, sensores e instituciones
            </h3>
          </div>

          <div
            class="flex flex-wrap gap-2 text-xs"
          >
            <label
              class="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <input
                v-model="showSensors"
                type="checkbox"
                class="accent-emerald-600"
              />

              Sensores
            </label>

            <label
              class="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <input
                v-model="showIncidents"
                type="checkbox"
                class="accent-red-500"
              />

              Incidentes
            </label>

            <label
              class="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <input
                v-model="showInstitutions"
                type="checkbox"
                class="accent-sky-800"
              />

              Instituciones
            </label>

            <label
              class="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <input
                v-model="showReports"
                type="checkbox"
                class="accent-amber-600"
              />

              Reportes
            </label>
          </div>
        </div>

        <MonitoringMap
          :show-sensors="showSensors"
          :show-incidents="showIncidents"
          :show-institutions="showInstitutions"
          :show-reports="showReports"
        />
      </div>

      <!-- Incidentes prioritarios -->
      <aside
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div
          class="flex items-center justify-between"
        >
          <div>
            <p
              class="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Prioridad operativa
            </p>

            <h3
              class="mt-1 text-lg font-semibold text-slate-900"
            >
              Incidentes a vigilar
            </h3>
          </div>

          <MapPinned
            class="h-5 w-5 text-orange-500"
          />
        </div>

        <div
          v-if="activeIncidents.length > 0"
          class="mt-4 space-y-3"
        >
          <RouterLink
            v-for="incident in activeIncidents.slice(0, 5)"
            :key="incident.id"
            :to="
              incident.status === 'EN_VALIDACION' ||
              incident.status === 'VALIDADA'
                ? '/central/alertas'
                : '/central/incidentes'
            "
            class="block rounded-xl border border-slate-200 p-4 transition hover:border-orange-200 hover:bg-orange-50/40"
          >
            <div
              class="flex items-center justify-between gap-2"
            >
              <span
                class="text-xs font-semibold text-slate-500"
              >
                #{{ incident.id }}
              </span>

              <StatusBadge
                :state="incident.riesgo"
                :tone="
                  riskTone(
                    incident.riesgo,
                  )
                "
              >
                {{ incident.riesgo }}
              </StatusBadge>
            </div>

            <p
              class="mt-2 font-medium text-slate-900"
            >
              {{ incident.ubicacion }}
            </p>

            <p
              class="mt-1 line-clamp-2 text-sm text-slate-600"
            >
              {{ incident.descripcion }}
            </p>

            <div
              class="mt-3 flex items-center justify-between gap-2"
            >
              <StatusBadge
                :state="incident.status"
                :tone="
                  statusTone(
                    incident.status,
                  )
                "
              >
                {{
                  incident.status.replaceAll(
                    '_',
                    ' ',
                  )
                }}
              </StatusBadge>

              <span
                class="text-xs text-slate-400"
              >
                {{
                  formatTime(
                    incident.updatedAt ||
                      incident.createdAt,
                  )
                }}
              </span>
            </div>
          </RouterLink>
        </div>

        <div
          v-else
          class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center"
        >
          <p
            class="text-sm font-medium text-slate-700"
          >
            No hay incidentes activos.
          </p>

          <p
            class="mt-1 text-xs text-slate-500"
          >
            Las nuevas alertas aparecerán aquí.
          </p>
        </div>
      </aside>
    </section>

    <!-- Aviso despacho -->
    <section
      class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      <p
        class="text-xs leading-5 text-slate-500"
      >
        El seguimiento de despachos institucionales
        se habilitará cuando el backend exponga el
        flujo de asignación inicial de alertas a
        instituciones. Los estados de recepción,
        atención y cierre ya están contemplados por
        la API.
      </p>
    </section>
  </div>
</template>