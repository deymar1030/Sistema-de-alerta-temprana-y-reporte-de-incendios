<script setup lang="ts">
import { IonButton, IonCard, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { arrowForwardOutline, flameOutline, locationOutline, timeOutline } from 'ionicons/icons'
import { onMounted } from 'vue'
import { useInstitutionAlertStore } from '../../stores/institution-alert.store'
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'

const alertStore = useInstitutionAlertStore()

onMounted(async () => {
  await alertStore.fetchAlerts()
})
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-title>Alertas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="container">
        <div class="section-title">Alertas recibidas</div>

        <LoadingSpinner v-if="alertStore.isLoading" />
        <EmptyState v-else-if="alertStore.alerts.length === 0" title="No tienes alertas pendientes" message="Las nuevas alertas aparecerán aquí." />

        <div v-else class="list">
          <ion-card v-for="alert in alertStore.alerts" :key="alert.id" class="alert-item">
            <div class="card-head">
              <div>
                <p class="muted">{{ alert.id }}</p>
                <h3>{{ alert.type }}</h3>
              </div>
              <StatusBadge :state="alert.status" :tone="alert.status === 'FINALIZADA' ? 'success' : alert.status === 'NUEVA' ? 'warning' : 'info'" />
            </div>
            <p class="location"><ion-icon :icon="locationOutline" />{{ alert.location }}</p>
            <div class="meta-row">
              <span class="risk"><ion-icon :icon="flameOutline" />{{ alert.risk }}</span>
              <span><ion-icon :icon="timeOutline" />{{ new Date(alert.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) }}</span>
            </div>
            <div v-if="alert.incidentId" class="alert-action">
              <ion-button size="small" fill="clear" :router-link="`/institucion/emergencia/${alert.incidentId}`">Ver detalle<ion-icon slot="end" :icon="arrowForwardOutline" /></ion-button>
            </div>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.alert-item {
  padding: 16px;
}
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.card-head > div { min-width: 0; }
.card-head h3 {
  font-size: 16px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.muted {
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.location {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  font-size: 14px;
  font-weight: 600;
}
.location ion-icon { color: var(--alerta-brand); font-size: 18px; }
.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  color: var(--alerta-muted);
  font-size: 12px;
}
.meta-row span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.meta-row ion-icon { font-size: 16px; }
.risk {
  color: var(--alerta-red-critical);
  font-weight: 700;
}
.alert-action {
  display: flex;
  justify-content: flex-end;
  margin: 8px -8px -8px 0;
}
.alert-action ion-button {
  min-height: 38px;
  --box-shadow: none;
  font-size: 13px;
}
</style>
