<script setup lang="ts">
import {
  IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon,
  IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToast, IonToolbar, onIonViewWillEnter,
  onIonViewDidEnter, onIonViewDidLeave
} from '@ionic/vue'
import {
  checkmarkCircleOutline, flameOutline, locationOutline, navigateOutline, timeOutline
} from 'ionicons/icons'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useIncidentStore } from '../../stores/incident.store'
import IncidentTimeline from '../../components/common/IncidentTimeline.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import { hapticsService } from '../../services/haptics.service'
import type { IncidentStatus } from '../../types'

const route = useRoute()
const incidentStore = useIncidentStore()
const toastOpen = ref(false)
const toastMessage = ref('')
const isUpdating = ref(false)
const confirmFinalization = ref(false)
const primeraCarga = ref(true)

const incidentId = computed(() => String(route.params.id ?? ''))
const incident = computed(() => incidentStore.incidents.find((item) => item.id === incidentId.value))

const nextActionByStatus: Partial<Record<IncidentStatus, { status: IncidentStatus; label: string }>> = {
  NUEVA: { status: 'RECIBIDA', label: 'CONFIRMAR RECEPCIÓN' },
  RECIBIDA: { status: 'EN_CAMINO', label: 'EN CAMINO' },
  EN_CAMINO: { status: 'EN_SITIO', label: 'LLEGAMOS AL LUGAR' },
  EN_SITIO: { status: 'CONTROLADA', label: 'INCENDIO CONTROLADO' },
  CONTROLADA: { status: 'FINALIZADA', label: 'FINALIZAR INTERVENCIÓN' },
}
const nextAction = computed(() => incident.value ? nextActionByStatus[incident.value.status] ?? null : null)
const statusTone = computed(() => {
  if (incident.value?.status === 'FINALIZADA') return 'success'
  if (incident.value?.status === 'NUEVA') return 'warning'
  return 'info'
})

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const mapaEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let punto: L.CircleMarker | null = null
let observador: ResizeObserver | null = null

const tieneUbicacion = computed(
  () => !!incident.value && (incident.value.latitude !== 0 || incident.value.longitude !== 0)
)

const dibujarMapa = async () => {
  await nextTick()
  const inc = incident.value
  if (!inc || !mapaEl.value || !tieneUbicacion.value) return
  const pos: L.LatLngTuple = [inc.latitude, inc.longitude]

  if (!map) {
    map = L.map(mapaEl.value).setView(pos, 16)
    
    // CORRECCIÓN: Usamos OpenStreetMap estándar que es 100% gratuito y no requiere API KEY
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map)
    
    punto = L.circleMarker(pos, {
      radius: 12,
      color: '#ffffff',
      weight: 3,
      fillColor: '#F24A23',
      fillOpacity: 1
    }).addTo(map)
    
    if ('ResizeObserver' in window) {
      observador = new ResizeObserver(() => map?.invalidateSize())
      observador.observe(mapaEl.value)
    }
    setTimeout(() => map?.invalidateSize(), 300)
  } else {
    map.setView(pos, map.getZoom())
    punto?.setLatLng(pos)
  }
}

watch(() => [incident.value?.latitude, incident.value?.longitude], dibujarMapa, { immediate: true })

const updateStatus = async (status: IncidentStatus) => {
  if (!incident.value || isUpdating.value) return
  isUpdating.value = true
  try {
    const updated = await incidentStore.updateStatus(incident.value.id, status)
    if (!updated) {
      toastMessage.value = 'No se pudo actualizar el estado.'
      toastOpen.value = true
      return
    }
    await hapticsService.lightImpact()
    toastMessage.value = 'Estado actualizado'
    toastOpen.value = true
  } catch (e: any) {
    console.error('Error al actualizar el estado', e)
    toastMessage.value = e?.message || 'No se pudo actualizar el estado.'
    toastOpen.value = true
  } finally {
    isUpdating.value = false
  }
}

const requestNextAction = async () => {
  const action = nextAction.value
  if (!action || isUpdating.value) return
  if (action.status === 'FINALIZADA') {
    confirmFinalization.value = true
    return
  }
  await updateStatus(action.status)
}

const finishFinalization = async () => {
  confirmFinalization.value = false
  if (nextAction.value?.status === 'FINALIZADA') await updateStatus('FINALIZADA')
}

const cargar = async () => {
  try {
    await incidentStore.fetchIncidents()
  } catch (e) {
    console.error('Error cargando la emergencia', e)
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

onIonViewDidLeave(() => {
  // Limpieza al salir de la vista
})

onUnmounted(() => {
  observador?.disconnect()
  observador = null
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/institucion/inicio"></ion-back-button>
        </ion-buttons>
        <ion-title>Emergencia</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="container" v-if="incident">
        <!-- Tarjeta principal de la emergencia -->
        <ion-card class="hero-card">
          <ion-card-content>
            <div class="top-row">
              <div>
                <p class="muted">ALERTA #{{ incident.id }}</p>
                <h2>{{ incident.title }}</h2>
              </div>
              <span class="risk-pill"><ion-icon :icon="flameOutline" />{{ incident.risk }}</span>
            </div>
            <p class="description">{{ incident.description }}</p>
          </ion-card-content>
        </ion-card>

        <div class="section-title">ESTADO Y SIGUIENTE ACCIÓN</div>
        <ion-card class="next-action-card">
          <ion-card-content>
            <div class="current-status">
              <span>ESTADO ACTUAL</span>
              <StatusBadge :state="incident.status" :tone="statusTone" />
            </div>
            <div v-if="nextAction" class="next-action-copy">
              <span>SIGUIENTE ACCIÓN</span>
              <strong>{{ nextAction.label }}</strong>
            </div>
            <div v-else class="next-action-copy">
              <span>Intervención finalizada</span>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
            <div class="info-grid">
              <div><span class="label"><ion-icon :icon="locationOutline" />UBICACIÓN</span><strong>{{ incident.location }}</strong></div>
              <div><span class="label"><ion-icon :icon="locationOutline" />DIRECCIÓN</span><strong>{{ incident.address }}</strong></div>
              <div><span class="label"><ion-icon :icon="timeOutline" />DETECTADA</span><strong>{{ fechaHora(incident.createdAt) }}</strong></div>
              <div v-if="incident.distanceKm > 0"><span class="label"><ion-icon :icon="navigateOutline" />DISTANCIA</span><strong>{{ incident.distanceKm }} km</strong></div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card v-if="tieneUbicacion">
          <ion-card-content>
            <div ref="mapaEl" class="detalle-map"></div>
          </ion-card-content>
        </ion-card>

        <div class="section-title">REGISTRO DE TIEMPOS</div>
        <IncidentTimeline :events="incident.timeline" />

        <div v-if="nextAction" class="action-block">
          <ion-button expand="block" size="large" class="primary-button" :disabled="isUpdating" @click="requestNextAction">
            <ion-icon slot="start" :icon="checkmarkCircleOutline" aria-hidden="true" />
            {{ isUpdating ? 'Actualizando...' : nextAction.label }}
          </ion-button>
        </div>
      </div>

      <div v-else-if="primeraCarga || incidentStore.isLoading" class="container">
        <LoadingSpinner />
      </div>

      <div v-else class="container empty-state-box">
        <p>Emergencia no encontrada.</p>
      </div>
    </ion-content>

    <ion-toast
      :is-open="toastOpen"
      :message="toastMessage"
      :duration="2600"
      @didDismiss="toastOpen = false"
    />
    <ConfirmDialog
      :open="confirmFinalization"
      message="¿Deseas finalizar esta intervención? Después de finalizar, la emergencia pasará al historial."
      confirm-text="Finalizar"
      @confirm="finishFinalization"
      @cancel="confirmFinalization = false"
    />
  </ion-page>
</template>

<style scoped>
/* CORRECCIÓN: Padding superior de 24px para evitar que se esconda bajo el header y padding inferior de 80px para que las pestañas no tapen el botón final */
.container {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 80px 16px; 
}
.hero-card { margin: 0 0 20px 0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.top-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.top-row > div { min-width: 0; }
.top-row h2 { overflow-wrap: anywhere; font-size: 22px; font-weight: 700; margin: 4px 0; color: #111; }
.muted {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--alerta-muted, #666);
}
.risk-pill {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #fdeeee;
  color: #d9382e;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
}
.risk-pill ion-icon { font-size: 14px; }
.description {
  margin-top: 12px;
  color: var(--alerta-muted, #555);
  font-size: 15px;
  line-height: 1.5;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--alerta-muted, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 24px 0 10px 4px;
}

ion-card { margin: 0 0 16px 0; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 12px;
}
.label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--alerta-muted, #666);
}
.label ion-icon { color: var(--alerta-orange, #f24a23); font-size: 16px; }
.info-grid strong {
  font-size: 15px;
  color: #111;
  line-height: 1.4;
  display: block;
  overflow-wrap: anywhere;
}

.detalle-map {
  width: 100%;
  height: clamp(200px, 35vh, 360px);
  border-radius: 10px;
  background: #e9e9e9;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.action-block { margin-top: 24px; }
.action-block ion-button {
  --background: var(--alerta-orange, #f24a23);
  --color: white;
  --border-radius: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.current-status,
.next-action-copy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.current-status > span:first-child,
.next-action-copy > span {
  color: var(--alerta-muted, #666);
  font-size: 12px;
  font-weight: 700;
}
.next-action-copy {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #eaeaea;
}
.next-action-copy strong {
  color: #111;
  font-size: 14px;
  text-align: right;
  text-transform: uppercase;
}
.empty-state-box {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--alerta-muted, #666);
}
@media (max-width: 420px) {
  .info-grid { grid-template-columns: 1fr; }
}
</style>