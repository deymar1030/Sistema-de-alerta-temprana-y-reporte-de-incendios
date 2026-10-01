<script setup lang="ts">
import { IonCard, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { computed, onMounted } from 'vue'
import { calendarOutline, locationOutline } from 'ionicons/icons'
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import { useIncidentStore } from '../../stores/incident.store'
import StatusBadge from '../../components/common/StatusBadge.vue'

const incidentStore = useIncidentStore()
const finalIncidents = computed(() => incidentStore.incidents.filter((item) => item.status === 'FINALIZADA'))

onMounted(async () => {
  await incidentStore.fetchIncidents()
})
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-title>Historial</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="container">
        <div class="section-title">Emergencias finalizadas</div>

        <LoadingSpinner v-if="incidentStore.isLoading" />
        <EmptyState v-else-if="finalIncidents.length === 0" title="Todavía no existen intervenciones finalizadas" message="Las emergencias cerradas aparecerán aquí." />

        <template v-else>
          <ion-card v-for="incident in finalIncidents" :key="incident.id" class="history-item">
            <div class="card-head">
              <div>
                <p class="muted">{{ incident.id }}</p>
                <h3><ion-icon :icon="locationOutline" />{{ incident.location }}</h3>
              </div>
              <StatusBadge :state="incident.status" tone="success" />
            </div>
            <div class="meta">
              <span><ion-icon :icon="calendarOutline" />{{ new Date(incident.createdAt).toLocaleDateString('es-BO') }}</span>
              <span>{{ incident.distanceKm }} km</span>
            </div>
          </ion-card>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.history-item {
  margin-bottom: 12px;
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
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
}
.card-head h3 ion-icon { color: var(--alerta-brand); font-size: 18px; }
.muted {
  margin-bottom: 4px;
  color: var(--alerta-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  color: var(--alerta-muted);
  font-size: 12px;
}
.meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.meta ion-icon { color: var(--alerta-orange); font-size: 16px; }
.empty-state {
  min-height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--alerta-muted);
}
</style>
