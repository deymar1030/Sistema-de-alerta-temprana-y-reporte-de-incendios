<script setup lang="ts">
import { IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { calendarOutline, timeOutline } from 'ionicons/icons'
import { computed, onMounted } from 'vue'
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { useCitizenReportStore } from '../../stores/citizen-report.store'

const reportStore = useCitizenReportStore()
const reports = computed(() => reportStore.reports)

onMounted(async () => {
  await reportStore.fetchReports()
})
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-title>Mis reportes</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="container">
        <div class="section-title">Mis reportes</div>

        <LoadingSpinner v-if="reportStore.isLoading" />
        <EmptyState
          v-else-if="reports.length === 0"
          title="Aún no enviaste ningún reporte"
          message="Tus reportes aparecerán aquí cuando los envíes."
        />

        <template v-else>
          <ion-card v-for="report in reports" :key="report.id" class="report-card">
            <ion-card-content>
              <div class="head">
                <div>
                  <p class="muted">{{ report.id }}</p>
                  <h3>{{ report.location }}</h3>
                </div>
                <StatusBadge :state="report.status" :tone="report.status === 'VALIDADO' || report.status === 'ATENDIDO' ? 'success' : report.status === 'DESCARTADO' ? 'danger' : report.status === 'EN_REVISION' ? 'warning' : 'info'" />
              </div>
              <p class="description">{{ report.description }}</p>
              <div class="meta">
                <span><ion-icon :icon="calendarOutline" aria-hidden="true" />{{ new Date(report.createdAt).toLocaleDateString('es-BO') }}</span>
                <span><ion-icon :icon="timeOutline" aria-hidden="true" />{{ new Date(report.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) }}</span>
              </div>
            </ion-card-content>
          </ion-card>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.report-card {
  margin-bottom: 12px;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.head > div {
  min-width: 0;
}
.head h3 {
  margin-top: 4px;
  font-size: 16px;
}
.muted {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #596773;
}
.description {
  margin-top: 12px;
  color: var(--alerta-muted);
  font-size: 14px;
  line-height: 1.5;
}
.meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  color: var(--alerta-muted);
  font-size: 12px;
}
.meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.meta ion-icon {
  color: var(--alerta-orange);
  font-size: 16px;
}
</style>
