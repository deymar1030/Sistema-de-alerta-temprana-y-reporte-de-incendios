<script setup lang="ts">
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/vue'
import { IonIcon } from '@ionic/vue'
import { locationOutline, timeOutline } from 'ionicons/icons'
import StatusBadge from './StatusBadge.vue'
import type { Incident } from '../../types'

defineProps<{ incident: Incident }>()
</script>

<template>
  <ion-card class="alert-card">
    <ion-card-header>
      <div class="card-header-row">
        <div>
          <p class="muted">{{ incident.id }}</p>
          <ion-card-title>{{ incident.title }}</ion-card-title>
        </div>
        <StatusBadge :state="incident.status" :tone="incident.status === 'FINALIZADA' ? 'success' : incident.status === 'NUEVA' || incident.status === 'RECIBIDA' ? 'warning' : 'info'" />
      </div>
    </ion-card-header>
    <ion-card-content>
      <div class="meta-row">
        <span class="icon-circle"><ion-icon :icon="locationOutline" /></span>
        <span>{{ incident.location }}</span>
      </div>
      <div class="meta-row small">
        <ion-icon :icon="timeOutline" class="meta-icon" aria-hidden="true" />
        <span>{{ new Date(incident.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) }}</span>
      </div>
      <p class="description">{{ incident.description }}</p>
    </ion-card-content>
  </ion-card>
</template>

<style scoped>
.alert-card {
  margin: 0 0 12px;
}
.card-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}
.muted {
  font-size: 12px;
  text-transform: uppercase;
  color: #596773;
  margin-bottom: 0.35rem;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #17212b;
  font-size: 14px;
  margin-bottom: 0.4rem;
}
.meta-row.small {
  font-size: 12px;
  color: #596773;
}
.meta-icon {
  font-size: 17px;
  color: #7b8791;
}
.description {
  margin-top: 12px;
  color: var(--alerta-muted);
  font-size: 14px;
  line-height: 1.45;
}
</style>
