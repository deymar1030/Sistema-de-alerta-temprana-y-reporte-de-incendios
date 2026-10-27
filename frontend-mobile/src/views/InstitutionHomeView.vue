
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
} from 'vue'
import { useRouter } from 'vue-router'
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonPage,
  onIonViewDidEnter,
} from '@ionic/vue'
import {
  alertCircleOutline,
  arrowForwardOutline,
  documentTextOutline,
  flameOutline,
  logOutOutline,
  mapOutline,
  notificationsOutline,
  refreshOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons'
import * as L from 'leaflet'

import CitizenNavigation from '../components/citizen/CitizenNavigation.vue'
import { useAlertStore } from '../stores/alert.store'
import { useAuthStore } from '../stores/auth.store'
import { useCitizenReportStore } from '../stores/citizen-report.store'
import { useNotificationStore } from '../stores/notification.store'
import type { MobileAlert } from '../services/alert.service'

const router = useRouter()
const authStore = useAuthStore()
const alertStore = useAlertStore()
const reportStore = useCitizenReportStore()
const notificationStore = useNotificationStore()

const refreshing = ref(false)
const signingOut = ref(false)
const logoutError = ref('')

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<L.Map | null>(null)
const markerGroup = shallowRef<L.LayerGroup | null>(null)

const greetingName = computed(
  () =>
    authStore.user?.firstName ||
    authStore.user?.name ||
    'Ciudadano'
)

const openStatuses = new Set([
  'ACTIVA',
  'EN_REVISION',
  'EN_EVALUACION',
  'CONFIRMADA',
])

const activeAlerts = computed(() =>
  alertStore.alerts.filter((alert) =>
    openStatuses.has(
      String(alert.status).toUpperCase()
    )
  )
)

const alertsWithCoordinates = computed(() =>
  activeAlerts.value.filter((alert) => {
    const item = alert as MobileAlert
    const coords = item.location.coordinates

    return (
      item.hasCoordinates === true &&
      Number.isFinite(coords.latitude) &&
      Number.isFinite(coords.longitude) &&
      Math.abs(coords.latitude) <= 90 &&
      Math.abs(coords.longitude) <= 180
    )
  })
)

const myReports = computed(() =>
  reportStore.reports.filter(
    (report) =>
      report.citizenId != null &&
      report.citizenId === authStore.user?.id
  )
)

const recentReports = computed(() =>
  [...myReports.value]
    .sort(
      (a, b) =>
        Date.parse(b.createdAt || '') -
        Date.parse(a.createdAt || '')
    )
    .slice(0, 2)
)

const recentNotifications = computed(() =>
  [...notificationStore.notifications]
    .sort(
      (a, b) =>
        Date.parse(b.createdAt || '') -
        Date.parse(a.createdAt || '')
    )
    .slice(0, 2)
)

const unreadCount = computed(
  () =>
    notificationStore.notifications.filter(
      (item) => !item.read
    ).length
)

function formatDate(value: string): string {
  if (!value) return 'Fecha no disponible'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat('es-BO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function riskLabel(value: string): string {
  const labels: Record<string, string> = {
    critical: 'Riesgo crítico',
    high: 'Riesgo alto',
    warning: 'Precaución',
    normal: 'Riesgo normal',
    unknown: 'Sin evaluar',
  }

  return labels[value] || 'Sin evaluar'
}

function hideMap() {
  markerGroup.value?.clearLayers()
  markerGroup.value = null

  if (map.value) {
    map.value.remove()
    map.value = null
  }
}

async function updateMap() {
  if (
    alertStore.error ||
    !alertsWithCoordinates.value.length
  ) {
    hideMap()
    return
  }

  await nextTick()

  if (!mapContainer.value) return

  if (
    map.value &&
    map.value.getContainer() !== mapContainer.value
  ) {
    hideMap()
  }

  if (!map.value) {
    map.value = L.map(mapContainer.value, {
      scrollWheelZoom: false,
      zoomControl: true,
    })

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; Colaboradores de OpenStreetMap',
        maxZoom: 18,
      }
    ).addTo(map.value)
  }

  markerGroup.value?.clearLayers()
  markerGroup.value = L.layerGroup().addTo(map.value)

  const bounds: L.LatLngExpression[] = []

  for (const alert of alertsWithCoordinates.value) {
    const { latitude, longitude } =
      alert.location.coordinates

    const point: L.LatLngExpression = [
      latitude,
      longitude,
    ]

    bounds.push(point)

    const marker = L.circleMarker(point, {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: '#ea5426',
      fillOpacity: 1,
    }).addTo(markerGroup.value)

    const popup = document.createElement('div')
    const title = document.createElement('strong')
    const description = document.createElement('p')

    title.textContent = riskLabel(alert.riskLevel)
    description.textContent =
      alert.description || 'Alerta registrada'

    popup.append(title, description)
    marker.bindPopup(popup)
  }

  map.value.fitBounds(L.latLngBounds(bounds), {
    padding: [24, 24],
    maxZoom: 14,
  })

  requestAnimationFrame(() =>
    map.value?.invalidateSize()
  )
}

async function refreshData() {
  if (refreshing.value) return

  refreshing.value = true

  try {
    await Promise.allSettled([
      alertStore.fetchAlerts(),
      reportStore.fetchReports(),
      notificationStore.fetchNotifications(),
    ])

    await updateMap()
  } finally {
    refreshing.value = false
  }
}

async function signOut() {
  if (signingOut.value) return

  if (
    !window.confirm(
      '¿Cerrar sesión de ALERTA?'
    )
  ) {
    return
  }

  signingOut.value = true
  logoutError.value = ''

  try {
    await authStore.logout()
    await router.replace('/login')
  } catch {
    logoutError.value =
      'No fue posible confirmar el cierre de sesión con el servidor.'
  } finally {
    signingOut.value = false
  }
}

onIonViewDidEnter(() => {
  void refreshData()
})

onBeforeUnmount(hideMap)
</script>

<template>
  <IonPage class="citizen-home-page">
    <IonContent
      :fullscreen="true"
      class="citizen-home-content"
    >
      <div class="home-shell">
        <header class="welcome-header">
          <div class="welcome-copy">
            <p class="eyebrow">
              ALERTA · PROTECCIÓN CIUDADANA
            </p>

            <p class="greeting-prefix">
              Hola,
            </p>

            <h1>{{ greetingName }}</h1>

            <p class="greeting-subtitle">
              Información y reportes de prevención de incendios.
            </p>
          </div>

          <div class="header-actions">
            <button
              type="button"
              class="header-icon-button"
              aria-label="Abrir notificaciones"
              @click="router.push('/ciudadano/notificaciones')"
            >
              <IonIcon
                :icon="notificationsOutline"
                aria-hidden="true"
              />

              <span
                v-if="unreadCount"
                class="unread-dot"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              class="header-icon-button header-exit"
              aria-label="Cerrar sesión"
              :disabled="signingOut"
              @click="signOut"
            >
              <IonIcon
                :icon="logOutOutline"
                aria-hidden="true"
              />
            </button>
          </div>
        </header>

        <p
          v-if="logoutError"
          class="inline-alert"
          role="alert"
        >
          {{ logoutError }}
        </p>

        <button
          type="button"
          class="primary-cta"
          @click="router.push('/ciudadano/reportar')"
        >
          <span class="cta-icon">
            <IonIcon
              :icon="flameOutline"
              aria-hidden="true"
            />
          </span>

          <span>
            Reportar un posible incendio
          </span>

          <IonIcon
            :icon="arrowForwardOutline"
            aria-hidden="true"
            class="cta-arrow"
          />
        </button>

        <p class="under-cta">
          Ante una emergencia, ponte a salvo y contacta a los servicios de emergencia.
        </p>

        <section
          class="stat-grid"
          aria-label="Resumen de actividad"
        >
          <article class="stat-card">
            <span class="stat-label">
              <IonIcon
                :icon="alertCircleOutline"
                aria-hidden="true"
              />
              Alertas activas
            </span>

            <strong class="stat-value">
              {{
                alertStore.loading
                  ? '...'
                  : alertStore.error
                    ? '—'
                    : activeAlerts.length
              }}
            </strong>

            <small>
              {{
                alertStore.error
                  ? 'No disponibles'
                  : 'En el sistema'
              }}
            </small>
          </article>

          <article class="stat-card">
            <span class="stat-label">
              <IonIcon
                :icon="documentTextOutline"
                aria-hidden="true"
              />
              Mis reportes
            </span>

            <strong class="stat-value">
              {{
                reportStore.loading
                  ? '...'
                  : reportStore.error
                    ? '—'
                    : myReports.length
              }}
            </strong>

            <small>
              {{
                reportStore.error
                  ? 'No disponibles'
                  : 'Identificados como tuyos'
              }}
            </small>
          </article>
        </section>

        <section
          class="content-card"
          aria-labelledby="alerts-heading"
        >
          <div class="section-heading">
            <div>
              <p class="section-kicker">
                MONITOREO
              </p>

              <h2 id="alerts-heading">
                Alertas activas
              </h2>
            </div>

            <button
              type="button"
              class="text-action"
              :disabled="refreshing"
              @click="refreshData"
            >
              <IonIcon
                :icon="refreshOutline"
                aria-hidden="true"
              />
              {{
                refreshing
                  ? 'Actualizando'
                  : 'Actualizar'
              }}
            </button>
          </div>

          <div
            v-if="alertStore.loading"
            class="state-message"
            role="status"
          >
            Consultando alertas...
          </div>

          <div
            v-else-if="alertStore.error"
            class="error-message"
            role="alert"
          >
            No pudimos consultar las alertas. Vuelve a intentarlo.
          </div>

          <div
            v-else-if="!activeAlerts.length"
            class="empty-message"
          >
            <IonIcon
              :icon="shieldCheckmarkOutline"
              aria-hidden="true"
            />

            <div>
              <strong>
                Sin alertas activas registradas
              </strong>

              <p>
                La consulta no devolvió alertas en curso.
              </p>
            </div>
          </div>

          <ul
            v-else
            class="brief-list"
          >
            <li
              v-for="alert in activeAlerts.slice(0, 3)"
              :key="alert.id"
            >
              <span class="mini-alert-icon">
                <IonIcon
                  :icon="alertCircleOutline"
                  aria-hidden="true"
                />
              </span>

              <div class="list-copy">
                <strong>
                  {{ riskLabel(alert.riskLevel) }}
                </strong>

                <span>
                  {{
                    alert.description ||
                    'Alerta registrada'
                  }}
                </span>
              </div>

              <span class="list-date">
                {{ formatDate(alert.createdAt) }}
              </span>
            </li>
          </ul>
        </section>

        <section
          class="content-card"
          aria-labelledby="reports-heading"
        >
          <div class="section-heading">
            <div>
              <p class="section-kicker">
                ACTIVIDAD
              </p>

              <h2 id="reports-heading">
                Mis últimos reportes
              </h2>
            </div>

            <RouterLink
              class="text-action"
              to="/ciudadano/reportes"
            >
              Ver todos

              <IonIcon
                :icon="arrowForwardOutline"
                aria-hidden="true"
              />
            </RouterLink>
          </div>

          <div
            v-if="reportStore.loading"
            class="state-message"
            role="status"
          >
            Consultando reportes...
          </div>

          <div
            v-else-if="reportStore.error"
            class="error-message"
            role="alert"
          >
            No pudimos cargar tus reportes. La consulta del servidor falló; puedes intentar actualizar.
          </div>

          <div
            v-else-if="!recentReports.length"
            class="empty-message"
          >
            <IonIcon
              :icon="documentTextOutline"
              aria-hidden="true"
            />

            <div>
              <strong>
                Sin reportes disponibles
              </strong>

              <p>
                No hay reportes identificados con tu cuenta.
              </p>
            </div>
          </div>

          <ul
            v-else
            class="brief-list"
          >
            <li
              v-for="report in recentReports"
              :key="report.id"
            >
              <span class="mini-report-icon">
                <IonIcon
                  :icon="documentTextOutline"
                  aria-hidden="true"
                />
              </span>

              <div class="list-copy">
                <strong>
                  {{ report.incidentType }}
                </strong>

                <span>
                  {{ report.description }}
                </span>
              </div>

              <span class="list-date">
                {{ formatDate(report.createdAt) }}
              </span>
            </li>
          </ul>
        </section>

        <section
          class="content-card"
          aria-labelledby="notifications-heading"
        >
          <div class="section-heading">
            <div>
              <p class="section-kicker">
                MENSAJES
              </p>

              <h2 id="notifications-heading">
                Notificaciones
              </h2>
            </div>

            <RouterLink
              class="text-action"
              to="/ciudadano/notificaciones"
            >
              Ver todas

              <IonIcon
                :icon="arrowForwardOutline"
                aria-hidden="true"
              />
            </RouterLink>
          </div>

          <div
            v-if="notificationStore.loading"
            class="state-message"
            role="status"
          >
            Cargando notificaciones...
          </div>

          <div
            v-else-if="notificationStore.error"
            class="error-message"
            role="alert"
          >
            No pudimos consultar las notificaciones.
          </div>

          <div
            v-else-if="!recentNotifications.length"
            class="empty-message"
          >
            <IonIcon
              :icon="notificationsOutline"
              aria-hidden="true"
            />

            <div>
              <strong>
                Todo al día
              </strong>

              <p>
                Por ahora no tienes notificaciones.
              </p>
            </div>
          </div>

          <ul
            v-else
            class="brief-list"
          >
            <li
              v-for="notification in recentNotifications"
              :key="notification.id"
            >
              <span class="mini-report-icon">
                <IonIcon
                  :icon="notificationsOutline"
                  aria-hidden="true"
                />
              </span>

              <div class="list-copy">
                <strong>
                  {{ notification.title }}
                </strong>

                <span>
                  {{ notification.message }}
                </span>
              </div>

              <span class="list-date">
                {{ formatDate(notification.createdAt) }}
              </span>
            </li>
          </ul>
        </section>

        <section
          class="content-card map-section"
          aria-labelledby="map-heading"
        >
          <div class="section-heading">
            <div>
              <p class="section-kicker">
                UBICACIONES
              </p>

              <h2 id="map-heading">
                Mapa de alertas
              </h2>
            </div>
          </div>

          <div
            v-if="alertStore.error"
            class="state-message"
          >
            No se pudo consultar la ubicación de las alertas.
          </div>

          <div
            v-else-if="!alertsWithCoordinates.length"
            class="map-empty"
          >
            <IonIcon
              :icon="mapOutline"
              aria-hidden="true"
            />

            <p>
              El mapa aparecerá cuando existan alertas con coordenadas disponibles.
            </p>
          </div>

          <div
            v-else
            ref="mapContainer"
            class="map-container"
            aria-label="Mapa con ubicaciones registradas de alertas"
          />

          <p class="map-footnote">
            Solo se muestran ubicaciones recibidas del servidor.
          </p>
        </section>

        <aside
          class="safety-tip"
          aria-label="Consejo de seguridad"
        >
          <IonIcon
            :icon="shieldCheckmarkOutline"
            aria-hidden="true"
          />

          <div>
            <strong>
              Consejo de seguridad
            </strong>

            <p>
              Aléjate del humo y evita ingresar a zonas de riesgo. Sigue las indicaciones del personal de emergencia.
            </p>
          </div>
        </aside>
      </div>
    </IonContent>

    <IonFooter class="citizen-home-footer">
      <CitizenNavigation />
    </IonFooter>
  </IonPage>
</template>

<style scoped>
.citizen-home-page {
  background: #f6f4f0;
}

.citizen-home-content {
  --background: #f6f4f0;
  --color: #172438;
  color: #172438;
}

.home-shell {
  width: min(100%, 700px);
  margin-inline: auto;
  padding: 25px 18px 30px;
  display: grid;
  gap: 16px;
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 3px;
}

.welcome-copy {
  min-width: 0;
}

.eyebrow,
.section-kicker {
  margin: 0 0 9px;
  color: #cc451d;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.greeting-prefix {
  margin: 0;
  color: #607187;
  font-size: 14px;
}

h1 {
  font-size: clamp(27px, 6.8vw, 34px);
  letter-spacing: -0.035em;
  line-height: 1.15;
  margin: 2px 0 8px;
  overflow-wrap: anywhere;
}

.greeting-subtitle {
  margin: 0;
  color: #536478;
  font-size: 14px;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  gap: 7px;
  align-items: center;
  flex-shrink: 0;
}

.header-icon-button {
  position: relative;
  min-height: 46px;
  min-width: 46px;
  border: 1px solid #e8e9ed;
  background: #fff;
  border-radius: 14px;
  color: #b9421b;
  display: inline-grid;
  place-items: center;
  font-size: 21px;
  cursor: pointer;
}

.header-exit {
  color: #65748a;
}

.unread-dot {
  width: 9px;
  height: 9px;
  border-radius: 100%;
  position: absolute;
  top: 8px;
  right: 8px;
  background: #dd3d2c;
  border: 2px solid #fff;
}

.primary-cta {
  border: 0;
  width: 100%;
  min-height: 64px;
  display: flex;
  gap: 13px;
  align-items: center;
  padding: 12px 16px;
  background: #f04c1a;
  border-radius: 16px;
  box-shadow: 0 5px 12px rgba(227, 78, 26, 0.15);
  color: #fff;
  text-align: left;
  font-size: 16px;
  font-weight: 750;
  cursor: pointer;
}

.cta-icon {
  display: grid;
  place-items: center;
  width: 37px;
  height: 37px;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 22px;
}

.cta-arrow {
  margin-left: auto;
  font-size: 21px;
  flex-shrink: 0;
}

.under-cta {
  margin: -6px 2px 2px;
  font-size: 12px;
  line-height: 1.45;
  color: #617085;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stat-card,
.content-card {
  background: #fff;
  border: 1px solid #e3e6eb;
  border-radius: 18px;
  box-shadow: 0 2px 5px rgba(23, 35, 56, 0.035);
}

.stat-card {
  padding: 15px 13px;
  display: grid;
  gap: 5px;
  min-width: 0;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #526376;
  font-size: 12px;
  line-height: 1.3;
}

.stat-label ion-icon {
  font-size: 17px;
  color: #e35224;
}

.stat-value {
  display: block;
  color: #172438;
  font-size: 29px;
  line-height: 1.1;
}

.stat-card small {
  color: #758296;
  font-size: 11px;
}

.content-card {
  padding: 18px 16px;
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.section-heading > div {
  min-width: 0;
}

.section-kicker {
  margin-bottom: 5px;
  font-size: 10px;
}

h2 {
  font-size: 19px;
  line-height: 1.25;
  margin: 0;
  letter-spacing: -0.018em;
}

.text-action {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 0;
  padding: 8px 4px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 750;
  color: #d74b1d;
  background: transparent;
  border: 0;
  text-decoration: none;
  cursor: pointer;
}

.text-action ion-icon {
  font-size: 15px;
}

.text-action:disabled {
  opacity: 0.55;
  cursor: wait;
}

.state-message {
  border-radius: 12px;
  background: #f6f8fa;
  padding: 16px;
  color: #586b80;
  font-size: 14px;
}

.error-message,
.inline-alert {
  border-radius: 12px;
  background: #fff0ed;
  border: 1px solid #ffd2cb;
  padding: 14px;
  color: #9c321b;
  font-size: 14px;
  line-height: 1.5;
}

.empty-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: #f6f8fa;
}

.empty-message > ion-icon {
  color: #178360;
  font-size: 25px;
  flex-shrink: 0;
}

.empty-message strong {
  display: block;
  font-size: 14px;
  color: #26384b;
  line-height: 1.4;
}

.empty-message p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #607187;
  line-height: 1.4;
}

.brief-list {
  padding: 0;
  margin: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.brief-list li {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  border-top: 1px solid #eef0f2;
  padding-top: 10px;
}

.brief-list li:first-child {
  border-top: 0;
  padding-top: 0;
}

.mini-alert-icon,
.mini-report-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: #fff0e8;
  color: #ce502b;
  font-size: 19px;
}

.mini-report-icon {
  background: #f1f5fb;
  color: #476181;
}

.list-copy {
  display: grid;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.list-copy strong {
  font-size: 14px;
  color: #243248;
}

.list-copy span {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 12px;
  color: #65748a;
  overflow-wrap: anywhere;
}

.list-date {
  font-size: 11px;
  flex-shrink: 0;
  color: #7c8797;
}

.map-empty {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 8px;
  text-align: center;
  min-height: 125px;
  padding: 18px;
  border: 1px dashed #d7dee7;
  border-radius: 12px;
  background: #f8fafc;
  color: #69798c;
}

.map-empty ion-icon {
  font-size: 28px;
}

.map-empty p {
  margin: 0;
  max-width: 280px;
  font-size: 13px;
  line-height: 1.5;
}

.map-container {
  width: 100%;
  height: clamp(200px, 50vw, 270px);
  overflow: hidden;
  border-radius: 12px;
}

.map-footnote {
  margin: 10px 0 0;
  color: #708096;
  font-size: 11px;
}

.safety-tip {
  display: flex;
  gap: 12px;
  border: 1px solid #fee1c9;
  border-radius: 16px;
  padding: 17px;
  background: #fff6eb;
  color: #5f3e2b;
}

.safety-tip > ion-icon {
  color: #cb5a20;
  flex-shrink: 0;
  font-size: 22px;
}

.safety-tip strong {
  font-size: 14px;
}

.safety-tip p {
  margin: 5px 0 0;
  color: #765442;
  font-size: 13px;
  line-height: 1.5;
}

.citizen-home-footer {
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 16px rgba(29, 39, 53, 0.06);
}

button:focus-visible,
a:focus-visible {
  outline: 3px solid #e65d2b;
  outline-offset: 2px;
}

@media (min-width: 600px) {
  .home-shell {
    padding: 30px 26px 36px;
    gap: 18px;
  }

  .content-card {
    padding: 20px 22px;
  }

  .stat-card {
    padding: 20px;
  }
}

@media (max-width: 360px) {
  .home-shell {
    padding-inline: 11px;
  }

  .section-heading {
    align-items: flex-start;
  }

  .text-action {
    font-size: 11px;
  }

  .greeting-subtitle {
    font-size: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
  }
}
</style>
