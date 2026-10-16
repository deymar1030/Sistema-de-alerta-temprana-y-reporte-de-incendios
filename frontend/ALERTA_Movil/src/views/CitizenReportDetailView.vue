<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/ciudadano/reportes" />
        </ion-buttons>
        <ion-title>Detalle de reporte</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card v-if="report">
        <ion-card-header>
          <ion-card-title>{{ report.incidentType }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p><strong>Estado:</strong> {{ report.status }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(report.createdAt) }}</p>
          <p><strong>Descripción:</strong> {{ report.description }}</p>
          <p><strong>Ubicación:</strong> {{ report.location?.coordinates?.latitude ?? '-' }}, {{ report.location?.coordinates?.longitude ?? '-' }}</p>

          <div v-if="report.photo || report.photoUrl" class="photo-preview">
            <h3>Evidencia enviada</h3>
            <img :src="report.photo || report.photoUrl" alt="Foto del reporte" />
          </div>
        </ion-card-content>
      </ion-card>

      <div v-else class="empty-state">Cargando reporte...</div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { citizenReportService } from '../services/citizen-report.service'

const route = useRoute()
const report = ref<any>(null)

onMounted(async () => {
  const id = String(route.params.id)
  report.value = await citizenReportService.getReportById(id)
})

const formatDate = (value: string) => new Date(value).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
</script>

<style scoped>
.photo-preview {
  margin-top: 0.75rem;
}

.photo-preview h3 {
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
}

.photo-preview img {
  width: 100%;
  border-radius: 10px;
  max-height: 220px;
  object-fit: cover;
}

.empty-state {
  color: #64748b;
  text-align: center;
  margin-top: 2rem;
}
</style>
