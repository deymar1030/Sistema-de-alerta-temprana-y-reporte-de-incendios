<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  CalendarDays,
  Search,
} from 'lucide-vue-next'

import StatusBadge from '../components/common/StatusBadge.vue'

import { useIncidentStore } from '../stores/incident.store'
import { useReportStore } from '../stores/report.store'

import type {
  IncidentStatus,
  RiskLevel,
} from '../types'

const incidentStore = useIncidentStore()
const reportStore = useReportStore()

const search = ref('')
const filter = ref('CERRADOS')

const rows = computed(() => {
  return incidentStore.incidents.filter(
    (incident) => {
      const term =
        search.value
          .trim()
          .toLowerCase()

      const matchesSearch =
        !term ||
        `${incident.id} ${incident.ubicacion} ${incident.descripcion}`
          .toLowerCase()
          .includes(term)

      const matchesState =
        filter.value === 'TODOS' ||
        (
          filter.value === 'CERRADOS' &&
          ['CERRADA', 'FINALIZADA'].includes(
            incident.status,
          )
        ) ||
        incident.status === filter.value

      return matchesSearch && matchesState
    },
  )
})

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

const statusTone = (
  status: IncidentStatus,
) => {
  if (
    status === 'CERRADA' ||
    status === 'FINALIZADA'
  ) {
    return 'success' as const
  }

  if (
    status === 'CONTROLADA' ||
    status === 'VALIDADA'
  ) {
    return 'info' as const
  }

  return 'warning' as const
}

const fmt = (
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
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date)
}

const hasReport = (
  incidentId: string,
) => {
  return reportStore.reports.some(
    (report) =>
      report.incidentId === incidentId,
  )
}

onMounted(async () => {
  await Promise.all([
    incidentStore.fetchIncidents(),
    reportStore.fetchReports(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <section>
      <p
        class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500"
      >
        Centro de Monitoreo · Archivo
      </p>

      <h2
        class="mt-2 text-2xl font-semibold text-slate-900"
      >
        Historial de incidentes
      </h2>

      <p
        class="mt-2 max-w-3xl text-sm text-slate-600"
      >
        Consulta las alertas registradas,
        instituciones notificadas e informes
        de atención relacionados.
      </p>
    </section>

    <!-- Tabla -->
    <section
      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <!-- Filtros -->
      <div
        class="grid gap-3 md:grid-cols-[1fr_220px]"
      >
        <label class="relative">
          <Search
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />

          <input
            v-model="search"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-300"
            placeholder="Buscar alerta o ubicación"
          />
        </label>

        <select
          v-model="filter"
          class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
        >
          <option value="CERRADOS">
            Cerrados / finalizados
          </option>

          <option value="TODOS">
            Todos
          </option>

          <option value="EN_VALIDACION">
            En evaluación
          </option>

          <option value="VALIDADA">
            Confirmados
          </option>

          <option value="CONTROLADA">
            Atendidos
          </option>

          <option value="CERRADA">
            Cerrados
          </option>
        </select>
      </div>

      <!-- Sin resultados -->
      <div
        v-if="rows.length === 0"
        class="py-12 text-center"
      >
        <p
          class="text-sm font-medium text-slate-700"
        >
          No se encontraron incidentes.
        </p>

        <p
          class="mt-1 text-xs text-slate-500"
        >
          Prueba cambiando el filtro o la búsqueda.
        </p>
      </div>

      <!-- Tabla -->
      <div
        v-else
        class="mt-5 overflow-x-auto"
      >
        <table
          class="min-w-[850px] w-full text-left text-sm"
        >
          <thead
            class="border-b border-slate-200 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            <tr>
              <th class="pb-3">
                Alerta
              </th>

              <th class="pb-3">
                Ubicación
              </th>

              <th class="pb-3">
                Fecha
              </th>

              <th class="pb-3">
                Riesgo
              </th>

              <th class="pb-3">
                Instituciones
              </th>

              <th class="pb-3">
                Informe
              </th>

              <th class="pb-3">
                Estado
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="incident in rows"
              :key="incident.id"
              class="border-b border-slate-100 last:border-0"
            >
              <!-- ID -->
              <td
                class="py-4 font-semibold text-slate-900"
              >
                #{{ incident.id }}
              </td>

              <!-- Ubicación -->
              <td
                class="py-4 text-slate-600"
              >
                {{ incident.ubicacion }}
              </td>

              <!-- Fecha -->
              <td
                class="py-4 text-slate-600"
              >
                <span
                  class="flex items-center gap-2"
                >
                  <CalendarDays
                    class="h-4 w-4 text-slate-400"
                  />

                  {{
                    fmt(
                      incident.createdAt,
                    )
                  }}
                </span>
              </td>

              <!-- Riesgo -->
              <td class="py-4">
                <StatusBadge
                  :state="incident.riesgo"
                  :tone="
                    riskTone(
                      incident.riesgo,
                    )
                  "
                >
                  {{
                    incident.riesgo
                  }}
                </StatusBadge>
              </td>

              <!-- Instituciones reales -->
              <td
                class="py-4 text-slate-600"
              >
                {{
                  incident.institucionesNotificadas ??
                  0
                }}
              </td>

              <!-- Informe real -->
              <td
                class="py-4 text-slate-600"
              >
                <span
                  v-if="
                    hasReport(
                      incident.id,
                    )
                  "
                  class="font-medium text-emerald-700"
                >
                  Disponible
                </span>

                <span
                  v-else
                  class="text-slate-500"
                >
                  Pendiente / no aplica
                </span>
              </td>

              <!-- Estado -->
              <td class="py-4">
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Aviso -->
    <section
      class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      <p
        class="text-xs leading-5 text-slate-500"
      >
        La bitácora de auditoría no se muestra
        temporalmente porque el backend todavía
        no expone un endpoint de auditoría.
        El historial mostrado utiliza alertas e
        informes registrados en el sistema.
      </p>
    </section>
  </div>
</template>