<script setup lang="ts">
import {
  computed,
  onMounted,
} from 'vue'

import {
  useRouter,
} from 'vue-router'

import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
} from '@ionic/vue'

import {
  alertCircleOutline,
  businessOutline,
  chevronForwardOutline,
  logOutOutline,
  notificationsOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons'

import {
  useAlertStore,
} from '../stores/alert.store'

import {
  useAuthStore,
} from '../stores/auth.store'

const router = useRouter()

const authStore =
  useAuthStore()

const alertStore =
  useAlertStore()

onMounted(async () => {
  await alertStore.fetchAlerts()
})

const institutionId =
  computed(() =>
    authStore.user?.institutionId
      ? String(
          authStore.user
            .institutionId,
        )
      : null,
  )

const filteredAlerts =
  computed(() => {
    if (!institutionId.value) {
      return []
    }

    return alertStore.alerts.filter(
      (alert: any) => {
        const ids =
          Array.isArray(
            alert.institutionIds,
          )
            ? alert.institutionIds.map(
                String,
              )
            : alert.institutionId
              ? [
                  String(
                    alert.institutionId,
                  ),
                ]
              : []

        return ids.includes(
          institutionId.value!,
        )
      },
    )
  })

const activeAlerts =
  computed(() =>
    filteredAlerts.value.filter(
      (alert) =>
        ![
          'CERRADA',
          'FINALIZADA',
          'CANCELADA',
          'FALSA_ALARMA',
        ].includes(
          alert.status,
        ),
    ),
  )

const priorityAlerts =
  computed(() =>
    activeAlerts.value.filter(
      (alert) =>
        alert.riskLevel ===
          'critical' ||
        alert.riskLevel ===
          'high',
    ),
  )

const userName =
  computed(() =>
    authStore.user?.name ||
    'Operador',
  )

function openAlert(
  id: string,
) {
  router.push(
    `/institucion/emergencias/${id}`,
  )
}

function openNotifications() {
  router.push(
    '/institucion/notificaciones',
  )
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
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

function riskLabel(
  risk: string,
) {
  switch (risk) {
    case 'critical':
      return 'Crítico'

    case 'high':
      return 'Alto'

    case 'warning':
      return 'Advertencia'

    default:
      return 'Normal'
  }
}

function statusLabel(
  status: string,
) {
  return status.split('_').join(' ')
}

async function logout() {
  await authStore.logout()

  await router.replace(
    '/login',
  )
}
</script>

<template>
  <IonPage>
    <IonContent
      :fullscreen="true"
      class="institution-content"
    >
      <main class="mobile-shell">
        <!-- Cabecera -->
        <header class="top-header">
          <div class="brand">
            <img
              src="/logo-alerta-ave.svg"
              alt="ALERTA"
              class="brand-logo"
            />

            <div>
              <p class="brand-name">
                ALERTA
              </p>

              <p class="brand-subtitle">
                Prevención de Incendios
              </p>
            </div>
          </div>

          <button
            class="notification-button"
            type="button"
            aria-label="Notificaciones"
            @click="
              openNotifications
            "
          >
            <IonIcon
              :icon="
                notificationsOutline
              "
            />
          </button>
        </header>

        <!-- Bienvenida -->
        <section class="welcome">
          <div>
            <p class="eyebrow">
              PERSONAL OPERATIVO
            </p>

            <h1>
              Hola, {{ userName }}
            </h1>

            <p>
              Consulta y atiende las
              emergencias asignadas a
              tu institución.
            </p>
          </div>

          <div class="online-badge">
            <span></span>
            En línea
          </div>
        </section>

        <!-- Métricas -->
        <section class="metrics">
          <article
            class="metric-card"
          >
            <div
              class="metric-icon orange"
            >
              <IonIcon
                :icon="
                  alertCircleOutline
                "
              />
            </div>

            <div>
              <strong>
                {{
                  filteredAlerts.length
                }}
              </strong>

              <span>
                Alertas recibidas
              </span>
            </div>
          </article>

          <article
            class="metric-card"
          >
            <div
              class="metric-icon green"
            >
              <IonIcon
                :icon="
                  shieldCheckmarkOutline
                "
              />
            </div>

            <div>
              <strong>
                {{
                  activeAlerts.length
                }}
              </strong>

              <span>
                Activas
              </span>
            </div>
          </article>

          <article
            class="metric-card wide"
          >
            <div
              class="metric-icon red"
            >
              <IonIcon
                :icon="
                  businessOutline
                "
              />
            </div>

            <div>
              <strong>
                {{
                  priorityAlerts.length
                }}
              </strong>

              <span>
                Prioridad alta
              </span>
            </div>
          </article>
        </section>

        <!-- Alertas -->
        <section
          class="alerts-section"
        >
          <div
            class="section-heading"
          >
            <div>
              <p class="eyebrow">
                ATENCIÓN
              </p>

              <h2>
                Emergencias asignadas
              </h2>
            </div>

            <span
              class="counter"
            >
              {{
                activeAlerts.length
              }}
            </span>
          </div>

          <!-- Loading -->
          <div
            v-if="
              alertStore.loading
            "
            class="loading-state"
          >
            <IonSpinner
              name="crescent"
            />

            <p>
              Cargando alertas...
            </p>
          </div>

          <!-- Error -->
          <div
            v-else-if="
              alertStore.error
            "
            class="error-state"
          >
            <IonIcon
              :icon="
                alertCircleOutline
              "
            />

            <strong>
              No fue posible obtener
              las alertas
            </strong>

            <p>
              {{
                alertStore.error
              }}
            </p>

            <IonButton
              fill="outline"
              @click="
                alertStore.fetchAlerts()
              "
            >
              Reintentar
            </IonButton>
          </div>

          <!-- Lista -->
          <div
            v-else-if="
              activeAlerts.length
            "
            class="alerts-list"
          >
            <button
              v-for="alert in activeAlerts"
              :key="alert.id"
              type="button"
              class="alert-card"
              @click="
                openAlert(alert.id)
              "
            >
              <div
                class="alert-card-top"
              >
                <span
                  class="alert-id"
                >
                  Alerta #{{ alert.id }}
                </span>

                <span
                  :class="[
                    'risk-badge',
                    `risk-${alert.riskLevel}`,
                  ]"
                >
                  {{
                    riskLabel(
                      alert.riskLevel,
                    )
                  }}
                </span>
              </div>

              <h3>
                {{
                  alert.location
                    ?.city ||
                  'Ubicación no disponible'
                }}
              </h3>

              <p
                class="description"
              >
                {{
                  alert.description
                }}
              </p>

              <div
                class="alert-footer"
              >
                <div>
                  <span
                    class="status"
                  >
                    {{
                      statusLabel(
                        alert.status,
                      )
                    }}
                  </span>

                  <small>
                    {{
                      formatDate(
                        alert.createdAt,
                      )
                    }}
                  </small>
                </div>

                <IonIcon
                  :icon="
                    chevronForwardOutline
                  "
                  class="chevron"
                />
              </div>
            </button>
          </div>

          <!-- Vacío -->
          <div
            v-else
            class="empty-state"
          >
            <div
              class="empty-icon"
            >
              <IonIcon
                :icon="
                  shieldCheckmarkOutline
                "
              />
            </div>

            <h3>
              Sin emergencias pendientes
            </h3>

            <p>
              Actualmente no hay
              alertas asignadas a tu
              institución.
            </p>

            <small>
              Las nuevas emergencias
              aparecerán aquí
              automáticamente.
            </small>
          </div>
        </section>

        <!-- Sesión -->
        <section class="session-section">
          <button
            type="button"
            class="logout-button"
            @click="logout"
          >
            <IonIcon
              :icon="
                logOutOutline
              "
            />

            Cerrar sesión
          </button>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.institution-content {
  --background: #f6f8fa;
  --color: #17212b;
}

.mobile-shell {
  width: 100%;
  max-width: 500px;
  min-height: 100%;
  margin: 0 auto;
  padding: 20px 18px 36px;
  background: #f6f8fa;
}

/* Header */

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: 36px;
  height: 44px;
  object-fit: contain;
}

.brand-name {
  margin: 0;
  color: #f24a23;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.24em;
}

.brand-subtitle {
  margin: 3px 0 0;
  color: #17212b;
  font-size: 13px;
  font-weight: 700;
}

.notification-button {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid #dfe5ea;
  border-radius: 13px;
  background: #fff;
  color: #536170;
  font-size: 20px;
}

/* Welcome */

.welcome {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
  margin-top: 35px;
}

.eyebrow {
  margin: 0;
  color: #f24a23;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.2em;
}

.welcome h1 {
  margin: 8px 0 0;
  color: #111827;
  font-size: 27px;
  font-weight: 750;
}

.welcome > div > p:last-child {
  margin: 8px 0 0;
  max-width: 300px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}

.online-badge {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 7px 9px;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  background: #f0fdf4;
  color: #15803d;
  font-size: 10px;
  font-weight: 700;
}

.online-badge span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
}

/* Metrics */

.metrics {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 11px;
  margin-top: 26px;
}

.metric-card {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
}

.metric-card.wide {
  grid-column: 1 / -1;
}

.metric-icon {
  display: grid;
  width: 39px;
  height: 39px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 11px;
  font-size: 20px;
}

.metric-icon.orange {
  background: #fff3ed;
  color: #f24a23;
}

.metric-icon.green {
  background: #ecfdf5;
  color: #059669;
}

.metric-icon.red {
  background: #fef2f2;
  color: #dc2626;
}

.metric-card strong {
  display: block;
  color: #111827;
  font-size: 21px;
}

.metric-card span {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 10px;
}

/* Alerts */

.alerts-section {
  margin-top: 30px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.section-heading h2 {
  margin: 6px 0 0;
  color: #111827;
  font-size: 19px;
}

.counter {
  display: grid;
  min-width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 999px;
  background: #fff0e9;
  color: #e54722;
  font-size: 12px;
  font-weight: 800;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 15px;
}

.alert-card {
  width: 100%;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  text-align: left;
}

.alert-card:active {
  border-color: #fdba74;
  background: #fffaf7;
}

.alert-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alert-id {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.risk-badge {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.risk-critical {
  background: #fef2f2;
  color: #dc2626;
}

.risk-high {
  background: #fff7ed;
  color: #ea580c;
}

.risk-warning {
  background: #fffbeb;
  color: #b45309;
}

.risk-normal {
  background: #ecfdf5;
  color: #047857;
}

.alert-card h3 {
  margin: 12px 0 0;
  color: #111827;
  font-size: 16px;
}

.description {
  margin: 6px 0 0;
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.alert-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 14px;
}

.alert-footer > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status {
  color: #f24a23;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.alert-footer small {
  color: #94a3b8;
  font-size: 10px;
}

.chevron {
  color: #94a3b8;
  font-size: 20px;
}

/* Empty */

.empty-state,
.loading-state,
.error-state {
  margin-top: 15px;
  padding: 38px 22px;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  background: #fff;
  text-align: center;
}

.empty-icon {
  display: grid;
  width: 52px;
  height: 52px;
  margin: 0 auto;
  place-items: center;
  border-radius: 16px;
  background: #ecfdf5;
  color: #059669;
  font-size: 27px;
}

.empty-state h3,
.error-state strong {
  display: block;
  margin-top: 15px;
  color: #334155;
  font-size: 14px;
}

.empty-state p,
.loading-state p,
.error-state p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.empty-state small {
  display: block;
  margin-top: 10px;
  color: #94a3b8;
  font-size: 10px;
}

.error-state {
  border-color: #fecaca;
  background: #fff7f7;
  color: #dc2626;
}

.error-state > ion-icon {
  font-size: 30px;
}

.error-state ion-button {
  margin-top: 16px;
  --color: #f24a23;
  --border-color: #f24a23;
}

/* Logout */

.session-section {
  margin-top: 30px;
}

.logout-button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.logout-button:active {
  background: #f8fafc;
}

@media (max-width: 360px) {
  .welcome {
    flex-direction: column;
  }

  .metrics {
    grid-template-columns: 1fr;
  }

  .metric-card.wide {
    grid-column: auto;
  }
}
</style>