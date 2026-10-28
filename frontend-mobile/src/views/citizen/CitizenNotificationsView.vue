<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonRefresher, IonRefresherContent, IonIcon, IonSpinner, IonBadge,
  onIonViewWillEnter
} from '@ionic/vue'
import {
  notificationsOutline, timeOutline, alertCircleOutline, flameOutline, locationOutline
} from 'ionicons/icons'
import { Geolocation } from '@capacitor/geolocation'
import { socket } from '../../services/realtime'

// ---------- Tipos ----------

interface Notificacion {
  id_notificacion: number
  titulo: string
  mensaje: string
  fecha_hora: string
  leida: boolean
}

interface AlertaVista {
  id: string
  clasificacion: string
  fechaHora: string
  coords: [number, number] | null
  distanciaKm: number | null
  lugar: string
  buscandoLugar: boolean
}

const API_URL = import.meta.env.VITE_API_URL || 'https://alertaincendios.duckdns.org/api'

const notificaciones = ref<Notificacion[]>([])
const alertas = ref<AlertaVista[]>([])
const isLoading = ref(true)
const errorMsg = ref('')

const toNum = (v: any) => (v === null || v === undefined || v === '' ? NaN : Number(v))

// ---------- Distancia ----------

const distanciaKm = (a: [number, number], b: [number, number]) => {
  const R = 6371
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLng = rad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const formatearDistancia = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`

// Ubicación del usuario (si no hay permiso o GPS, simplemente no se muestra la distancia)
const obtenerPosicionUsuario = async (): Promise<[number, number] | null> => {
  try {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 60000
    })
    return [pos.coords.latitude, pos.coords.longitude]
  } catch {
    return null
  }
}

// ---------- Dirección (calle) a partir de coordenadas ----------

const CLAVE_CACHE = 'alerta_geo_cache'
const cacheDirecciones = new Map<string, string>()

try {
  const guardado = localStorage.getItem(CLAVE_CACHE)
  if (guardado) Object.entries(JSON.parse(guardado)).forEach(([k, v]) => cacheDirecciones.set(k, String(v)))
} catch { /* sin caché guardada */ }

const guardarCache = () => {
  try {
    localStorage.setItem(CLAVE_CACHE, JSON.stringify(Object.fromEntries(cacheDirecciones)))
  } catch { /* ignorar */ }
}

const direccionDesdeCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}` +
      `&zoom=18&addressdetails=1&accept-language=es`
    const res = await fetch(url)
    if (!res.ok) return ''
    const data = await res.json()
    const ad = data.address || {}
    const calle = ad.road || ad.pedestrian || ad.residential || ''
    const zona = ad.neighbourhood || ad.suburb || ad.quarter || ad.city_district || ''
    const texto = [calle, zona].filter(Boolean).join(', ')
    if (texto) return texto
    return data.display_name ? String(data.display_name).split(',').slice(0, 2).join(',').trim() : ''
  } catch {
    return ''
  }
}

let cicloLugares = 0

// Completa la calle de cada alerta, de a una (el servicio gratuito pide ~1 consulta por segundo)
const completarLugares = async () => {
  const ciclo = ++cicloLugares
  for (const a of alertas.value) {
    if (!a.coords || a.lugar) continue
    if (ciclo !== cicloLugares) return

    const clave = `${a.coords[0].toFixed(4)},${a.coords[1].toFixed(4)}`
    const enCache = cacheDirecciones.get(clave)
    if (enCache) {
      a.lugar = enCache
      continue
    }

    a.buscandoLugar = true
    const lugar = await direccionDesdeCoords(a.coords[0], a.coords[1])
    a.buscandoLugar = false
    if (lugar) {
      a.lugar = lugar
      cacheDirecciones.set(clave, lugar)
      guardarCache()
    }
    await new Promise((r) => setTimeout(r, 1100))
  }
}

// ---------- Textos de la alerta ----------

const tituloAlerta = (a: AlertaVista) => {
  const tipo = (a.clasificacion || 'incendio').toLowerCase()
  return `Alerta de ${tipo}`
}

const lineaLugar = (a: AlertaVista) => {
  if (a.lugar) return a.lugar
  if (a.buscandoLugar) return 'Buscando dirección...'
  return a.coords ? 'Ubicación en el mapa' : 'Ubicación no disponible'
}

const mensajeAlerta = (a: AlertaVista) => {
  const lugar = a.lugar ? `en ${a.lugar}` : 'en tu zona'
  const km = a.distanciaKm

  if (km === null) {
    return `Se reportó un incendio ${lugar}. Evita esa zona y deja libre el paso a bomberos y ambulancias.`
  }
  if (km < 1) {
    return `El incendio está muy cerca de ti, ${lugar}. Aléjate del lugar, evita esa calle y sigue las indicaciones de las autoridades.`
  }
  if (km <= 3) {
    return `Hay un incendio cerca de ti, ${lugar}. Ten cuidado y evita transitar por esa zona.`
  }
  return `Hay un incendio ${lugar}. Evita esa zona y busca rutas alternativas si vas a pasar por ahí.`
}

const formatearFecha = (fechaISO: string) => {
  const fecha = new Date(fechaISO)
  if (isNaN(fecha.getTime())) return ''
  return fecha.toLocaleString('es-BO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

// ---------- Carga de datos ----------

const pedirAlertas = async () => {
  try {
    const conMapa = await fetch(`${API_URL}/alertas/mapa`, { credentials: 'include' })
    if (conMapa.ok) return conMapa
  } catch (error) {
    console.warn('/alertas/mapa no disponible, usando /alertas/activas', error)
  }
  return fetch(`${API_URL}/alertas/activas`, { credentials: 'include' })
}

const cargarAlertas = async () => {
  try {
    const res = await pedirAlertas()
    if (!res.ok) throw new Error('Error al cargar alertas')
    const json = await res.json()
    const lista: any[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []

    const usuario = await obtenerPosicionUsuario()

    const vistas: AlertaVista[] = lista.map((a: any) => {
      const u = (a.ubicaciones || []).find(
        (x: any) => Number.isFinite(toNum(x?.latitud)) && Number.isFinite(toNum(x?.longitud))
      )
      const coords: [number, number] | null = u ? [toNum(u.latitud), toNum(u.longitud)] : null
      return {
        id: String(a.id_alerta),
        clasificacion: a.clasificacion || 'INCENDIO',
        fechaHora: a.fecha && a.hora ? `${a.fecha}T${a.hora}` : '',
        coords,
        distanciaKm: coords && usuario ? distanciaKm(usuario, coords) : null,
        lugar: '',
        buscandoLugar: false
      }
    })

    // Primero las más cercanas; si no hay distancia, las más recientes
    vistas.sort((x, y) => {
      if (x.distanciaKm !== null && y.distanciaKm !== null) return x.distanciaKm - y.distanciaKm
      return y.fechaHora.localeCompare(x.fechaHora)
    })

    alertas.value = vistas
    completarLugares()
  } catch (error) {
    console.error('Error obteniendo alertas:', error)
    alertas.value = []
  }
}

const cargarNotificaciones = async () => {
  errorMsg.value = ''
  try {
    const response = await fetch(`${API_URL}/notificaciones`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })

    if (!response.ok) throw new Error('Error al conectar con el servidor')

    const result = await response.json()
    notificaciones.value = result.data
  } catch (error: any) {
    console.error('Error obteniendo notificaciones:', error)
    errorMsg.value = 'No se pudieron cargar las notificaciones en este momento.'
  }
}

const cargarTodo = async (event?: any) => {
  await Promise.all([cargarAlertas(), cargarNotificaciones()])
  isLoading.value = false
  event?.target?.complete?.()
}

// Se actualiza cada vez que entras a esta pestaña
onIonViewWillEnter(() => {
  cargarTodo()
})

// Y en tiempo real cuando el servidor avisa de cambios
const eventos = ['alerta:abierta', 'alerta:actualizada', 'alerta:confirmada', 'alerta:descartada']
eventos.forEach((e) => socket.on(e, cargarTodo))

onUnmounted(() => {
  eventos.forEach((e) => socket.off(e, cargarTodo))
})
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title style="color: #333;">Notificaciones</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="notificaciones-content">
      <!-- Gesto de arrastrar para actualizar -->
      <ion-refresher slot="fixed" @ionRefresh="cargarTodo">
        <ion-refresher-content
          pulling-text="Desliza para actualizar"
          refreshing-spinner="circles">
        </ion-refresher-content>
      </ion-refresher>

      <!-- Estado de carga -->
      <div v-if="isLoading" class="estado-centro">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Cargando alertas...</p>
      </div>

      <div v-else class="contenido">
        <!-- ALERTAS ACTIVAS -->
        <h2 class="seccion-titulo">Alertas activas</h2>

        <div v-if="alertas.length === 0" class="vacio-inline">
          No hay alertas activas en este momento.
        </div>

        <ion-card
          v-for="a in alertas"
          :key="a.id"
          class="alerta-card"
          :class="{ cercana: a.distanciaKm !== null && a.distanciaKm <= 1 }"
        >
          <ion-card-content>
            <div class="alerta-top">
              <div class="alerta-icono">
                <ion-icon :icon="flameOutline"></ion-icon>
              </div>
              <div class="alerta-textos">
                <h3 class="alerta-titulo">{{ tituloAlerta(a) }}</h3>
                <p class="alerta-lugar">
                  <ion-icon :icon="locationOutline"></ion-icon>
                  {{ lineaLugar(a) }}
                </p>
              </div>
            </div>

            <p class="alerta-mensaje">{{ mensajeAlerta(a) }}</p>

            <div class="alerta-meta">
              <span v-if="a.distanciaKm !== null" class="chip chip-distancia">
                A {{ formatearDistancia(a.distanciaKm) }} de ti
              </span>
              <span v-if="a.fechaHora" class="chip">
                <ion-icon :icon="timeOutline"></ion-icon>
                {{ formatearFecha(a.fechaHora) }}
              </span>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- MIS NOTIFICACIONES -->
        <h2 class="seccion-titulo">Mis notificaciones</h2>

        <div v-if="errorMsg" class="estado-inline">
          <ion-icon :icon="alertCircleOutline" class="icono-medio"></ion-icon>
          <p>{{ errorMsg }}</p>
        </div>

        <div v-else-if="notificaciones.length === 0" class="estado-inline">
          <ion-icon :icon="notificationsOutline" class="icono-medio"></ion-icon>
          <p>No tienes notificaciones recientes.</p>
        </div>

        <template v-else>
          <ion-card
            v-for="notificacion in notificaciones"
            :key="notificacion.id_notificacion"
            class="notificacion-card"
            :class="{ 'no-leida': !notificacion.leida }"
          >
            <ion-card-header class="card-header">
              <div class="header-top">
                <ion-card-title class="card-title">
                  {{ notificacion.titulo }}
                </ion-card-title>
                <ion-badge v-if="!notificacion.leida" color="danger">Nueva</ion-badge>
              </div>
            </ion-card-header>

            <ion-card-content class="card-content">
              <p class="mensaje">{{ notificacion.mensaje }}</p>
              <div class="fecha-container">
                <ion-icon :icon="timeOutline"></ion-icon>
                <span>{{ formatearFecha(notificacion.fecha_hora) }}</span>
              </div>
            </ion-card-content>
          </ion-card>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.notificaciones-content {
  --background: #f8f9fa;
}

.contenido {
  padding: 8px 16px 24px;
}

.seccion-titulo {
  margin: 16px 4px 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--alerta-ink, #1c2b45);
}

.estado-centro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60%;
  color: #888;
  text-align: center;
  padding: 20px;
}

.vacio-inline {
  padding: 14px 16px;
  margin-bottom: 8px;
  background: #ffffff;
  border-radius: 12px;
  font-size: 13px;
  color: #8a94a6;
}

.estado-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  color: #8a94a6;
  text-align: center;
  font-size: 13px;
}

.icono-medio {
  font-size: 40px;
  color: #ccc;
  margin-bottom: 6px;
}

/* ----- Tarjeta de alerta ----- */
.alerta-card {
  margin: 0 0 14px 0;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border-left: 4px solid var(--alerta-brand, #F24A23);
}

.alerta-card.cercana {
  background: #fff4ef;
}

.alerta-card ion-card-content {
  padding: 16px;
}

.alerta-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.alerta-icono {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(242, 74, 35, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--alerta-brand, #F24A23);
  font-size: 22px;
}

.alerta-textos {
  min-width: 0;
}

.alerta-titulo {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--alerta-ink, #1c2b45);
}

.alerta-lugar {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 3px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}

.alerta-mensaje {
  margin: 12px 0 10px;
  font-size: 14px;
  line-height: 1.5;
  color: #555;
}

.alerta-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f1f3f6;
  font-size: 12px;
  font-weight: 500;
  color: #6b7587;
}

.chip-distancia {
  background: rgba(242, 74, 35, 0.12);
  color: var(--alerta-brand, #F24A23);
  font-weight: 700;
}

/* ----- Notificaciones (bandeja) ----- */
.notificacion-card {
  margin: 0 0 16px 0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  background: white;
  border-left: 4px solid transparent;
  transition: background 0.3s;
}

.notificacion-card.no-leida {
  border-left-color: var(--alerta-brand, #F24A23);
  background: var(--alerta-orange-soft, #fdf5f0);
}

.card-header {
  padding: 16px 16px 8px 16px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #333;
}

.card-content {
  padding: 0 16px 16px 16px;
}

.mensaje {
  font-size: 14px;
  color: #555;
  line-height: 1.4;
  margin-bottom: 12px;
}

.fecha-container {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
  font-weight: 500;
}
</style>