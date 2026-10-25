<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/ciudadano/inicio" />
        </ion-buttons>
        <ion-title>Mis reportes</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p v-if="reportStore.error" role="alert" class="ion-padding">{{ reportStore.error }}</p>
      <ion-list v-else-if="reportStore.reports.length">
        <ion-item v-for="report in reportStore.reports" :key="report.id" detail @click="openReport(report.id)">
          <ion-label>
            <h3>{{ report.incidentType }}</h3>
            <p>{{ report.description }}</p>
            <small>{{ report.status }} · {{ formatDate(report.createdAt) }}</small>
          </ion-label>
        </ion-item>
      </ion-list>

      <div v-else class="empty-state">
        <p>Aún no tienes reportes enviados.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { useCitizenReportStore } from '../stores/citizen-report.store'

const router = useRouter()
const reportStore = useCitizenReportStore()

onMounted(async () => {
  try { await reportStore.fetchReports() } catch { /* Error visible en el store. */ }
})

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

function openReport(id: string) {
  router.push(`/ciudadano/reportes/${id}`)
}
</script>

<style scoped>
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #64748b;
}
</style>
