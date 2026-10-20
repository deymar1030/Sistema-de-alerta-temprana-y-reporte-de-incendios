<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { computed, onMounted } from 'vue'
import { alertCircleOutline, arrowForwardOutline, checkmarkCircleOutline, flameOutline, locationOutline, personOutline, shieldCheckmarkOutline, timeOutline } from 'ionicons/icons'
import IncidentCard from '../../components/common/IncidentCard.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import { useIncidentStore } from '../../stores/incident.store'
import { useInstitutionAlertStore } from '../../stores/institution-alert.store'
import { useAuthStore } from '../../stores/auth.store'

const authStore = useAuthStore()
const incidentStore = useIncidentStore()
const alertStore = useInstitutionAlertStore()

const activeIncident = computed(() => incidentStore.incidents.find((item) => item.status !== 'FINALIZADA'))
const alertsPending = computed(() => alertStore.alerts.filter((item) => item.status !== 'FINALIZADA').length)
const alertsToday = computed(() => alertStore.alerts.filter((item) => item.status === 'FINALIZADA').length)

onMounted(async () => {
  await Promise.all([incidentStore.fetchIncidents(), alertStore.fetchAlerts()])
})
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-title>Inicio</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="container">
        <div class="brand">ALERTA</div>
        <h1>Bomberos La Paz</h1>
        <p class="subtitle"><ion-icon :icon="personOutline" aria-hidden="true" />{{ authStore.user?.name ?? 'Usuario institucional' }}</p>

        <ion-card class="status-card hero-card">
          <ion-card-content>
            <div class="status-row">
              <div class="status-copy"><span class="icon-circle green-circle"><ion-icon :icon="checkmarkCircleOutline" /></span><div><span class="status-label">Estado actual</span><strong class="status-state">Listo para atender</strong></div></div>
            </div>
          </ion-card-content>
        </ion-card>

        <div class="summary-grid">
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="icon-circle yellow-circle"><ion-icon :icon="alertCircleOutline" /></span>
              <p class="summary-label">Alertas pendientes</p>
              <h2>{{ alertsPending }}</h2>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="icon-circle red-circle"><ion-icon :icon="flameOutline" /></span>
              <p class="summary-label">Emergencias activas</p>
              <h2>{{ incidentStore.pendingIncidents().length }}</h2>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="icon-circle green-circle"><ion-icon :icon="shieldCheckmarkOutline" /></span>
              <p class="summary-label">Atendidas hoy</p>
              <h2>{{ alertsToday }}</h2>
            </ion-card-content>
          </ion-card>
        </div>

        <div v-if="activeIncident" class="section-block">
          <div class="section-title">Emergencia activa</div>
          <ion-card class="active-card">
            <ion-card-header>
              <div class="active-header">
                <div>
                  <p class="muted">{{ activeIncident.id }}</p>
                  <h3>{{ activeIncident.title }}</h3>
                </div>
                <span class="risk-pill"><ion-icon :icon="flameOutline" />{{ activeIncident.risk }}</span>
              </div>
            </ion-card-header>
            <ion-card-content>
              <p class="location-row"><ion-icon :icon="locationOutline" /><strong>{{ activeIncident.location }}</strong></p>
              <p class="detail"><ion-icon :icon="timeOutline" />Hora: {{ new Date(activeIncident.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) }}</p>
              <ion-button expand="block" class="primary-button" :router-link="`/institucion/emergencia/${activeIncident.id}`"><ion-icon slot="start" :icon="arrowForwardOutline" />Ver emergencia</ion-button>
            </ion-card-content>
          </ion-card>
        </div>

        <div class="section-block">
          <div class="section-title">Intervenciones recientes</div>
          <LoadingSpinner v-if="incidentStore.isLoading" />
          <EmptyState v-else-if="incidentStore.incidents.length === 0" title="Sin emergencias" message="Las nuevas intervenciones aparecerán aquí." />
          <template v-else>
            <IncidentCard v-for="incident in incidentStore.incidents.slice(0, 2)" :key="incident.id" :incident="incident" />
          </template>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.container > h1 { margin-top: 5px; font-size: 23px; }
.subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  color: var(--alerta-muted);
  font-size: 13px;
}
.subtitle ion-icon { font-size: 16px; color: var(--alerta-quiet); }
.status-card { margin-top: 16px; }
.status-copy {
  display: flex;
  align-items: center;
  gap: 12px;
}
.status-copy > div { display: grid; gap: 4px; }
.green-circle { background: var(--alerta-green-soft); color: var(--alerta-green); }
.yellow-circle { background: var(--alerta-yellow-soft); color: #9a7800; }
.red-circle { background: var(--alerta-red-soft); color: var(--alerta-red); }
.status-label {
  color: var(--alerta-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.status-state {
  color: var(--alerta-green);
  font-size: 14px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}
.summary-grid ion-card {
  margin: 0;
}
.metric-card ion-card-content {
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  justify-items: start;
  row-gap: 7px;
  padding: 12px 10px;
}
.summary-label {
  min-width: 0;
  color: var(--alerta-muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.25;
}
.summary-grid h2 {
  margin-top: 0;
  font-size: 24px;
  line-height: 1;
}
.section-block {
  display: grid;
  gap: 12px;
  margin-top: 24px;
}
.status-row {
  display: flex;
  align-items: center;
}
.active-card {
  border-left: 3px solid var(--alerta-red);
}
.active-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.muted {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.risk-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--alerta-red-soft);
  color: var(--alerta-red-critical);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
.risk-pill ion-icon { font-size: 14px; }
.location-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 6px;
  font-size: 14px;
}
.location-row ion-icon { color: var(--alerta-brand); font-size: 18px; }
.detail {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
}
.detail ion-icon { color: var(--alerta-quiet); font-size: 16px; }
.primary-button {
  margin-top: 14px;
  --background: var(--alerta-orange);
  --color: var(--alerta-ink);
}
</style>
