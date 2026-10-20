<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/ciudadano/inicio" />
        </ion-buttons>
        <ion-title>Nuevo reporte</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Detalles del incidente</ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Tipo de incidente</ion-label>
            <ion-input v-model="form.incidentType" placeholder="Ej: incendio, humo, derrame" />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Descripción</ion-label>
            <ion-textarea v-model="form.description" auto-grow :rows="4" placeholder="Describe lo observado" />
          </ion-item>

          <div class="check-grid">
            <ion-item lines="none">
              <ion-checkbox v-model="form.smokeVisible" />
              <ion-label>Humo visible</ion-label>
            </ion-item>
            <ion-item lines="none">
              <ion-checkbox v-model="form.flamesVisible" />
              <ion-label>Llamas</ion-label>
            </ion-item>
            <ion-item lines="none">
              <ion-checkbox v-model="form.peopleAtRisk" />
              <ion-label>Personas en riesgo</ion-label>
            </ion-item>
            <ion-item lines="none">
              <ion-checkbox v-model="form.explosions" />
              <ion-label>Explosiones</ion-label>
            </ion-item>
          </div>

          <ion-button expand="block" class="mt-16" @click="getCurrentLocation">
            Usar mi ubicación actual
          </ion-button>

          <div v-if="coordsText" class="coords-box">
            {{ coordsText }}
          </div>

          <ion-item>
            <ion-label position="stacked">Latitud</ion-label>
            <ion-input v-model.number="latitude" type="number" />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Longitud</ion-label>
            <ion-input v-model.number="longitude" type="number" />
          </ion-item>

          <div class="photo-section">
            <h3>Evidencia fotográfica *</h3>
            <div class="photo-actions">
              <ion-button expand="block" @click="takePhoto('camera')">Tomar foto</ion-button>
              <ion-button expand="block" fill="outline" @click="takePhoto('photos')">Elegir de galería</ion-button>
            </div>

            <div v-if="photoPreview" class="photo-preview">
              <img :src="photoPreview" alt="Evidencia del reporte" />
              <div class="photo-actions small">
                <ion-button size="small" @click="takePhoto('camera')">Cambiar foto</ion-button>
                <ion-button size="small" fill="clear" color="medium" @click="removePhoto">Eliminar</ion-button>
              </div>
            </div>
          </div>

          <input ref="fileInput" type="file" accept="image/*" capture="environment" class="hidden-input" @change="onFileSelected" />

          <ion-button expand="block" class="mt-16" color="primary" @click="submitReport">
            Enviar reporte
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonBackButton,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
  toastController,
} from '@ionic/vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { useCitizenReportStore } from '../stores/citizen-report.store'

const router = useRouter()
const reportStore = useCitizenReportStore()
const coordsText = ref('')
const latitude = ref(-33.4489)
const longitude = ref(-70.6693)
const fileInput = ref<HTMLInputElement | null>(null)
const photoPreview = ref('')
const isNativeCamera = computed(() => Capacitor.isNativePlatform())

async function notify(message: string, duration = 1800) {
  const toast = await toastController.create({
    message,
    duration,
    position: 'bottom',
  })
  await toast.present()
}

const form = reactive({
  incidentType: 'INCENDIO',
  description: '',
  smokeVisible: false,
  flamesVisible: false,
  peopleAtRisk: false,
  explosions: false,
})

async function takePhoto(source: 'camera' | 'photos') {
  try {
    if (isNativeCamera.value) {
      const result = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        saveToGallery: false,
      })

      photoPreview.value = result.dataUrl ?? ''
      return
    }

    if (fileInput.value) {
      fileInput.value.setAttribute('capture', source === 'camera' ? 'environment' : 'user')
      fileInput.value.click()
    }
  } catch (error) {
    await notify(error instanceof Error ? error.message : 'No se pudo acceder a la cámara.', 2200)
  }
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    photoPreview.value = String(reader.result ?? '')
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removePhoto() {
  photoPreview.value = ''
}

async function getCurrentLocation() {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    })

    latitude.value = position.coords.latitude
    longitude.value = position.coords.longitude
    coordsText.value = `Ubicación: ${latitude.value.toFixed(5)}, ${longitude.value.toFixed(5)}`
    await notify('Ubicación capturada', 1200)
  } catch (error) {
    await notify(error instanceof Error ? error.message : 'No se pudo obtener la ubicación', 2000)
  }
}

async function submitReport() {
  if (!form.incidentType.trim() || !form.description.trim()) {
    await notify('Completa tipo e información del incidente', 1800)
    return
  }

  if (!photoPreview.value) {
    await notify('Debes agregar una fotografía del posible incendio.', 2200)
    return
  }

  try {
    await reportStore.createReport({
      incidentType: form.incidentType,
      description: form.description,
      smokeVisible: form.smokeVisible,
      flamesVisible: form.flamesVisible,
      peopleAtRisk: form.peopleAtRisk,
      explosions: form.explosions,
      latitude: latitude.value,
      longitude: longitude.value,
      photo: photoPreview.value,
      photoUrl: photoPreview.value,
      status: 'EN_REVISION',
    })

    await notify('Reporte enviado', 1800)
    await router.push('/ciudadano/reportes')
  } catch (error) {
    await notify(error instanceof Error ? error.message : 'No se pudo enviar el reporte', 2200)
  }
}
</script>

<style scoped>
.mt-16 {
  margin-top: 1rem;
}

.check-grid {
  margin: 0.75rem 0 1rem;
}

.coords-box {
  background: #fff7ed;
  color: #9a4d10;
  border: 1px solid #fed7aa;
  border-radius: 10px;
  padding: 0.75rem;
  margin: 1rem 0;
}

.photo-section {
  margin-top: 1rem;
}

.photo-section h3 {
  margin: 0 0 0.5rem;
  color: #1f2937;
  font-weight: 700;
}

.photo-actions {
  display: grid;
  gap: 0.6rem;
}

.photo-actions.small {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 0.75rem;
}

.photo-preview {
  margin-top: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
}

.photo-preview img {
  display: block;
  width: 100%;
  max-height: 260px;
  object-fit: cover;
}

.hidden-input {
  display: none;
}
</style>
