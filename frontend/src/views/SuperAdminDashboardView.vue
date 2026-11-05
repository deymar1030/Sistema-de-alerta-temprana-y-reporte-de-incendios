<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Clock3,
  Flame,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-vue-next'
import DashboardAlertsMap from '../components/dashboard/DashboardAlertsMap.vue'
import { backendAlertsService, type BackendAlert } from '../services/backend-alerts.service'
import { useInstitutionStore } from '../stores/institution.store'
import { useUserStore } from '../stores/user.store'

const institutionStore = useInstitutionStore()
const userStore = useUserStore()
const dashboardMap = ref<InstanceType<typeof DashboardAlertsMap> | null>(null)
const alerts = ref<BackendAlert[]>([])
const loading = ref(false)
const error = ref('')

// Se conservan las mismas fuentes y reglas de conteo del dashboard original.
const active = computed(() => alerts.value.filter(a => !['CERRADA', 'DESCARTADA', 'CANCELADA'].includes(a.estado)).length)
const recent = computed(() => [...alerts.value]
  .sort((a, b) => `${b.fecha}T${b.hora}`.localeCompare(`${a.fecha}T${a.hora}`))
  .slice(0, 5))

const metrics = computed(() => [
  {
    label: 'Usuarios',
    value: userStore.error ? '—' : userStore.users.length,
    note: 'Cuentas registradas',
    icon: Users,
    tone: 'neutral',
  },
  {
    label: 'Instituciones',
    value: institutionStore.error ? '—' : institutionStore.institutions.length,
    note: 'Organizaciones en el sistema',
    icon: Building2,
    tone: 'neutral',
  },
  {
    label: 'Alertas registradas',
    value: error.value ? '—' : alerts.value.length,
    note: 'Historial de alertas',
    icon: Flame,
    tone: 'ember',
  },
  {
    label: 'Alertas por atender',
    value: error.value ? '—' : active.value,
    note: 'No cerradas ni descartadas',
    icon: AlertTriangle,
    tone: 'danger',
  },
])

const shortcuts = [
  { name: 'Administrar usuarios', description: 'Cuentas y permisos', path: '/super-admin/usuarios', icon: Users },
  { name: 'Instituciones', description: 'Organizaciones registradas', path: '/super-admin/instituciones', icon: Building2 },
  { name: 'Alertas del sistema', description: 'Monitoreo y seguimiento', path: '/super-admin/alertas', icon: AlertTriangle },
]

function statusTone(status: string): string {
  switch (status.toUpperCase()) {
    case 'CERRADA':
      return 'status-closed'
    case 'DESCARTADA':
      return 'status-muted'
    case 'CONFIRMADA':
      return 'status-danger'
    case 'ATENDIDA':
      return 'status-progress'
    default:
      return 'status-pending'
  }
}

function readableStatus(status: string): string {
  return status.replace(/_/g, ' ')
}

async function load() {
  void dashboardMap.value?.refresh()
  loading.value = true
  error.value = ''
  await Promise.all([userStore.fetchUsers(), institutionStore.fetchInstitutions()])
  try {
    alerts.value = await backendAlertsService.list()
  } catch (cause) {
    alerts.value = []
    error.value = cause instanceof Error ? cause.message : 'No se pudieron cargar las alertas.'
  } finally {
    loading.value = false
  }
}

onMounted(() => { void load() })
</script>

<template>
  <!-- Diseño de prueba aislado: no altera el layout ni los estilos globales. -->
  <div class="admin-page alerta-dashboard-preview mx-auto w-full max-w-[1600px]">
    <header class="dashboard-heading">
      <div class="heading-copy">
        <div class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"></span><span>ALERTA / ADMINISTRACIÓN</span></div>
        <h1>Centro de control<span class="heading-period">.</span></h1>
        <p>Una vista clara de las instituciones, los usuarios y las alertas registradas en el sistema.</p>
      </div>
      <button type="button" class="refresh-button" :disabled="loading" @click="load">
        <RefreshCw :size="18" :class="{ 'animate-spin': loading }" aria-hidden="true" />
        <span>{{ loading ? 'Actualizando...' : 'Actualizar datos' }}</span>
      </button>
    </header>

    <div class="dashboard-context" aria-label="Estado de los datos">
      <span class="context-icon"><LayoutDashboard :size="16" aria-hidden="true" /></span>
      <span>Resumen administrativo</span>
      <span class="context-separator" aria-hidden="true"></span>
      <span class="context-helper">Información consultada del servidor</span>
    </div>

    <div v-if="error" class="dashboard-error" role="alert">
      <AlertTriangle :size="20" aria-hidden="true" />
      <span><strong>No se pudieron consultar las alertas.</strong> {{ error }}</span>
    </div>
    <div v-if="userStore.error || institutionStore.error" class="dashboard-warning" role="status">
      <AlertTriangle :size="19" aria-hidden="true" />
      <span>Algunos indicadores no están disponibles. Puedes volver a intentar con «Actualizar datos».</span>
    </div>

    <section class="metrics-grid" aria-label="Indicadores generales">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="metric-tile"
        :class="`metric-${metric.tone}`"
      >
        <div class="metric-top">
          <span class="metric-label">{{ metric.label }}</span>
          <span class="metric-icon"><component :is="metric.icon" :size="21" aria-hidden="true" /></span>
        </div>
        <div class="metric-value" aria-live="polite">{{ metric.value }}</div>
        <p class="metric-note">{{ metric.note }}</p>
      </article>
    </section>

    <DashboardAlertsMap ref="dashboardMap" scope="admin" class="mb-6" />

    <div class="dashboard-content-grid">
      <section class="content-card" aria-labelledby="recent-alerts-title">
        <div class="card-heading">
          <div>
            <div class="section-kicker"><Clock3 :size="14" aria-hidden="true" /> MONITOREO</div>
            <h2 id="recent-alerts-title">Últimas alertas</h2>
            <p>Actividad reciente registrada en el servidor.</p>
          </div>
          <RouterLink to="/super-admin/alertas" class="text-action">
            Ver todas <ArrowUpRight :size="16" aria-hidden="true" />
          </RouterLink>
        </div>

        <div v-if="loading" class="card-empty" role="status">
          <RefreshCw :size="20" class="animate-spin" aria-hidden="true" />
          <span>Consultando alertas...</span>
        </div>
        <div v-else-if="!recent.length" class="card-empty" role="status">
          <ShieldCheck :size="22" aria-hidden="true" />
          <span>{{ error ? 'No se pudo cargar el historial de alertas.' : 'Todavía no hay alertas registradas.' }}</span>
        </div>
        <ul v-else class="recent-alert-list">
          <li v-for="alert in recent" :key="String(alert.id_alerta)" class="recent-alert-row">
            <span class="alert-emblem" aria-hidden="true"><Flame :size="18" /></span>
            <div class="recent-alert-info">
              <span class="recent-alert-name">Alerta #{{ alert.id_alerta }}</span>
              <span class="recent-alert-date">{{ alert.fecha }} · {{ alert.hora }}</span>
            </div>
            <span class="status-label" :class="statusTone(alert.estado)">
              <span class="status-dot" aria-hidden="true"></span>
              {{ readableStatus(alert.estado) }}
            </span>
          </li>
        </ul>
      </section>

      <section class="content-card" aria-labelledby="quick-access-title">
        <div class="card-heading">
          <div>
            <div class="section-kicker"><LayoutDashboard :size="14" aria-hidden="true" /> ACCESOS</div>
            <h2 id="quick-access-title">Gestión del sistema</h2>
            <p>Accede a los módulos principales.</p>
          </div>
        </div>
        <nav class="shortcuts" aria-label="Accesos rápidos del administrador">
          <RouterLink v-for="entry in shortcuts" :key="entry.path" :to="entry.path" class="shortcut-link">
            <span class="shortcut-icon"><component :is="entry.icon" :size="20" aria-hidden="true" /></span>
            <span class="shortcut-body">
              <strong>{{ entry.name }}</strong>
              <span>{{ entry.description }}</span>
            </span>
            <ChevronRight :size="18" class="shortcut-chevron" aria-hidden="true" />
          </RouterLink>
        </nav>
      </section>
    </div>

  </div>
</template>

<style scoped>
/* Solo se aplica a esta pantalla; evita cambios globales o en otros roles. */
.alerta-dashboard-preview {
  --ds-ember: #c83e12;
  --ds-ember-bg: #fff1eb;
  --ds-ink: #262626;
  --ds-muted: #60666e;
  --ds-border: #e5e7eb;
  --ds-surface: #fff;
  --ds-vellum: #f9f9f9;
  font-family: Inter, Manrope, 'Segoe UI', sans-serif;
  color: var(--ds-ink);
  padding-bottom: 2rem;
}

.dashboard-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 8px 0 24px;
}
.heading-copy { min-width: 0; }
.eyebrow, .section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #805041;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .12em;
}
.eyebrow-mark { width: 7px; height: 7px; border-radius: 100%; background: #ff4d00; flex: none; }
h1 {
  margin: 12px 0 9px;
  font-size: clamp(30px, 3.4vw, 43px);
  line-height: 1.12;
  font-weight: 700;
  letter-spacing: -.04em;
}
.heading-period { color: #ef4c19; }
.heading-copy > p { margin: 0; max-width: 690px; font-size: 15px; line-height: 1.7; color: var(--ds-muted); }
.refresh-button {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid #d3d7dc;
  border-radius: 999px;
  background: #fff;
  color: var(--ds-ink);
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  transition: border-color .15s, background-color .15s;
}
.refresh-button:hover:not(:disabled) { border-color: #ef835f; background: #fff8f5; }
.refresh-button:disabled { opacity: .55; cursor: not-allowed; }

.dashboard-context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 10px 15px;
  border: 1px solid var(--ds-border);
  border-radius: 10px;
  background: linear-gradient(90deg, #fff 50%, #fdfcfb);
  color: #404850;
  font-size: 13px;
  font-weight: 650;
}
.context-icon { color: var(--ds-ember); display: inline-flex; }
.context-separator { width: 1px; height: 15px; background: #d9d9d9; }
.context-helper { color: var(--ds-muted); font-weight: 400; }
.dashboard-error, .dashboard-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fff1f2;
  color: #991b1b;
  font-size: 14px;
  line-height: 1.5;
}
.dashboard-warning { border-color: #f7d690; background: #fffbeb; color: #92400e; }
.dashboard-error svg, .dashboard-warning svg { flex: none; }
.metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 20px; }
.metric-tile {
  min-width: 0;
  min-height: 166px;
  padding: 21px 22px;
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  background: var(--ds-surface);
  box-shadow: 0 9px 25px -24px rgba(28, 33, 39, .16);
}
.metric-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.metric-label { color: #4b5057; font-size: 13px; font-weight: 650; line-height: 1.5; }
.metric-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid #eceef0;
  border-radius: 13px;
  background: #f9fafb;
  color: #5a6066;
}
.metric-ember .metric-icon { background: #fff4ed; border-color: #ffe7d8; color: #c2410c; }
.metric-danger .metric-icon { background: #fff1f2; border-color: #ffe0e4; color: #b91c1c; }
.metric-value { margin-top: 10px; font-size: 35px; font-weight: 750; letter-spacing: -.035em; line-height: 1; font-variant-numeric: tabular-nums; }
.metric-note { margin: 12px 0 0; font-size: 12px; color: #717780; line-height: 1.45; }

.dashboard-content-grid { display: grid; grid-template-columns: minmax(0, 1.14fr) minmax(0, .86fr); gap: 18px; margin-top: 20px; }
.content-card {
  min-width: 0;
  padding: 22px;
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 35px -35px rgba(0, 0, 0, .15);
}
.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.card-heading h2 { margin: 9px 0 5px; font-size: 20px; font-weight: 700; letter-spacing: -.025em; line-height: 1.25; }
.card-heading p { margin: 0; font-size: 13px; line-height: 1.5; color: var(--ds-muted); }
.section-kicker { gap: 7px; color: #96513d; font-size: 11px; letter-spacing: .1em; }
.text-action {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 44px;
  padding: 8px 10px;
  border-radius: 999px;
  color: #af320e;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}
.text-action:hover { background: #fff4ed; }
.card-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 108px;
  margin-top: 17px;
  padding: 18px;
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
  background: #fbfbfb;
  color: #636970;
  font-size: 14px;
}
.card-empty svg { flex: none; color: var(--ds-ember); }
.recent-alert-list { padding: 0; margin: 18px 0 0; list-style: none; }
.recent-alert-row { display: flex; align-items: center; gap: 12px; min-height: 72px; padding: 10px 0; border-bottom: 1px solid #f0f1f3; }
.recent-alert-row:last-child { border-bottom: 0; }
.alert-emblem {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #ffe6d9;
  border-radius: 12px;
  background: #fff5ee;
  color: #c2410c;
}
.recent-alert-info { display: flex; flex: 1; flex-direction: column; gap: 3px; min-width: 0; }
.recent-alert-name { color: var(--ds-ink); font-size: 14px; font-weight: 700; overflow-wrap: anywhere; }
.recent-alert-date { color: #747a81; font-size: 12px; overflow-wrap: anywhere; }
.status-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  gap: 7px;
  max-width: 45%;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  text-align: center;
  font-size: 11px;
  font-weight: 750;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.status-dot { width: 7px; height: 7px; background: currentColor; border-radius: 50%; flex: none; }
.status-closed { color: #166534; background: #f0fdf4; border-color: #dcfce7; }
.status-muted { color: #5e6369; background: #f4f5f6; border-color: #e5e7eb; }
.status-danger { color: #b91c1c; background: #fef2f2; border-color: #fee2e2; }
.status-progress { color: #075985; background: #f0f9ff; border-color: #e0f2fe; }
.status-pending { color: #92400e; background: #fffbeb; border-color: #fef3c7; }
.shortcuts { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
.shortcut-link {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 74px;
  padding: 12px;
  border: 1px solid #eceef0;
  border-radius: 12px;
  background: #fdfdfd;
  color: var(--ds-ink);
  text-decoration: none;
  transition: border-color .15s, background-color .15s;
}
.shortcut-link:hover { border-color: #facab9; background: #fff8f5; }
.shortcut-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #fff0e9;
  color: #bf3a0b;
}
.shortcut-body { display: flex; flex: 1; flex-direction: column; gap: 3px; min-width: 0; }
.shortcut-body strong { font-size: 14px; font-weight: 700; }
.shortcut-body span { font-size: 12px; color: var(--ds-muted); }
.shortcut-chevron { color: #9299a1; flex: none; }
.map-card { margin-top: 20px; }
.map-heading { margin-bottom: 18px; }
.map-source {
  padding: 7px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  color: #5d636b;
  background: #f9fafb;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
}
.map-container-frame { overflow: hidden; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9f9f9; }
@media (max-width: 1100px) {
  .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dashboard-content-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .dashboard-heading { flex-direction: column; align-items: stretch; gap: 16px; }
  .heading-copy > p { font-size: 14px; }
  .refresh-button { width: 100%; }
  .metrics-grid { grid-template-columns: 1fr; gap: 12px; }
  .metric-tile { min-height: 137px; }
  .metric-value { font-size: 32px; }
  .content-card { padding: 16px; }
  .recent-alert-row { flex-wrap: wrap; }
  .status-label { max-width: 100%; margin-left: 51px; }
  .card-heading { flex-wrap: wrap; }
  .map-source { margin-top: 4px; }
}
@media (prefers-reduced-motion: reduce) {
  .alerta-dashboard-preview * { transition: none !important; animation-duration: .01ms !important; }
}
</style>
