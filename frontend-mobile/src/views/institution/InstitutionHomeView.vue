<script setup lang="ts">
import { 
  IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, 
  IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, onIonViewDidEnter, IonToast 
} from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'
import { 
  alertCircleOutline, arrowForwardOutline, checkmarkCircleOutline, flameOutline, 
  locationOutline, personOutline, shieldCheckmarkOutline, timeOutline, logOutOutline, 
  alertOutline, locateOutline 
} from 'ionicons/icons'
import { useRouter } from 'vue-router'
import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import IncidentCard from '../../components/common/IncidentCard.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import { useIncidentStore } from '../../stores/incident.store'
import { useInstitutionAlertStore } from '../../stores/institution-alert.store'
import { useAuthStore } from '../../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const incidentStore = useIncidentStore()
const alertStore = useInstitutionAlertStore()

const nombreInstitucion = ref('Cargando...')
const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null

// Estados del Toast para alertas de GPS
const toastOpen = ref(false)
const toastMessage = ref('')
const toastColor = ref<'success' | 'warning' | 'danger'>('success')

const showToast = (msg: string, color: 'success' | 'warning' | 'danger') => {
  toastMessage.value = msg
  toastColor.value = color
  toastOpen.value = true
}

// Estados del mapa
const mapAlerts = ref<any[]>([])
const assignedAlertIds = ref<Set<string>>(new Set())
const userLocation = ref<{ lat: number, lng: number } | null>(null)

// Computados
const alertsPending = computed(() => alertStore.alerts.filter((item) => item.status !== 'FINALIZADA').length)
const alertsToday = computed(() => alertStore.alerts.filter((item) => item.status === 'FINALIZADA').length)

const alertaAsignadaPropia = computed(() => {
  return mapAlerts.value.find(a => assignedAlertIds.value.has(a.id_alerta.toString()));
})

const onLogout = async () => {
  await authStore.logout()
  router.replace('/auth/login')
}

// 1. Obtener la ubicación del usuario (GPS Nativo)
const obtenerUbicacionUsuario = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Pedir permisos en Android/iOS
      let permisos = await Geolocation.checkPermissions();
      if (permisos.location !== 'granted') {
        permisos = await Geolocation.requestPermissions();
      }
      if (permisos.location !== 'granted') {
        showToast('Permiso de GPS denegado. Ve a los ajustes para habilitarlo.', 'danger');
        return;
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });

    userLocation.value = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    
    dibujarMapa(); // Redibujamos para incluir el punto azul
    
    // Si el usuario tocó el botón manualmente, centramos el mapa en él
    if (mapInstance && userLocation.value) {
      mapInstance.setView([userLocation.value.lat, userLocation.value.lng], 16);
    }
  } catch (error: any) {
    console.error('Error GPS:', error);
    showToast('Activa el GPS de tu dispositivo para ver tu ubicación.', 'warning');
  }
}

// 2. Obtener los datos del backend
const obtenerDatosInstitucionYMapa = async () => {
  try {
    const meResponse = await fetch('https://alertaincendios.duckdns.org/api/auth/me', { credentials: 'include' });
    const meData = await meResponse.json();
    
    if (meData.success && meData.data.id_institucion) {
      const idInst = meData.data.id_institucion;
      
      const instResponse = await fetch(`https://alertaincendios.duckdns.org/api/instituciones/${idInst}`, { credentials: 'include' });
      const instData = await instResponse.json();
      nombreInstitucion.value = instData.success && instData.data.nombre ? instData.data.nombre : `Institución #${idInst}`;

      const asigRes = await fetch('https://alertaincendios.duckdns.org/api/notificaciones/asignaciones', { credentials: 'include' });
      const asigData = await asigRes.json();
      if (asigData.success && asigData.data) {
        assignedAlertIds.value = new Set(asigData.data.map((a: any) => a.id_alerta.toString()));
      }

      const mapRes = await fetch(`https://alertaincendios.duckdns.org/api/alertas/mapa?id_institucion=${idInst}`, { credentials: 'include' });
      const mapResData = await mapRes.json();
      if (mapResData.success && mapResData.data) {
        mapAlerts.value = mapResData.data;
        dibujarMapa();
      }
    }
  } catch (error) {
    console.error('Error al obtener datos', error);
    nombreInstitucion.value = 'Mi Institución'; 
  }
}

const dibujarMapa = () => {
  if (!mapContainer.value) return;
  
  if (!mapInstance) {
    mapInstance = L.map(mapContainer.value, { zoomControl: false }); // Quitamos el control de zoom por defecto para que no estorbe al botón
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(mapInstance);
    L.control.zoom({ position: 'topleft' }).addTo(mapInstance);

    if ('ResizeObserver' in window) {
      const observador = new ResizeObserver(() => {
        mapInstance?.invalidateSize();
      });
      observador.observe(mapContainer.value);
    }
  } else {
    mapInstance.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) mapInstance?.removeLayer(layer);
    });
  }

  const markers: L.CircleMarker[] = [];
  const groups: Record<string, any[]> = {};

  // Agrupar alertas
  mapAlerts.value.forEach(alerta => {
    if (!alerta.ubicaciones || alerta.ubicaciones.length === 0) return;
    const lat = alerta.ubicaciones[0].latitud;
    const lng = alerta.ubicaciones[0].longitud;
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    
    if (!groups[key]) groups[key] = [];
    if (assignedAlertIds.value.has(alerta.id_alerta.toString())) {
      groups[key].unshift(alerta);
    } else {
      groups[key].push(alerta);
    }
  });

  // Dibujar Alertas
  const radiusOffset = 0.00035;
  Object.values(groups).forEach(group => {
    group.forEach((alerta, index) => {
      let finalLat = alerta.ubicaciones[0].latitud;
      let finalLng = alerta.ubicaciones[0].longitud;
      
      if (group.length > 1 && index > 0) {
        const angle = (2 * Math.PI * index) / (group.length - 1);
        finalLat += radiusOffset * Math.cos(angle);
        finalLng += radiusOffset * Math.sin(angle);
      }

      const isAssigned = assignedAlertIds.value.has(alerta.id_alerta.toString());
      
      const marker = L.circleMarker([finalLat, finalLng], {
        radius: isAssigned ? 13 : 10,
        fillColor: isAssigned ? '#d9382e' : '#f5b800',
        color: '#ffffff',
        weight: isAssigned ? 3 : 2,
        fillOpacity: 1
      }).addTo(mapInstance!);

      marker.bindPopup(`
        <div style="font-family: sans-serif; text-align: center;">
          <strong style="font-size: 14px; color: #111;">Alerta #${alerta.id_alerta}</strong><br>
          ${isAssigned ? '<span style="background: #fdeeee; color: #d9382e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-top:4px; display:inline-block;">ASIGNADA A TI</span><br>' : ''}
          <span style="font-size: 12px; color: #666; margin-top:4px; display:block;">${alerta.clasificacion}</span>
        </div>
      `);
      markers.push(marker);
    });
  });

  // Dibujar Ubicación del Usuario (Punto Azul)
  if (userLocation.value) {
    const userMarker = L.circleMarker([userLocation.value.lat, userLocation.value.lng], {
      radius: 9,
      fillColor: '#428cff', // Azul Ionic
      color: '#ffffff',
      weight: 3,
      fillOpacity: 1
    }).addTo(mapInstance);
    
    userMarker.bindPopup(`
      <div style="text-align: center; font-family: sans-serif;">
        <strong style="font-size: 13px; color: #111;">Mi Ubicación</strong>
      </div>
    `);
    markers.push(userMarker);
  }

  // Ajustar la vista si hay elementos, si no, centrar en La Paz
  if (markers.length > 0 && !userLocation.value) {
    const group = new L.FeatureGroup(markers);
    mapInstance.fitBounds(group.getBounds(), { padding: [20, 20], maxZoom: 16 });
  } else if (!userLocation.value) {
    mapInstance.setView([-16.5000, -68.1500], 13);
  }

  setTimeout(() => { mapInstance?.invalidateSize(); }, 400);
}

onIonViewDidEnter(() => {
  if (mapInstance) mapInstance.invalidateSize();
})

onMounted(async () => {
  obtenerDatosInstitucionYMapa();
  obtenerUbicacionUsuario(); // Llamamos al GPS al montar la vista
  await Promise.all([incidentStore.fetchIncidents(), alertStore.fetchAlerts()]);
})
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-title>Inicio</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onLogout" color="danger">
            Salir<ion-icon slot="end" :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content scroll-y>
      <div class="container">
        <div class="brand">ALERTA</div>
        <h1>{{ nombreInstitucion }}</h1>
        <p class="subtitle"><ion-icon :icon="personOutline" aria-hidden="true" />{{ authStore.user?.name ?? 'Usuario institucional' }}</p>
        
        <!-- MAPA DE ALERTAS INSTITUCIONALES -->
        <ion-card class="map-card">
          <ion-card-header class="map-header">
            <div class="map-title">MAPA DE ALERTAS</div>
            <div class="map-legend">
              <span class="legend-item"><span class="dot blue"></span>Tú</span>
              <span class="legend-item"><span class="dot red"></span>Asignadas</span>
              <span class="legend-item"><span class="dot yellow"></span>Otras</span>
            </div>
          </ion-card-header>
          <ion-card-content class="map-content">
            <div id="map" ref="mapContainer" class="leaflet-map"></div>
            
            <!-- Botón flotante para ubicar al usuario -->
            <ion-button class="locate-btn" shape="round" color="light" @click="obtenerUbicacionUsuario">
              <ion-icon :icon="locateOutline"></ion-icon>
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- BANNER INTELIGENTE: TIENES UNA ALERTA ASIGNADA -->
        <ion-card 
          v-if="alertaAsignadaPropia" 
          class="assignment-banner" 
          :class="alertaAsignadaPropia.mi_envio?.estado === 'ENVIADA' ? 'rojo' : 'verde'"
          @click="router.push(`/institucion/emergencia/${alertaAsignadaPropia.id_alerta}`)"
        >
          <ion-card-content class="banner-content">
            <div class="banner-icon">
              <ion-icon :icon="alertaAsignadaPropia.mi_envio?.estado === 'ENVIADA' ? alertOutline : checkmarkCircleOutline" />
            </div>
            <div class="banner-text">
              <span class="banner-label">
                {{ alertaAsignadaPropia.mi_envio?.estado === 'ENVIADA' ? 'TIENES UNA ALERTA ASIGNADA' : 'YA CONFIRMASTE ESTA ALERTA' }}
              </span>
              <strong class="banner-action">Toca para ver el detalle</strong>
            </div>
            <ion-icon :icon="arrowForwardOutline" class="banner-arrow" />
          </ion-card-content>
        </ion-card>

        <ion-card class="status-card hero-card">
          <ion-card-content>
            <div class="status-row">
              <div class="status-copy">
                <span class="icon-circle green-circle"><ion-icon :icon="checkmarkCircleOutline" /></span>
                <div><span class="status-label">Estado actual</span><strong class="status-state">Listo para atender</strong></div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <div class="summary-grid">
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="icon-circle yellow-circle"><ion-icon :icon="alertCircleOutline" /></span>
              <p class="summary-label">Alertas pendientes</p>
              <h2>{{ alertsPending }}</h2>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="icon-circle red-circle"><ion-icon :icon="flameOutline" /></span>
              <p class="summary-label">Emergencias activas</p>
              <h2>{{ incidentStore.pendingIncidents().length }}</h2>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="icon-circle green-circle"><ion-icon :icon="shieldCheckmarkOutline" /></span>
              <p class="summary-label">Atendidas hoy</p>
              <h2>{{ alertsToday }}</h2>
            </ion-card-content>
          </ion-card>
        </div>

        <div class="section-block">
          <div class="section-title">Intervenciones recientes</div>
          <LoadingSpinner v-if="incidentStore.isLoading" />
          <EmptyState v-else-if="incidentStore.incidents.length === 0" title="Sin emergencias" message="Las nuevas intervenciones aparecerán aquí." />
          <template v-else>
            <IncidentCard v-for="incident in incidentStore.incidents.slice(0, 2)" :key="incident.id" :incident="incident" />
          </template>
        </div>
      </div>
    </ion-content>

    <!-- TOAST PARA AVISOS DE GPS -->
    <ion-toast
      :is-open="toastOpen"
      :message="toastMessage"
      :color="toastColor"
      :duration="3500"
      @didDismiss="toastOpen = false"
    />
  </ion-page>
</template>

<style scoped>
.container { padding: 20px 16px; max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; }
.brand { color: var(--alerta-orange, #f24a23); font-weight: 800; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
.container > h1 { margin-top: 0; font-size: 26px; font-weight: 700; color: #111; }
.subtitle { display: flex; align-items: center; gap: 6px; margin-top: 5px; color: var(--alerta-muted, #666); font-size: 14px; }
.subtitle ion-icon { font-size: 16px; }

/* Mapa */
.map-card { margin: 16px 0 0 0; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); flex: 1 1 auto; display: flex; flex-direction: column; overflow: hidden; }
.map-header { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; background: #fff; z-index: 2; }
.map-title { font-size: 11px; font-weight: 800; color: #111; text-transform: uppercase; }
.map-legend { display: flex; gap: 8px; font-size: 9px; color: #666; font-weight: 600; text-transform: uppercase; }
.legend-item { display: flex; align-items: center; gap: 4px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.red { background: #d9382e; border: 1px solid #fff; box-shadow: 0 0 0 1px #d9382e; }
.dot.yellow { background: #f5b800; border: 1px solid #fff; box-shadow: 0 0 0 1px #f5b800; }
.dot.blue { background: #428cff; border: 1px solid #fff; box-shadow: 0 0 0 1px #428cff; }

/* Botón de Ubicación y Contenedor del Mapa */
.map-content { position: relative; padding: 0 !important; display: flex; flex-direction: column; flex: 1; }
.leaflet-map { width: 100%; height: 320px !important; min-height: 320px; z-index: 1; }
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

/* Banner de Asignación */
.assignment-banner { margin: 16px 0 0 0; border-radius: 12px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.assignment-banner:active { transform: scale(0.98); }
.assignment-banner.rojo { border-left: 5px solid #d9382e; }
.assignment-banner.rojo .banner-icon { background: #fdeeee; color: #d9382e; }
.assignment-banner.rojo .banner-arrow { color: #d9382e; }
.assignment-banner.verde { border-left: 5px solid #108e41; }
.assignment-banner.verde .banner-icon { background: #e6f6eb; color: #108e41; }
.assignment-banner.verde .banner-arrow { color: #108e41; }
.banner-content { display: flex; align-items: center; gap: 12px; padding: 16px; }
.banner-icon { padding: 8px; border-radius: 50%; display: flex; font-size: 20px; }
.banner-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.banner-label { font-size: 10px; font-weight: 800; color: #666; text-transform: uppercase; }
.banner-action { font-size: 15px; font-weight: 700; color: #111; }
.banner-arrow { font-size: 20px; }

/* Resto UI */
.status-card { margin-top: 16px; margin-inline: 0; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.status-copy { display: flex; align-items: center; gap: 12px; }
.status-copy > div { display: grid; gap: 2px; }
.green-circle { background: #e6f6eb; color: #108e41; padding: 10px; border-radius: 50%; display: flex; font-size: 24px; }
.yellow-circle { background: #fdf5e2; color: #b8860b; padding: 10px; border-radius: 50%; display: flex; font-size: 24px; }
.red-circle { background: #fdeeee; color: #d9382e; padding: 10px; border-radius: 50%; display: flex; font-size: 24px; }
.status-label { color: var(--alerta-muted, #666); font-size: 11px; font-weight: 700; text-transform: uppercase; }
.status-state { color: #111; font-size: 15px; font-weight: 700; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 16px; }
.summary-grid ion-card { margin: 0; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.metric-card ion-card-content { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 16px; }
.summary-label { margin: 0; color: var(--alerta-muted, #666); font-size: 11px; font-weight: 700; text-transform: uppercase; line-height: 1.3; }
.summary-grid h2 { margin: 0; font-size: 28px; font-weight: 700; color: #111; line-height: 1; }
.section-block { display: grid; gap: 12px; margin-top: 24px; }
.section-title { font-size: 16px; font-weight: 700; color: #111; margin-bottom: 4px; }
</style>