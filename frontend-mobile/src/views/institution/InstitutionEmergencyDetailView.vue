<script setup lang="ts">
import {
  IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon,
  IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToast, IonToolbar, onIonViewWillEnter, onIonViewDidEnter
} from '@ionic/vue'
import {
  checkmarkCircleOutline, flameOutline, locationOutline, navigateOutline, timeOutline, locateOutline
} from 'ionicons/icons'
import { computed, nextTick, onUnmounted, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useIncidentStore } from '../../stores/incident.store'
import IncidentTimeline from '../../components/common/IncidentTimeline.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import { hapticsService } from '../../services/haptics.service'
import { geocodingService } from '../../services/geocoding.service'
import { siguienteAccion } from '../../services/incident.service'
import { useRealtimeRefresh } from '../../composables/useRealtimeRefresh'

const route = useRoute()
const router = useRouter()
const incidentStore = useIncidentStore()
const toastOpen = ref(false)
const toastMessage = ref('')
const toastColor = ref<'success' | 'warning' | 'danger'>('success')
const isUpdating = ref(false)
const confirmFinalization = ref(false)
const primeraCarga = ref(true)

const incidentId = computed(() => String(route.params.id ?? ''))
const incident = computed(() => incidentStore.incidents.find((item) => item.id === incidentId.value))

const envioEstado = computed(() => incident.value?.envioEstado ?? null)
const nextAction = computed(() => siguienteAccion(envioEstado.value))
const statusTone = computed(() => {
  if (envioEstado.value === 'CERRADA') return 'success'
  if (envioEstado.value === 'ENVIADA') return 'warning'
  return 'info'
})

const direccionResuelta = ref('')
const direccion = computed(() => incident.value?.address || direccionResuelta.value || 'Ubicación en mapa')

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const mapaEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let punto: L.CircleMarker | null = null
let userMarker: L.CircleMarker | null = null
let polyline: L.Polyline | null = null
let observador: ResizeObserver | null = null

const userLocation = ref<{ lat: number, lng: number } | null>(null)
const calculatedDistance = ref<string>('')

const tieneUbicacion = computed(
  () => !!incident.value && (incident.value.latitude !== 0 || incident.value.longitude !== 0)
)

const showToast = (message: string, color: 'success' | 'warning' | 'danger') => {
  toastMessage.value = message
  toastColor.value = color
  toastOpen.value = true
}

// Lógica de GPS
const obtenerUbicacionUsuario = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      let permisos = await Geolocation.checkPermissions();
      if (permisos.location !== 'granted') {
        permisos = await Geolocation.requestPermissions();
      }
      if (permisos.location !== 'granted') {
        showToast('Permiso de GPS denegado. Ve a los ajustes para habilitarlo.', 'danger');
        return;
      }
    }

    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
    userLocation.value = { lat: position.coords.latitude, lng: position.coords.longitude };
    
    dibujarMapa();
  } catch (error: any) {
    console.error('Error GPS:', error);
    showToast('Activa el GPS para calcular la distancia a la emergencia.', 'warning');
  }
}

const dibujarMapa = async () => {
  await nextTick()
  const inc = incident.value
  if (!inc || !mapaEl.value || !tieneUbicacion.value) return
  const pos: L.LatLngTuple = [inc.latitude, inc.longitude]

  if (!map) {
    map = L.map(mapaEl.value, { zoomControl: false }).setView(pos, 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 19
    }).addTo(map)
    L.control.zoom({ position: 'topleft' }).addTo(map);
    
    if ('ResizeObserver' in window) {
      observador = new ResizeObserver(() => map?.invalidateSize())
      observador.observe(mapaEl.value)
    }
  }

  // Limpiar capas anteriores para redibujar
  if (punto) map.removeLayer(punto);
  if (userMarker) map.removeLayer(userMarker);
  if (polyline) map.removeLayer(polyline);

  // 1. Dibujar Alerta (Rojo)
  punto = L.circleMarker(pos, {
    radius: 12, color: '#ffffff', weight: 3, fillColor: '#F24A23', fillOpacity: 1
  }).addTo(map)
  punto.bindPopup(`<strong>Emergencia</strong><br>${inc.title}`)

  // 2. Dibujar Usuario y Línea (Si hay GPS)
  if (userLocation.value) {
    const userPos: L.LatLngTuple = [userLocation.value.lat, userLocation.value.lng]
    
    userMarker = L.circleMarker(userPos, {
      radius: 9, fillColor: '#428cff', color: '#ffffff', weight: 3, fillOpacity: 1
    }).addTo(map)
    userMarker.bindPopup(`<strong>Tu ubicación</strong>`)

    // Línea punteada
    polyline = L.polyline([userPos, pos], { color: '#428cff', weight: 3, dashArray: '5, 8' }).addTo(map)

    // Cálculo real de distancia
    const distMeters = L.latLng(userPos).distanceTo(L.latLng(pos));
    if (distMeters > 1000) {
      calculatedDistance.value = (distMeters / 1000).toFixed(1) + ' km';
    } else {
      calculatedDistance.value = Math.round(distMeters) + ' m';
    }

    // Centrar mapa para ver ambos puntos
    const bounds = L.latLngBounds([userPos, pos]);
    map.fitBounds(bounds, { padding: [40, 40] });
  } else {
    map.setView(pos, 16);
  }

  setTimeout(() => map?.invalidateSize(), 400)
}

watch(() => [incident.value?.latitude, incident.value?.longitude], dibujarMapa, { immediate: true })

watch(
  () => [incident.value?.address, incident.value?.latitude, incident.value?.longitude] as const,
  async ([address, lat, lng]) => {
    direccionResuelta.value = ''
    if (address || !lat || !lng) return
    const resolved = await geocodingService.resolveAddress(lat, lng)
    if (resolved) direccionResuelta.value = resolved
  },
  { immediate: true },
)

const runAction = async () => {
  const action = nextAction.value
  const current = incident.value
  if (!action || !current || isUpdating.value) return
  isUpdating.value = true
  try {
    await incidentStore.avanzarEnvio(current.id)
    await hapticsService.lightImpact()

    if (action.accion === 'recibir') {
      await router.replace('/institucion/inicio')
      return
    }
    showToast(action.accion === 'cerrar' ? 'Intervención finalizada' : 'Alerta marcada en atención', 'success')
  } catch (e: any) {
    console.error('Error al actualizar el estado', e)
    showToast(e?.message || 'No se pudo actualizar el estado.', 'danger')
  } finally {
    isUpdating.value = false
  }
}

const requestNextAction = async () => {
  const action = nextAction.value
  if (!action || isUpdating.value) return
  if (action.accion === 'cerrar') {
    confirmFinalization.value = true
    return
  }
  await runAction()
}

const finishFinalization = async () => {
  confirmFinalization.value = false
  if (nextAction.value?.accion === 'cerrar') await runAction()
}

const cargar = async () => {
  try {
    await incidentStore.fetchIncidents()
  } finally {
    primeraCarga.value = false
  }
}

const { refresh: refrescar } = useRealtimeRefresh(cargar)

const onRefresh = async (event: any) => {
  await refrescar()
  event.target.complete()
}

onIonViewWillEnter(() => { void refrescar() })

onIonViewDidEnter(() => {
  const fixMap = () => { if (map) map.invalidateSize(); };
  setTimeout(fixMap, 50);
  setTimeout(fixMap, 250);
  setTimeout(fixMap, 500);
})

onMounted(() => {
  obtenerUbicacionUsuario(); // Pedir ubicación al abrir la alerta
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
              <StatusBadge :state="envioEstado ?? incident.status" :tone="statusTone" />
            </div>
            <div v-if="nextAction" class="next-action-copy">
              <span>SIGUIENTE ACCIÓN</span>
              <strong>{{ nextAction.label }}</strong>
            </div>
            <div v-else-if="envioEstado === 'CERRADA'" class="next-action-copy">
              <span>Intervención finalizada</span>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
            <div class="info-grid">
              <div><span class="label"><ion-icon :icon="locationOutline" />DIRECCIÓN</span><strong>{{ direccion }}</strong></div>
              <div><span class="label"><ion-icon :icon="timeOutline" />DETECTADA</span><strong>{{ fechaHora(incident.createdAt) }}</strong></div>
              
              <!-- Muestra la distancia calculada en vivo o la del backend -->
              <div v-if="calculatedDistance || incident.distanceKm > 0">
                <span class="label"><ion-icon :icon="navigateOutline" />DISTANCIA</span>
                <strong style="color: #428cff;">{{ calculatedDistance || incident.distanceKm + ' km' }}</strong>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card v-if="tieneUbicacion">
          <ion-card-content class="map-card-content">
            <div ref="mapaEl" class="detalle-map"></div>
            <!-- Botón flotante para GPS -->
            <ion-button class="locate-btn" shape="round" color="light" @click="obtenerUbicacionUsuario">
              <ion-icon :icon="locateOutline"></ion-icon>
            </ion-button>
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

        <div class="bottom-spacer"></div>
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
      :color="toastColor"
      :duration="toastColor === 'danger' ? 4000 : 2600"
      @didDismiss="toastOpen = false"
    />
    <ConfirmDialog
      :open="confirmFinalization"
      message="¿Deseas finalizar la intervención de tu institución? Esta acción no se puede deshacer."
      confirm-text="Finalizar"
      @confirm="finishFinalization"
      @cancel="confirmFinalization = false"
    />
  </ion-page>
</template>

<style scoped>
.container {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 0px 16px; 
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

.map-card-content { position: relative; padding: 0 !important; }
.detalle-map {
  width: 100%;
  height: 250px !important;
  min-height: 250px;
  background: #e9e9e9;
  z-index: 1;
}
.locate-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 1000;
  margin: 0;
  --border-radius: 50%;
  width: 44px;
  height: 44px;
  --box-shadow: 0 4px 10px rgba(0,0,0,0.2);
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
.bottom-spacer { height: 100px; width: 100%; }

@media (max-width: 420px) {
  .info-grid { grid-template-columns: 1fr; }
}
</style>