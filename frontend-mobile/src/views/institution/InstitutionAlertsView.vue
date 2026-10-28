<script setup lang="ts">
import {
  IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonPage,
  IonRefresher, IonRefresherContent, IonTitle, IonToolbar, onIonViewWillEnter,
  onIonViewDidEnter, onIonViewDidLeave
} from '@ionic/vue'
import { arrowForwardOutline, flameOutline, locationOutline, timeOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'
import { useInstitutionAlertStore } from '../../stores/institution-alert.store'
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { socket } from '../../services/realtime'
import type { AlertStatus } from '../../types'

const alertStore = useInstitutionAlertStore()

const error = ref('')
const primeraCarga = ref(true)
const cargando = computed(() => primeraCarga.value || alertStore.isLoading)

const alertasOrdenadas = computed(() =>
  [...alertStore.alerts].sort((a, b) => {
    const fa = a.status === 'FINALIZADA' ? 1 : 0
    const fb = b.status === 'FINALIZADA' ? 1 : 0
    if (fa !== fb) return fa - fb
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
)

const tono = (status: AlertStatus): 'success' | 'warning' | 'info' =>
  status === 'FINALIZADA' ? 'success' : status === 'NUEVA' ? 'warning' : 'info'

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const cargar = async () => {
  error.value = ''
  try {
    await alertStore.fetchAlerts()
  } catch (e: any) {
    console.error('Error cargando alertas', e)
    error.value = e?.message || 'No se pudieron cargar las alertas.'
  } finally {
    primeraCarga.value = false
  }
}

const refrescar = () => {
  return cargar()
}

const onRefresh = async (event: any) => {
  await refrescar()
  event.target.complete()
}

onIonViewWillEnter(() => { cargar() })

const eventos = ['alerta:abierta', 'alerta:actualizada', 'alerta:confirmada', 'alerta:descartada']

onIonViewDidEnter(() => {
  eventos.forEach((e) => socket.on(e, refrescar))
})

onIonViewDidLeave(() => {
  eventos.forEach((e) => socket.off(e, refrescar))
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
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="container">
        <div class="section-title">Alertas recibidas</div>

        <div v-if="error" class="error-box">
          <p>{{ error }}</p>
          <ion-button size="small" fill="clear" @click="refrescar">Reintentar</ion-button>
        </div>

        <LoadingSpinner v-if="cargando" />
        <EmptyState
          v-else-if="alertStore.alerts.length === 0 && !error"
          title="No tienes alertas pendientes"
          message="Las nuevas alertas aparecerán aquí."
        />

        <div v-else class="list">
          <ion-card v-for="alert in alertasOrdenadas" :key="alert.id" class="alert-item">
            <div class="card-head">
              <div>
                <p class="muted">Alerta #{{ alert.id }}</p>
                <h3>{{ alert.type }}</h3>
              </div>
              <StatusBadge :state="alert.status" :tone="tono(alert.status)" />
            </div>
            <p class="location"><ion-icon :icon="locationOutline" />{{ alert.location }}</p>
            <div class="meta-row">
              <span class="risk"><ion-icon :icon="flameOutline" />{{ alert.risk }}</span>
              <span><ion-icon :icon="timeOutline" />{{ fechaHora(alert.createdAt) }}</span>
            </div>
            <div v-if="alert.incidentId" class="alert-action">
              <ion-button size="small" fill="clear" :router-link="`/institucion/emergencia/${alert.incidentId}`">
                Ver detalle<ion-icon slot="end" :icon="arrowForwardOutline" />
              </ion-button>
            </div>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 24px;
}
.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 12px;
}
.alert-item {
  margin: 0;
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
  overflow-wrap: anywhere;
}
.location ion-icon { flex: none; color: var(--alerta-brand); font-size: 18px; }
.meta-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 6px 8px;
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
.error-box {
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #fdeeee;
  color: #a33a33;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
</style>