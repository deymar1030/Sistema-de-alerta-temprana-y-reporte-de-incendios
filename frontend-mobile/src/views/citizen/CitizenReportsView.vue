<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonCard, IonCardContent, IonSegment, IonSegmentButton, IonLabel,
  IonInput, IonCheckbox, IonItem, IonButtons, IonBackButton, IonToast,
  alertController
} from '@ionic/vue'
import { Geolocation } from '@capacitor/geolocation'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings'
import L from 'leaflet'

import markerIconPng from 'leaflet/dist/images/marker-icon.png'
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png'

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL || 'https://alertaincendios.duckdns.org/api'
const gpsListo = ref(false)
const customMarkerIcon = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Aviso que lleva al usuario directo a los ajustes de la app
const irAAjustes = async (lista: string) => {
  const alert = await alertController.create({
    header: 'Activa los permisos',
    message: `Para enviar un reporte necesitamos acceso a: ${lista}. Toca "Abrir ajustes", entra en "Permisos" y actívalos.`,
    buttons: [
      { text: 'Ahora no', role: 'cancel' },
      {
        text: 'Abrir ajustes',
        handler: () => {
          NativeSettings.open({
            optionAndroid: AndroidSettings.ApplicationDetails,
            optionIOS: IOSSettings.App
          })
        }
      }
    ]
  })
  await alert.present()
}



// Lee la ubicación con Capacitor
const obtenerPosicion = () =>
  Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })

// Aviso cuando el GPS del teléfono está apagado: lleva a los ajustes de ubicación
const avisarGpsApagado = async () => {
  const alert = await alertController.create({
    header: 'Enciende tu ubicación',
    message: 'No pudimos obtener tu ubicación. Asegúrate de tener el GPS (Ubicación) encendido en los ajustes de tu teléfono.',
    buttons: [
      { text: 'Ahora no', role: 'cancel' },
      {
        text: 'Abrir ajustes',
        handler: () => {
          NativeSettings.open({
            optionAndroid: AndroidSettings.Location,
            optionIOS: IOSSettings.LocationServices
          })
        }
      }
    ]
  })
  await alert.present()
}

// Decide qué aviso mostrar según el error de ubicación
const manejarErrorUbicacion = async (error: any) => {
  console.error('Error de ubicación', error)
  const msg = String(error?.message || '').toLowerCase()
  if (msg.includes('denied') || msg.includes('permission')) {
    await irAAjustes('ubicación')
  } else {
    await avisarGpsApagado()
  }
}

const mode = ref('en_lugar')
const photoUrl = ref<string | null>(null)
const isSubmitting = ref(false)
const toastOpen = ref(false)
const toastMessage = ref('')

const form = ref({
  direccion: '',
  detalles: '',
  humo: false,
  llamas: false,
  personas: false,
  explosiones: false
})

let map: L.Map | null = null
let marker: L.Marker | null = null
const selectedLocation = ref<{ lat: number, lng: number } | null>(null)
const isFetchingGPS = ref(false)
const gpsObtained = ref(false)

const gpsLocation = ref<{ lat: number; lng: number } | null>(null)

const verifyCurrentLocation = async () => {
  isFetchingGPS.value = true
  gpsObtained.value = false
  gpsLocation.value = null

  try {
    const pos = await obtenerPosicion()
    gpsLocation.value = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    }
    gpsObtained.value = true
    showToast('Ubicación obtenida correctamente.')
  } catch (error) {
    await manejarErrorUbicacion(error)
  } finally {
    isFetchingGPS.value = false
  }
}

const showToast = (msg: string) => {
  toastMessage.value = msg
  toastOpen.value = true
}

// Funciones de cámara para los dos botones distintos
const takePhoto = async (source: CameraSource) => {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: source
    })
    photoUrl.value = image.dataUrl || null
  } catch (error) {
    console.error('Error al capturar imagen', error)
    const msg = String((error as any)?.message || '').toLowerCase()
    if (msg.includes('denied') || msg.includes('permission')) {
      irAAjustes('cámara')
    }
  }
}

const getAddressFromCoords = async (lat: number, lng: number) => {
  try {
    form.value.direccion = 'Buscando dirección...'
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    const data = await response.json()

    if (data && data.display_name) {
      // Cortamos la dirección para que no incluya país o departamento innecesariamente largos
      const addressParts = data.display_name.split(',')
      form.value.direccion = addressParts.slice(0, 3).join(',').trim()
    } else {
      form.value.direccion = ''
    }
  } catch (error) {
    console.error('Error al obtener la dirección:', error)
    form.value.direccion = ''
  }
}

const initSelectMap = async () => {
  if (map) {
    map.remove()
    map = null
    marker = null
  }

  try {
    // 2. Esperamos a que el GPS nos dé las coordenadas y permisos
    const pos = await obtenerPosicion()
    const lat = pos.coords.latitude
    const lng = pos.coords.longitude

    // 3. Encendemos la variable para que el HTML dibuje el contenedor
    gpsListo.value = true

    // 4. Esperamos unos milisegundos a que aparezca el contenedor y dibujamos el mapa
    setTimeout(() => {
      map = L.map('select-map').setView([lat, lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      // Marcador azul de tu ubicación
      L.circleMarker([lat, lng], {
        color: '#ffffff', weight: 2, fillColor: '#3388ff', fillOpacity: 1, radius: 8
      }).bindPopup('<b>Tu ubicación actual</b>').addTo(map)

      // Evento para tocar el mapa y poner un punto
      map.on('click', (e) => {
        const { lat: cLat, lng: cLng } = e.latlng
        selectedLocation.value = { lat: cLat, lng: cLng }

        if (!marker) {
          marker = L.marker([cLat, cLng], { icon: customMarkerIcon }).addTo(map!)
        } else {
          marker.setLatLng([cLat, cLng])
        }
        getAddressFromCoords(cLat, cLng)
      })

      // Forzamos el ajuste de tamaño
      setTimeout(() => map?.invalidateSize(), 300)
    }, 150)

  } catch (error) {
    console.error('Error iniciando el mapa', error)
  }
}

const handleModeChange = (e: any) => {
  mode.value = e.detail.value
  if (mode.value === 'no_lugar') {
    nextTick(() => initSelectMap())
  }
}

const resetForm = () => {
  mode.value = 'en_lugar'
  photoUrl.value = null
  form.value = {
    direccion: '',
    detalles: '',
    humo: false,
    llamas: false,
    personas: false,
    explosiones: false
  }
  selectedLocation.value = null
  if (marker && map) {
    map.removeLayer(marker)
    marker = null
  }
}

const submitReport = async () => {
  if (!photoUrl.value) {
    showToast('La evidencia fotográfica es obligatoria')
    return
  }

  let lat = 0
  let lng = 0
  let modalidad = 'EN_SITIO'
  if (mode.value === 'no_lugar') {
    if (!selectedLocation.value) {
      showToast('Toca el mapa para indicar la ubicación aproximada')
      return
    }
    lat = selectedLocation.value.lat
    lng = selectedLocation.value.lng
    modalidad = 'CERCANA'
  } else {
    try {
      const pos = await obtenerPosicion()
      lat = pos.coords.latitude
      lng = pos.coords.longitude
    } catch (error) {
      await manejarErrorUbicacion(error)
      return
    }
  }

  isSubmitting.value = true

  try {
    const imageResponse = await fetch(photoUrl.value)
    const imageBlob = await imageResponse.blob()

    const formData = new FormData()
    formData.append('archivo', imageBlob, 'evidencia.jpg') // 'archivo' es el nombre del campo esperado por tu backend

    const uploadRes = await fetch(`${API_URL}/archivos`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    if (!uploadRes.ok) throw new Error('Error al subir la imagen')

    const uploadData = await uploadRes.json()
    const evidenciaUrl = uploadData.url || uploadData.data?.url // Ajusta según la respuesta exacta de tu backend

    const reportePayload = {
      tipo: 'INCENDIO',
      latitud: lat,
      longitud: lng,
      foto_url: evidenciaUrl,
      descripcion: `Dirección: ${form.value.direccion} | Detalles: ${form.value.detalles} | Humo: ${form.value.humo ? 'Sí' : 'No'} | Llamas: ${form.value.llamas ? 'Sí' : 'No'} | Personas en riesgo: ${form.value.personas ? 'Sí' : 'No'} | Explosiones: ${form.value.explosiones ? 'Sí' : 'No'}`,
      indicador: modalidad
    }

    const reporteRes = await fetch(`${API_URL}/reportes-usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportePayload),
      credentials: 'include'
    })

    if (!reporteRes.ok) throw new Error('Error al guardar el reporte en la base de datos')

    showToast('Reporte enviado exitosamente')
    resetForm()
    setTimeout(() => {
      router.push('/ciudadano/inicio')
    }, 1500)

  } catch (error: any) {
    console.error('Error enviando reporte:', error)
    showToast(error.message || 'Error de conexión con el servidor')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border" style="border-bottom: 2px solid #eee;">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/ciudadano/inicio" color="dark"></ion-back-button>
        </ion-buttons>
        <ion-title style="color: #444;">Nuevo reporte</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="report-content">
      <ion-card class="form-card">
        <ion-card-content>

          <h2 class="card-main-title">Detalles del incidente</h2>

          <p class="question">¿Estás en el lugar del incendio? </p>

          <ion-segment :value="mode" @ionChange="handleModeChange" class="custom-segment">
            <ion-segment-button value="en_lugar">
              <ion-label>ESTOY EN EL LUGAR</ion-label>
            </ion-segment-button>
            <ion-segment-button value="no_lugar">
              <ion-label>NO ESTOY EN EL LU...</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div v-if="mode === 'en_lugar'" class="gps-info-box">
            <br />
            <div class="gps-text"></div>
            <ion-button
              expand="block"
              class="btn-verify-gps"
              :disabled="isFetchingGPS || gpsObtained"
              @click="verifyCurrentLocation"
            >
              {{
                isFetchingGPS
                  ? 'Obteniendo ubicación...'
                  : gpsObtained
                    ? 'Ubicación obtenida ✓'
                    : 'Click para obtener ubicación'
              }}
            </ion-button>
          </div>

          <div v-if="mode === 'no_lugar'" class="remote-form">
            <p class="helper-text">
              Usaremos tu ubicación actual solo como referencia aproximada, no como el punto exacto del incendio. Completa los datos de abajo para ayudarnos a ubicarlo.
            </p>

            <div v-if="gpsListo" id="select-map" class="map-selector"></div>
            <div v-else class="map-selector" style="display: flex; align-items: center; justify-content: center; color: #666; font-size: 13px;">Cargando mapa...</div>
            <ion-item lines="full" class="custom-input">
              <ion-label position="stacked">Dirección aproximada del incidente *</ion-label>
              <ion-input v-model="form.direccion" placeholder="Ej: Av. X y calle Y, cerca del mercado"></ion-input>
            </ion-item>

            <ion-item lines="full" class="custom-input">
              <ion-label position="stacked">Otras opciones relevantes *</ion-label>
              <ion-input v-model="form.detalles" placeholder="Ej: casa de dos pisos, humo denso color negro, cerc"></ion-input>
            </ion-item>

            <div class="checkbox-group">
              <ion-item lines="none">
                <ion-checkbox slot="start" v-model="form.humo" class="custom-checkbox"></ion-checkbox>
                <ion-label>Humo visible</ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-checkbox slot="start" v-model="form.llamas" class="custom-checkbox"></ion-checkbox>
                <ion-label>Llamas</ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-checkbox slot="start" v-model="form.personas" class="custom-checkbox"></ion-checkbox>
                <ion-label>Personas en riesgo</ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-checkbox slot="start" v-model="form.explosiones" class="custom-checkbox"></ion-checkbox>
                <ion-label>Explosiones</ion-label>
              </ion-item>
            </div>
          </div>

          <p class="question mt-4">Evidencia fotográfica</p>

          <div v-if="photoUrl" class="photo-preview">
            <img :src="photoUrl" alt="Evidencia" />
            <ion-button fill="clear" color="danger" @click="photoUrl = null">Quitar foto</ion-button>
          </div>

          <div class="action-buttons">
            <ion-button expand="block" class="btn-primary" @click="takePhoto(CameraSource.Camera)">
              TOMAR FOTO
            </ion-button>

            <ion-button expand="block" fill="outline" class="btn-outline" @click="takePhoto(CameraSource.Photos)">
              ELEGIR DE GALERÍA
            </ion-button>

            <ion-button expand="block" class="btn-submit" :disabled="isSubmitting" @click="submitReport">
              {{ isSubmitting ? 'ENVIANDO...' : 'ENVIAR REPORTE' }}
            </ion-button>
          </div>

        </ion-card-content>
      </ion-card>

      <ion-toast
        :is-open="toastOpen"
        :message="toastMessage"
        :duration="3000"
        @didDismiss="toastOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<style scoped>
.report-content {
  --background: #f8f9fa;
}

.form-card {
  margin: 16px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  background: white;
}

.card-main-title {
  font-size: 18px;
  color: #333;
  margin-top: 4px;
  margin-bottom: 24px;
  font-weight: 400;
}

.incident-type {
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.incident-type .label {
  font-size: 11px;
  font-weight: 600;
  color: #333;
}

.incident-type .value {
  font-size: 15px;
  color: #333;
  margin-top: 4px;
}

.question {
  font-size: 13px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 24px;
}

.custom-segment {
  margin-bottom: 3px;
  --background: transparent;
}

.custom-segment ion-segment-button {
  --color-checked: var(--alerta-brand, #F24A23);
  --indicator-color: var(--alerta-brand, #F24A23);
  --color: #666;
  font-weight: 600;
  font-size: 12px;
  border-bottom: 2px solid transparent;
}

.helper-text {
  font-size: 12px;
  color: var(--alerta-brand, #F24A23);
  line-height: 1.4;
  margin-bottom: 16px;
  font-weight: 500;
}

.map-selector {
  width: 100%;
  height: 200px;
  border-radius: 4px;
  margin-bottom: 16px;
  background-color: #eee;
  z-index: 1;
}

.custom-input {
  --padding-start: 0;
  margin-bottom: 12px;
}

.custom-input ion-label {
  font-weight: 600;
  font-size: 11px !important;
  color: #333 !important;
}

.checkbox-group {
  margin: 16px 0;
}

.checkbox-group ion-item {
  --padding-start: 0;
  --min-height: 40px;
}

.custom-checkbox {
  --checkbox-background-checked: var(--alerta-brand, #F24A23);
  --border-color-checked: var(--alerta-brand, #F24A23);
  margin-right: 16px;
}

.checkbox-group ion-label {
  font-size: 13px;
  color: #333;
}

.photo-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

.photo-preview img {
  max-width: 100%;
  border-radius: 4px;
  max-height: 250px;
  object-fit: cover;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary {
  --background: var(--alerta-brand, #F24A23);
  font-weight: 600;
  font-size: 13px;
  --border-radius: 4px;
  margin: 0;
}

.btn-outline {
  --color: var(--alerta-brand, #F24A23);
  --border-color: var(--alerta-brand, #F24A23);
  --border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
  border: 1px solid var(--alerta-brand, #F24A23);
  background: transparent;
  margin: 0;
}

.btn-submit {
  --background: var(--alerta-brand, #F24A23);
  font-weight: 600;
  font-size: 13px;
  --border-radius: 4px;
  margin-top: 8px;
}
</style>