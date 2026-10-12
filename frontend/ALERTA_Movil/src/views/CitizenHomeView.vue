<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Inicio ciudadano</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="logout">Salir</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="welcome-card">
        <h2>Hola, {{ authStore.user?.name || 'Ciudadano' }}</h2>
        <p>Revisa alertas activas, reportes recientes y tus notificaciones.</p>
      </div>

      <div class="stats-grid">
        <ion-card>
          <ion-card-content>
            <div class="stat-label">Alertas activas</div>
            <div class="stat-value">{{ alertStore.alerts.length }}</div>
          </ion-card-content>
        </ion-card>
        <ion-card>
          <ion-card-content>
            <div class="stat-label">Reportes</div>
            <div class="stat-value">{{ citizenReportStore.reports.length }}</div>
          </ion-card-content>
        </ion-card>
      </div>

      <ion-card class="map-card">
        <ion-card-header>
          <ion-card-title>Mapa de alertas</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div ref="mapContainer" class="map-container"></div>
        </ion-card-content>
      </ion-card>

      <ion-list>
        <ion-item button @click="router.push('/ciudadano/reportar')">
          <ion-icon :icon="warningOutline" slot="start" />
          <ion-label>Reportar incidente</ion-label>
        </ion-item>
        <ion-item button @click="router.push('/ciudadano/reportes')">
          <ion-icon :icon="documentTextOutline" slot="start" />
          <ion-label>Mis reportes</ion-label>
        </ion-item>
        <ion-item button @click="router.push('/ciudadano/notificaciones')">
          <ion-icon :icon="notificationsOutline" slot="start" />
          <ion-label>Notificaciones</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewDidEnter,
} from '@ionic/vue'
import {
  documentTextOutline,
  notificationsOutline,
  warningOutline,
} from 'ionicons/icons'
import * as L from 'leaflet'
import { useAlertStore } from '../stores/alert.store'
import { useAuthStore } from '../stores/auth.store'
import { useCitizenReportStore } from '../stores/citizen-report.store'

const router = useRouter()
const authStore = useAuthStore()
const alertStore = useAlertStore()
const citizenReportStore = useCitizenReportStore()
const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<L.Map | null>(null)
const markers = shallowRef<L.LayerGroup | null>(null)

const activeAlerts = computed(() => alertStore.alerts)
const totalAlerts = computed(() => activeAlerts.value.length)

async function loadData() {
  await Promise.allSettled([
    alertStore.fetchAlerts(),
    citizenReportStore.fetchReports(),
  ])
  renderMapMarkers()
}

function renderMapMarkers() {
  if (!map.value) return

  if (markers.value) {
    map.value.removeLayer(markers.value)
  }

  markers.value = L.layerGroup()

  activeAlerts.value.forEach((item) => {
    const { latitude, longitude } = item.location.coordinates
    const marker = L.marker([latitude, longitude]).addTo(markers.value!)
    marker.bindPopup(`<strong>${item.status}</strong><br>${item.description || 'Alerta registrada'}`)
  })

  markers.value.addTo(map.value)
}

function initMap() {
  if (!mapContainer.value || map.value) return

  map.value = L.map(mapContainer.value).setView([-33.4489, -70.6693], 11)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map.value)

  renderMapMarkers()
  setTimeout(() => map.value?.invalidateSize(), 150)
}

onIonViewDidEnter(async () => {
  await loadData()
  initMap()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

async function logout() {
  await authStore.logout()
  await router.replace('/login')
}
</script>

<style scoped>
.welcome-card {
  margin-bottom: 1rem;
}

.welcome-card h2 {
  margin: 0 0 0.25rem;
}

.welcome-card p {
  color: #64748b;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-label {
  color: #64748b;
  font-size: 0.8rem;
}

.stat-value {
  font-weight: 700;
  font-size: 1.5rem;
  margin-top: 0.25rem;
}

.map-card {
  margin-bottom: 1rem;
}

.map-container {
  width: 100%;
  height: 260px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
