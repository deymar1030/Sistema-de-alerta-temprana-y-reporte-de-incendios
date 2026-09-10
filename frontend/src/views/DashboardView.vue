<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AlertTriangle, Activity, BellRing, Flame, Gauge, ShieldCheck } from 'lucide-vue-next'
import { Chart, registerables } from 'chart.js'
import { useAlertStore } from '../stores/alert.store'
import { useReadingStore } from '../stores/reading.store'
import { useSensorStore } from '../stores/sensor.store'
import MetricCard from '../components/common/MetricCard.vue'
import RiskBadge from '../components/common/RiskBadge.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import EmptyState from '../components/common/EmptyState.vue'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'
import { useRealtimeMonitoring } from '../composables/useRealtimeMonitoring'

Chart.register(...registerables)

const sensorStore = useSensorStore()
const readingStore = useReadingStore()
const alertStore = useAlertStore()

const { temperature, smoke, co, risk, status, selectedScenario, setScenario, demoScenarios } = useRealtimeMonitoring()
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const scenarioOptions = Object.keys(demoScenarios)

const generalRisk = computed(() => {
  if (risk.value >= 75) return 'critical'
  if (risk.value >= 50) return 'high'
  if (risk.value >= 30) return 'warning'
  return 'normal'
})

const safetySummary = computed(() => {
  if (risk.value >= 75) return 'Riesgo crítico'
  if (risk.value >= 50) return 'Riesgo alto'
  if (risk.value >= 30) return 'Advertencia'
  return 'Sistema estable'
})

type MetricTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const metricCards = computed<Array<{ title: string; value: string; detail: string; trend: string; tone: MetricTone; icon: typeof Activity }>>(() => [
  {
    title: 'Sensores activos',
    value: `${sensorStore.activeSensors} / ${sensorStore.sensors.length || 0}`,
    detail: 'Estado operativo',
    trend: '+2% última hora',
    tone: 'success',
    icon: Activity,
  },
  {
    title: 'Lecturas hoy',
    value: readingStore.readings.length ? `${readingStore.readings.length * 1_500}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0',
    detail: 'Monitoreo acumulado',
    trend: '+8.4%',
    tone: 'info',
    icon: Gauge,
  },
  {
    title: 'Alertas activas',
    value: String(alertStore.alerts.filter((a) => a.estado !== 'RESUELTA').length || 0),
    detail: 'Requieren atención',
    trend: '3 nuevas',
    tone: 'warning',
    icon: BellRing,
  },
  {
    title: 'Riesgo general',
    value: status.value,
    detail: 'Evaluación en tiempo real',
    trend: `${risk.value}%`,
    tone: generalRisk.value === 'critical' ? 'danger' : generalRisk.value === 'high' ? 'warning' : generalRisk.value === 'warning' ? 'warning' : 'success',
    icon: Flame,
  },
])

const initializeChart = () => {
  if (!chartCanvas.value) return

  const labels = Array.from({ length: 12 }, (_, index) => `${index + 1}m`)
  const data = {
    labels,
    datasets: [
      {
        label: 'Temperatura',
        data: [24.2, 24.5, 25.1, 24.8, 25.4, 26.1, 25.6, 25.9, 26.4, 26.1, 25.8, 26.2],
        borderColor: '#F56E2B',
        backgroundColor: 'rgba(245, 110, 43, 0.12)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Humo',
        data: [0.12, 0.18, 0.16, 0.2, 0.22, 0.21, 0.3, 0.25, 0.28, 0.27, 0.31, 0.29],
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        tension: 0.35,
        fill: true,
      },
    ],
  }

  new Chart(chartCanvas.value, {
    type: 'line',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#cbd5e1' } },
      },
      interaction: { intersect: false, mode: 'index' },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.12)' } },
      },
    },
  })
}

onMounted(async () => {
  await sensorStore.fetchSensors()
  await readingStore.fetchReadings()
  await alertStore.fetchAlerts()
  initializeChart()
})
</script>

<template>
  <div class="space-y-6">
    <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-[10px] uppercase tracking-[0.24em] text-slate-400">Modo demostración</p>
        <h2 class="mt-2 text-xl font-semibold text-white">Escenario activo: {{ selectedScenario }}</h2>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select v-model="selectedScenario" @change="setScenario(selectedScenario)" class="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100">
          <option v-for="option in scenarioOptions" :key="option" :value="option">{{ option }}</option>
        </select>
        <button class="rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2.5 text-sm font-medium text-orange-200 transition hover:bg-orange-500/20" @click="setScenario('Sistema normal')">Restaurar</button>
      </div>
    </div>

    <div v-if="sensorStore.loading || readingStore.loading || alertStore.loading" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <LoadingSpinner />
    </div>

    <div v-else-if="sensorStore.error || readingStore.error || alertStore.error" class="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-red-200">
      {{ sensorStore.error || readingStore.error || alertStore.error }}
    </div>

    <template v-else>
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          v-for="card in metricCards"
          :key="card.title"
          :title="card.title"
          :value="card.value"
          :detail="card.detail"
          :trend="card.trend"
          :tone="card.tone"
          :icon="card.icon"
        />
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div class="mb-5 flex items-center justify-between">
            <div>
              <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Mapa de monitoreo</p>
              <h2 class="mt-2 text-xl font-semibold text-white">Datos de demostración</h2>
            </div>
            <RiskBadge :level="generalRisk" />
          </div>
          <MonitoringMap />
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div class="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                <ShieldCheck class="h-4 w-4 text-emerald-300" />
                Estado global
              </div>
              <p class="text-2xl font-semibold text-white">{{ safetySummary }}</p>
              <p class="mt-2 text-sm text-slate-400">Valores de demostración para evaluación de prototipo.</p>
            </div>
            <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div class="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                <AlertTriangle class="h-4 w-4 text-amber-300" />
                Riesgo calculado
              </div>
              <p class="text-2xl font-semibold text-white">{{ risk }}%</p>
              <p class="mt-2 text-sm text-slate-400">Evaluación basada en temperatura, humo y CO.</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Monitoreo en tiempo real</p>
          <div class="mt-4 space-y-4">
            <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div class="flex items-center justify-between">
                <span class="text-xs uppercase tracking-[0.22em] text-slate-400">Temperatura</span>
                <StatusBadge state="Normal" tone="success">Normal</StatusBadge>
              </div>
              <p class="mt-3 text-3xl font-semibold text-white">{{ temperature.toFixed(1) }}°C</p>
              <p class="mt-2 text-xs text-slate-400">Actualizado hace 2s</p>
            </div>
            <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div class="flex items-center justify-between">
                <span class="text-xs uppercase tracking-[0.22em] text-slate-400">Humo</span>
                <StatusBadge state="Normal" tone="success">Normal</StatusBadge>
              </div>
              <p class="mt-3 text-3xl font-semibold text-white">{{ smoke.toFixed(2) }}</p>
              <p class="mt-2 text-xs text-slate-400">Actualizado hace 2s</p>
            </div>
            <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div class="flex items-center justify-between">
                <span class="text-xs uppercase tracking-[0.22em] text-slate-400">CO</span>
                <StatusBadge state="Normal" tone="success">Normal</StatusBadge>
              </div>
              <p class="mt-3 text-3xl font-semibold text-white">{{ co.toFixed(1) }} ppm</p>
              <p class="mt-2 text-xs text-slate-400">Actualizado hace 2s</p>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Riesgo y tendencia</p>
            <h2 class="mt-2 text-xl font-semibold text-white">Temperatura, humo y CO</h2>
          </div>
          <div class="flex gap-2 text-xs text-slate-300">
            <button class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5">1 hora</button>
            <button class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5">6 horas</button>
            <button class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5">24 horas</button>
          </div>
        </div>
        <div class="h-80">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Alertas recientes</p>
          <div class="mt-4 space-y-3">
            <div v-if="alertStore.alerts.length === 0">
              <EmptyState title="No hay alertas" message="No existen eventos en este momento." />
            </div>
            <div v-else v-for="alert in alertStore.alerts.slice(0, 3)" :key="alert.id_alerta" class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-slate-400">{{ alert.id_alerta }}</p>
                  <p class="mt-2 text-base font-semibold text-white">{{ alert.sensor }}</p>
                </div>
                <StatusBadge :tone="alert.nivel === 'CRÍTICO' ? 'danger' : alert.nivel === 'ALTO' ? 'warning' : 'neutral'" :state="alert.nivel">
                  {{ alert.nivel }}
                </StatusBadge>
              </div>
              <p class="mt-3 text-sm text-slate-300">{{ alert.descripcion }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Vista operativa</p>
          <div class="mt-4 space-y-3">
            <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Sistema</div>
              <div class="mt-2 flex items-center justify-between">
                <span class="text-white">Monitoreo activo</span>
                <span class="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
            </div>
            <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Último evento</div>
              <div class="mt-2 text-white">{{ alertStore.alerts[0]?.descripcion || 'Sin eventos' }}</div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
