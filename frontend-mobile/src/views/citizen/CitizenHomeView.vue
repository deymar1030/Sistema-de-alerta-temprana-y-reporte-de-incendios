<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { bookOutline, documentTextOutline, flameOutline, notificationsOutline } from 'ionicons/icons'
import { onMounted } from 'vue'
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import { useCitizenReportStore } from '../../stores/citizen-report.store'
import { useNotificationStore } from '../../stores/notification.store'

const reportStore = useCitizenReportStore()
const notificationStore = useNotificationStore()
onMounted(async () => {
  await Promise.all([reportStore.fetchReports(), notificationStore.fetchNotifications()])
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
        <h1>Prevención de Incendios</h1>
        <p class="subtitle">Reporta posibles incendios y recibe información de emergencia.</p>

        <ion-button expand="block" size="large" class="primary-button" router-link="/ciudadano/reportar">
          <ion-icon slot="start" :icon="flameOutline" aria-hidden="true" />
          Reportar incendio
        </ion-button>

        <div class="info-grid">
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="icon-circle"><ion-icon :icon="notificationsOutline" /></span>
              <p class="label">Notificaciones</p>
              <h3>{{ notificationStore.notifications.length }}</h3>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="icon-circle green-circle"><ion-icon :icon="documentTextOutline" /></span>
              <p class="label">Mis reportes</p>
              <h3>{{ reportStore.reports.length }}</h3>
            </ion-card-content>
          </ion-card>
        </div>

        <div class="section-block">
          <div class="section-title">Notificaciones recientes</div>
          <LoadingSpinner v-if="notificationStore.isLoading" />
          <EmptyState v-else-if="notificationStore.notifications.length === 0" title="No tienes notificaciones nuevas" message="Los avisos importantes aparecerán aquí." />
          <template v-else>
            <ion-card v-for="item in notificationStore.notifications.slice(0, 2)" :key="item.id" class="compact-card">
              <ion-card-content>
                <div class="mini-row">
                  <span class="icon-circle"><ion-icon :icon="notificationsOutline" /></span>
                  <div>
                    <h4>{{ item.title }}</h4>
                    <p>{{ item.date }} · {{ item.time }}</p>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </template>
        </div>

        <div class="section-block">
          <div class="section-title">Instrucciones rápidas</div>
          <ion-card router-link="/ciudadano/instrucciones" class="interactive-card compact-card">
            <ion-card-content class="quick-block">
              <span class="icon-circle green-circle"><ion-icon :icon="bookOutline" /></span>
              <div>
                <h4>Qué hacer ante un incendio</h4>
                <p>Revisa los pasos básicos para actuar con calma.</p>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.subtitle {
  margin-top: 6px;
  color: var(--alerta-muted);
  font-size: 14px;
  line-height: 1.6;
}
.primary-button {
  margin-top: 20px;
  min-height: 52px;
  --background: var(--alerta-orange);
  --color: var(--alerta-ink);
  --box-shadow: 0 5px 14px rgba(244, 162, 89, 0.28);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.metric-card ion-card-content {
  display: grid;
  grid-template-columns: 36px 1fr;
  align-items: center;
  column-gap: 10px;
  padding: 14px;
}
.label {
  color: var(--alerta-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.info-grid h3 {
  grid-column: 2;
  margin-top: -5px;
  font-size: 24px;
  line-height: 1;
}
.section-block {
  display: grid;
  gap: 12px;
  margin-top: 24px;
}
.mini-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.quick-block {
  display: flex;
  align-items: center;
  gap: 12px;
}
.quick-block p,
.mini-row p {
  margin-top: 4px;
  color: var(--alerta-muted);
  font-size: 12px;
}
.interactive-card {
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.interactive-card:active {
  transform: scale(0.985);
}
@media (max-width: 359px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
