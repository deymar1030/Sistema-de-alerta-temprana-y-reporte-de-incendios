<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButtons,
  IonModal, IonIcon, IonSpinner, onIonViewDidEnter
} from '@ionic/vue'
import {
  personCircleOutline, mailOutline, callOutline, shieldCheckmarkOutline
} from 'ionicons/icons'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { socket } from '../../services/realtime'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Geolocation } from '@capacitor/geolocation'
import { Camera } from '@capacitor/camera'

const router = useRouter()
const authStore = useAuthStore()
const API_URL = import.meta.env.VITE_API_URL || 'https://alertaincendios.duckdns.org/api'

const alertasCount = ref(0)
const reportesCount = ref(0)

let map: L.Map | null = null
let userMarker: L.CircleMarker | null = null
let watchId: string | null = null
let markersLayer = L.layerGroup()
let resizeObserver: ResizeObserver | null = null
let userLatLng: L.LatLngTuple | null = null
let alertPoints: L.LatLngTuple[] = []

// ---------- Utilidades ----------

const toNum = (v: any) => (v === null || v === undefined || v === '' ? NaN : Number(v))

// Una alerta NO guarda coordenadas propias: las toma de los reportes vinculados (REPORTE_U)
// y/o del predio del sensor (PREDIO). Esta función junta TODAS las ubicaciones de la alerta,
// aunque la API las devuelva anidadas (por ejemplo alerta.ubicaciones[0].latitud).
interface Ubicacion {
  coords: L.LatLngTuple
  origen: string // 'REPORTE' o 'PREDIO' (también se acepta 'SENSOR')
  prioridad?: string
  nombre?: string // nombre del predio, si lo trae
}

const buscarUbicaciones = (obj: any, nivel = 0, acc: Ubicacion[] = []): Ubicacion[] => {
  if (!obj || typeof obj !== 'object' || nivel > 4) return acc

  const lat = toNum(obj.latitud ?? obj.lat)
  const lng = toNum(obj.longitud ?? obj.lng ?? obj.lon)
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    acc.push({
      coords: [lat, lng],
      origen: String(obj.origen || '').toUpperCase(),
      prioridad: obj.nivel_prioridad || undefined,
      nombre: typeof obj.nombre === 'string' ? obj.nombre : undefined
    })
    return acc
  }

  // Formato GeoJSON: coordinates = [longitud, latitud]
  if (Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
    const gLng = toNum(obj.coordinates[0])
    const gLat = toNum(obj.coordinates[1])
    if (Number.isFinite(gLat) && Number.isFinite(gLng)) {
      acc.push({ coords: [gLat, gLng], origen: '' })
      return acc
    }
  }

  for (const [clave, valor] of Object.entries(obj)) {
    // La institución también tiene coordenadas, pero NO son las del incidente
    if (/instituci|usuario/i.test(clave)) continue
    buscarUbicaciones(valor, nivel + 1, acc)
  }
  return acc
}

// Quita ubicaciones repetidas (mismas coordenadas)
const quitarRepetidas = (lista: Ubicacion[]): Ubicacion[] => {
  const vistos = new Set<string>()
  return lista.filter((u) => {
    const clave = `${u.coords[0].toFixed(6)},${u.coords[1].toFixed(6)}`
    if (vistos.has(clave)) return false
    vistos.add(clave)
    return true
  })
}

const ubicacionesUnicas = (a: any): Ubicacion[] => quitarRepetidas(buscarUbicaciones(a))

// Ubicaciones de los reportes que tienen esta alerta como "alerta_vinculada"
const ubicacionesDesdeReportes = (idAlerta: any, reportes: any[]): Ubicacion[] => {
  const id = String(idAlerta)
  return reportes
    .filter((r) => String(r?.alerta_vinculada?.id_alerta ?? r?.alerta_vinculada ?? '') === id)
    .map((r): Ubicacion => ({
      coords: [toNum(r.latitud), toNum(r.longitud)],
      origen: 'REPORTE',
      prioridad: r.nivel_prioridad || undefined
    }))
    .filter((u) => Number.isFinite(u.coords[0]) && Number.isFinite(u.coords[1]))
}

// Encuadra el mapa para que se vean a la vez las alertas y tu ubicación
const ajustarVista = () => {
  if (!map) return
  const puntos: L.LatLngTuple[] = [...alertPoints]
  if (userLatLng) puntos.push(userLatLng)
  if (puntos.length === 0) return

  if (puntos.length === 1) {
    map.setView(puntos[0], 14)
  } else {
    map.fitBounds(L.latLngBounds(puntos), { padding: [40, 40], maxZoom: 16 })
  }
}

// ---------- Mapa ----------
const initMap = async () => {
  map = L.map('map-container').setView([-16.2902, -63.5887], 5)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 20
  }).addTo(map)

  markersLayer.addTo(map)

  const el = document.getElementById('map-container')
  if (el && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => map?.invalidateSize())
    resizeObserver.observe(el)
  }

  // watchPosition se queda esperando a que el GPS encienda y entregue coordenadas
  try {
    watchId = await Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 10000 }, (position, err) => {
      if (position) {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        userLatLng = [lat, lng]

        if (map) {
          // Si el punto azul ya existe, simplemente lo movemos
          if (userMarker) {
            userMarker.setLatLng([lat, lng])
          } else {
            // Si es la primera vez que el GPS responde, lo creamos y centramos
            userMarker = L.circleMarker([lat, lng], {
              color: '#ffffff', weight: 2, fillColor: '#3388ff', fillOpacity: 1, radius: 8
            }).bindPopup('<b>Tu ubicación actual</b>').addTo(map)
            
            ajustarVista()
          }
        }
      }
    })

    setTimeout(() => {
      if (map) map.invalidateSize()
    }, 300)
  } catch (error) {
    console.warn('Error iniciando GPS:', error)
  }
}

// ---------- Datos ----------

// Pide las alertas con sus ubicaciones (/alertas/mapa). Si el backend aún no tiene ese
// endpoint, usa /alertas/activas como respaldo para que la pantalla no se rompa.
const pedirAlertas = async () => {
  try {
    const conMapa = await fetch(`${API_URL}/alertas/mapa`, { credentials: 'include' })
    if (conMapa.ok) return conMapa
  } catch (error) {
    console.warn('/alertas/mapa no disponible, usando /alertas/activas', error)
  }
  return fetch(`${API_URL}/alertas/activas`, { credentials: 'include' })
}

const loadDashboardData = async () => {
  try {
    const [alertasRes, reportesRes] = await Promise.all([
      pedirAlertas(),
      fetch(`${API_URL}/reportes-usuario`, { credentials: 'include' })
    ])

    // Reportes (se leen primero para cruzarlos con las alertas)
    let reportes: any[] = []
    if (reportesRes.ok) {
      const reportesData = await reportesRes.json()
      reportes = Array.isArray(reportesData.data)
        ? reportesData.data
        : Array.isArray(reportesData)
          ? reportesData
          : (reportesData.data?.items ?? [])
      reportesCount.value = reportes.length
    }

    if (alertasRes.ok) {
      const alertasData = await alertasRes.json()
      const alertas = alertasData.data || alertasData || []
      alertasCount.value = alertas.length

      alertPoints = []
      markersLayer.clearLayers()

      alertas.forEach((alerta: any) => {
        const ubicaciones = quitarRepetidas([
          ...ubicacionesUnicas(alerta),
          ...ubicacionesDesdeReportes(alerta.id_alerta, reportes)
        ])
        if (ubicaciones.length === 0) {
          // Si ves este aviso, la alerta no trae coordenadas: falta devolverlas en la API
          console.warn('Alerta sin coordenadas reconocibles:', alerta)
          return
        }

        ubicaciones.forEach((u) => {
          alertPoints.push(u.coords)

          // Naranja = reporte ciudadano, rojo oscuro = sensor (predio)
          const esPredio = u.origen === 'PREDIO' || u.origen === 'SENSOR'
          const color = esPredio ? '#8E1B10' : '#F24A23'
          const origenTxt = esPredio
            ? `Detectada por sensor${u.nombre ? ' en ' + u.nombre : ''}`
            : u.origen === 'REPORTE' ? 'Reporte ciudadano' : ''

          L.circleMarker(u.coords, {
            radius: 11,
            color: '#ffffff',
            weight: 3,
            fillColor: color,
            fillOpacity: 1
          })
            .bindPopup(
              `<b>Alerta:</b> ${alerta.clasificacion || 'Activa'}` +
              (origenTxt ? `<br>${origenTxt}` : '') +
              (u.prioridad ? `<br>Prioridad: ${u.prioridad}` : '') +
              (alerta.descripcion ? `<br>${alerta.descripcion}` : '')
            )
            .addTo(markersLayer)
        })
      })

      ajustarVista()
    }

  } catch (error) {
    console.error('Error cargando dashboard', error)
  }
}

// ---------- Perfil ----------

const perfilAbierto = ref(false)
const perfilCargando = ref(false)
const perfilError = ref('')
const perfil = ref<any | null>(null)

const nombreCompleto = computed(() => {
  const p = perfil.value
  if (!p) return authStore.user?.name || 'Ciudadano'
  return [p.nombre, p.primer_apellido, p.segundo_apellido].filter(Boolean).join(' ')
})

const iniciales = computed(() => {
  const p = perfil.value
  const a = (p?.nombre || authStore.user?.name || 'C').trim().charAt(0)
  const b = (p?.primer_apellido || '').trim().charAt(0)
  return (a + b).toUpperCase()
})

const rolLegible = computed(() => {
  const rol = String(perfil.value?.nombre_rol || authStore.user?.roleLabel || 'CIUDADANO')
  return rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase()
})

const abrirPerfil = async () => {
  perfilAbierto.value = true
  perfilCargando.value = true
  perfilError.value = ''
  try {
    const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' })
    if (!res.ok) throw new Error('No se pudo cargar el perfil')
    const json = await res.json()
    perfil.value = json.data || json
  } catch (error) {
    console.error('Error cargando perfil', error)
    perfilError.value = 'No se pudieron cargar todos tus datos.'
  } finally {
    perfilCargando.value = false
  }
}

const cerrarSesionDesdePerfil = async () => {
  perfilAbierto.value = false
  await handleLogout()
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  // Pedir permisos generales nada más entrar al inicio
  try {
    let geo = await Geolocation.checkPermissions()
    if (geo.location !== 'granted') await Geolocation.requestPermissions()

    let cam = await Camera.checkPermissions()
    if (cam.camera !== 'granted') await Camera.requestPermissions()
  } catch (error) {
    console.warn('Error pidiendo permisos iniciales', error)
  }

  initMap()
  loadDashboardData()

  socket.on('alerta:abierta', loadDashboardData)
  socket.on('alerta:actualizada', loadDashboardData)
  socket.on('alerta:confirmada', loadDashboardData)
  socket.on('alerta:descartada', loadDashboardData)
  socket.on('notificacion:reporte-ciudadano', loadDashboardData)
  socket.on('connect', loadDashboardData)
})

onUnmounted(() => {
  if (watchId) {
    Geolocation.clearWatch({ id: watchId })
    watchId = null
  }
  
  resizeObserver?.disconnect()
  resizeObserver = null
  
  if (map) {
    map.remove()
    map = null
  }
  
  socket.off('alerta:abierta', loadDashboardData)
  socket.off('alerta:actualizada', loadDashboardData)
  socket.off('alerta:confirmada', loadDashboardData)
  socket.off('alerta:descartada', loadDashboardData)
  socket.off('notificacion:reporte-ciudadano', loadDashboardData)
  socket.off('connect', loadDashboardData)
})
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Inicio ciudadano</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="abrirPerfil" color="medium" aria-label="Mi perfil">
            <ion-icon slot="icon-only" :icon="personCircleOutline"></ion-icon>
          </ion-button>
          <ion-button @click="handleLogout" color="medium" class="logout-btn">SALIR</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dashboard-content">
      <div class="greeting-section">
        <h2>Hola, {{ authStore.user?.name || 'Ciudadano' }}</h2>
      </div>

      <div class="stats-grid">
        <ion-card class="stat-card">
          <ion-card-header>
            <ion-card-title>Alertas activas</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <span class="stat-number">{{ alertasCount }}</span>
          </ion-card-content>
        </ion-card>

        <ion-card class="stat-card">
          <ion-card-header>
            <ion-card-title>Reportes</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <span class="stat-number">{{ reportesCount }}</span>
          </ion-card-content>
        </ion-card>
      </div>

      <ion-card class="map-card">
        <ion-card-header>
          <ion-card-title>Mapa de alertas</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div id="map-container" class="map-placeholder"></div>
        </ion-card-content>
      </ion-card>
    </ion-content>

    <!-- Perfil del usuario -->
    <ion-modal
      :is-open="perfilAbierto"
      :initial-breakpoint="0.7"
      :breakpoints="[0, 0.7, 1]"
      @didDismiss="perfilAbierto = false"
    >
      <ion-content class="perfil-content">
        <div class="perfil-wrap">
          <div class="perfil-avatar">{{ iniciales }}</div>
          <h2 class="perfil-nombre">{{ nombreCompleto }}</h2>
          <span class="perfil-rol">{{ rolLegible }}</span>

          <div v-if="perfilCargando" class="perfil-cargando">
            <ion-spinner name="crescent"></ion-spinner>
          </div>

          <template v-else>
            <p v-if="perfilError" class="perfil-error">{{ perfilError }}</p>

            <div v-if="perfil" class="perfil-lista">
              <div class="perfil-fila">
                <ion-icon :icon="mailOutline"></ion-icon>
                <div>
                  <span class="perfil-etiqueta">Correo electrónico</span>
                  <strong>{{ perfil.correo || 'No registrado' }}</strong>
                </div>
              </div>
              <div class="perfil-fila">
                <ion-icon :icon="callOutline"></ion-icon>
                <div>
                  <span class="perfil-etiqueta">Teléfono</span>
                  <strong>{{ perfil.telefono || 'No registrado' }}</strong>
                </div>
              </div>
              <div class="perfil-fila">
                <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
                <div>
                  <span class="perfil-etiqueta">Tipo de cuenta</span>
                  <strong>{{ rolLegible }}</strong>
                </div>
              </div>
            </div>
          </template>

          <ion-button expand="block" fill="outline" color="medium" class="perfil-salir" @click="cerrarSesionDesdePerfil">
            Cerrar sesión
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<style scoped>
.dashboard-content {
  --background: var(--alerta-canvas, #f4f5f8);
}

/* El contenido ocupa toda la pantalla: el mapa se estira para llenar el espacio libre */
.dashboard-content::part(scroll) {
  display: flex;
  flex-direction: column;
}

.logout-btn {
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.05em;
}

.greeting-section {
  flex: none;
  padding: 24px 20px 16px;
}

.greeting-section h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--alerta-ink, #222);
  margin: 0 0 6px 0;
}

.stats-grid {
  flex: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 16px;
}

.stat-card {
  margin: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-radius: 8px;
}

.stat-card ion-card-header {
  padding: 16px 16px 8px;
}

.stat-card ion-card-title {
  font-size: 13px;
  color: var(--alerta-muted, #666);
  font-weight: 600;
}

.stat-card ion-card-content {
  padding: 0 16px 16px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--alerta-ink, #222);
}

/* Tarjeta del mapa: crece para ocupar el espacio restante de cualquier celular */
.map-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 320px;
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-radius: 8px;
}

.map-card ion-card-header {
  flex: none;
  padding: 16px;
}

.map-card ion-card-title {
  font-size: 18px;
  color: var(--alerta-ink, #222);
  font-weight: 600;
}

.map-card ion-card-content {
  flex: 1;
  display: flex;
  padding: 0 16px 16px;
}

.map-placeholder {
  flex: 1;
  width: 100%;
  min-height: 240px;
  border-radius: 8px;
  background-color: #e9e9e9;
  overflow: hidden;
  position: relative;
  z-index: 1; /* Previene superposiciones en móviles */
}
/* ----- Perfil ----- */
.perfil-content {
  --background: #ffffff;
}

.perfil-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 24px 32px;
}

.perfil-avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: rgba(242, 74, 35, 0.12);
  color: var(--alerta-brand, #F24A23);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
}

.perfil-nombre {
  margin: 14px 0 6px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--alerta-ink, #1c2b45);
}

.perfil-rol {
  padding: 4px 12px;
  border-radius: 999px;
  background: #f1f3f6;
  font-size: 12px;
  font-weight: 600;
  color: #6b7587;
}

.perfil-cargando {
  padding: 28px 0;
}

.perfil-error {
  margin: 16px 0 0;
  font-size: 13px;
  color: #c4574f;
  text-align: center;
}

.perfil-lista {
  width: 100%;
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.perfil-fila {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 4px;
  border-bottom: 1px solid #eef0f3;
}

.perfil-fila ion-icon {
  flex: none;
  font-size: 22px;
  color: var(--alerta-brand, #F24A23);
}

.perfil-fila > div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.perfil-etiqueta {
  font-size: 12px;
  color: #8a94a6;
}

.perfil-fila strong {
  font-size: 15px;
  font-weight: 600;
  color: var(--alerta-ink, #1c2b45);
  overflow-wrap: anywhere;
}

.perfil-salir {
  width: 100%;
  margin-top: 28px;
  --border-radius: 14px;
  height: 48px;
  text-transform: none;
}
</style>