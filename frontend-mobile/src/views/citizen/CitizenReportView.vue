<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonCheckbox, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonPage, IonSelect, IonSelectOption, IonSpinner, IonTextarea, IonTitle, IonToolbar, IonToast } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { cameraOutline, locationOutline, paperPlaneOutline } from 'ionicons/icons'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import PhotoPreview from '../../components/common/PhotoPreview.vue'
import { cameraService } from '../../services/camera.service'
import { geolocationService } from '../../services/geolocation.service'
import { hapticsService } from '../../services/haptics.service'
import { useCitizenReportStore } from '../../stores/citizen-report.store'
import type { CitizenReport, LocationData, PhotoData } from '../../types'

const router = useRouter()
const reportStore = useCitizenReportStore()
const description = ref('')
const incidentType = ref<CitizenReport['incidentType']>('EDIFICIO')
const location = ref('Av. Arce, La Paz')
const locationData = ref<LocationData>({ latitude: -16.4947, longitude: -68.1324, label: location.value, isDemo: true })
const locationIsDemo = ref(true)
const smokeVisible = ref(true)
const fireVisible = ref(false)
const peopleAtRisk = ref(false)
const explosions = ref(false)
const photo = ref<PhotoData | null>(null)
const photoInput = ref<HTMLInputElement | null>(null)
const toastOpen = ref(false)
const toastMessage = ref('')
const confirmSubmit = ref(false)
const isSubmitting = ref(false)
const isLoadingLocation = ref(false)
const isLoadingPhoto = ref(false)

const typeOptions: Array<{ label: string; value: CitizenReport['incidentType'] }> = [
  { label: 'Vivienda', value: 'VIVIENDA' },
  { label: 'Edificio', value: 'EDIFICIO' },
  { label: 'Vehículo', value: 'VEHICULO' },
  { label: 'Vegetación', value: 'VEGETACION' },
  { label: 'Comercio', value: 'COMERCIO' },
  { label: 'Otro', value: 'OTRO' },
]

const showToast = (message: string) => {
  toastMessage.value = message
  toastOpen.value = true
}

const choosePhoto = async () => {
  if (isLoadingPhoto.value) return
  if (!Capacitor.isNativePlatform()) {
    photoInput.value?.click()
    return
  }
  isLoadingPhoto.value = true
  const result = await cameraService.capturePhoto()
  isLoadingPhoto.value = false
  if (result.ok) {
    photo.value = result.data
    showToast('Foto cargada')
    return
  }
  if (result.error === 'UNSUPPORTED') {
    photoInput.value?.click()
    return
  }
  if (result.error !== 'CANCELLED') showToast('No se pudo cargar la imagen.')
}

const onPhotoSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  isLoadingPhoto.value = true
  const result = await cameraService.readWebFile(file)
  isLoadingPhoto.value = false
  if (result.ok) {
    photo.value = result.data
    showToast('Foto cargada')
  } else {
    showToast('No se pudo cargar la imagen.')
  }
  input.value = ''
}

const getLocation = async () => {
  if (isLoadingLocation.value) return
  isLoadingLocation.value = true
  const result = await geolocationService.getCurrentPosition()
  isLoadingLocation.value = false
  if (!result.ok) {
    showToast(result.error === 'PERMISSION_DENIED'
      ? 'No se pudo obtener la ubicación. Revisa los permisos.'
      : 'No se pudo obtener la ubicación.')
    return
  }
  locationData.value = result.data
  location.value = result.data.label
  locationIsDemo.value = result.data.isDemo
  showToast(result.data.isDemo ? 'Ubicación de demostración' : 'Ubicación obtenida')
}

const requestSubmit = () => {
  if (isSubmitting.value) return
  if (!description.value.trim()) {
    showToast('Describe lo observado antes de enviar.')
    return
  }
  confirmSubmit.value = true
}

const submitReport = async () => {
  if (isSubmitting.value) return
  confirmSubmit.value = false
  isSubmitting.value = true
  try {
    await reportStore.createReport({
      description: description.value.trim(),
      incidentType: incidentType.value,
      type: typeOptions.find((option) => option.value === incidentType.value)?.label ?? 'Incendio',
      location: location.value,
      latitude: locationData.value.latitude,
      longitude: locationData.value.longitude,
      smokeVisible: smokeVisible.value,
      fireVisible: fireVisible.value,
      peopleAtRisk: peopleAtRisk.value,
      explosions: explosions.value,
      photo: photo.value?.dataUrl,
      status: 'RECIBIDO',
    })
    await hapticsService.lightImpact()
    showToast('Tu reporte fue recibido y será verificado por el Centro de Monitoreo.')
    await new Promise<void>((resolve) => window.setTimeout(resolve, 650))
    await router.push('/ciudadano/mis-reportes')
  } catch {
    showToast('No se pudo enviar el reporte.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-title>Reportar incendio</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="container">
        <div class="section-title">Nivel de reporte</div>
        <ol class="report-progress" aria-label="Progreso del reporte">
          <li class="step-current"><span>1</span>Información</li>
          <li><span>2</span>Ubicación</li>
          <li><span>3</span>Evidencia</li>
          <li><span>4</span>Enviar</li>
        </ol>

        <ion-item lines="none" class="field-wrap">
          <ion-label position="stacked">Descripción</ion-label>
          <ion-textarea v-model="description" :rows="4" placeholder="Describe lo observado" />
        </ion-item>

        <div class="section-title form-section-title">Tipo de incidente</div>
        <ion-item lines="none" class="field-wrap">
          <ion-label position="stacked">Selecciona una categoría</ion-label>
          <ion-select v-model="incidentType" interface="action-sheet">
            <ion-select-option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <div class="section-title form-section-title">Indicadores</div>
        <div class="check-grid">
          <ion-item lines="none">
            <ion-checkbox v-model="smokeVisible" slot="start" />
            <ion-label>Humo visible</ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-checkbox v-model="fireVisible" slot="start" />
            <ion-label>Llamas visibles</ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-checkbox v-model="peopleAtRisk" slot="start" />
            <ion-label>Personas en riesgo</ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-checkbox v-model="explosions" slot="start" />
            <ion-label>Explosiones</ion-label>
          </ion-item>
        </div>

        <div class="section-title form-section-title">Ubicación</div>
        <ion-item lines="none" class="field-wrap location-box">
          <ion-icon :icon="locationOutline" class="location-icon" aria-hidden="true" />
          <ion-input v-model="location" placeholder="Ubicación aproximada" />
        </ion-item>
        <p class="location-hint">{{ locationIsDemo ? 'Ubicación de demostración' : 'Ubicación obtenida' }}</p>
        <ion-button class="location-button" fill="clear" size="small" :disabled="isLoadingLocation" @click="getLocation">
          <ion-spinner v-if="isLoadingLocation" name="crescent" />
          <ion-icon v-else slot="start" :icon="locationOutline" aria-hidden="true" />
          {{ isLoadingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación' }}
        </ion-button>

        <div class="section-title form-section-title">Fotografía</div>
        <ion-card class="upload-card">
          <ion-card-content>
            <input ref="photoInput" class="file-input" type="file" accept="image/*" @change="onPhotoSelected" />
            <ion-button class="upload-box" fill="clear" :disabled="isLoadingPhoto" @click="choosePhoto">
              <ion-spinner v-if="isLoadingPhoto" name="crescent" />
              <ion-icon v-else slot="start" :icon="cameraOutline" class="upload-icon" aria-hidden="true" />
              <span class="upload-copy"><strong>{{ isLoadingPhoto ? 'Cargando foto...' : photo ? 'Foto cargada' : 'Seleccionar foto' }}</strong><small>JPG o PNG</small></span>
            </ion-button>
            <PhotoPreview :src="photo?.dataUrl ?? ''" alt="Vista previa del reporte" />
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" size="large" class="send-button" :disabled="isSubmitting" @click="requestSubmit">
          <ion-icon slot="start" :icon="paperPlaneOutline" aria-hidden="true" />
          {{ isSubmitting ? 'Enviando...' : 'Enviar reporte' }}
        </ion-button>
      </div>
    </ion-content>

    <ion-toast :is-open="toastOpen" :message="toastMessage" :duration="2200" @didDismiss="toastOpen = false" />
    <ConfirmDialog
      :open="confirmSubmit"
      message="¿Deseas enviar este reporte al Centro de Monitoreo?"
      confirm-text="Enviar reporte"
      @confirm="submitReport"
      @cancel="confirmSubmit = false"
    />
  </ion-page>
</template>

<style scoped>
.field-wrap {
  min-height: 56px;
  margin-top: 8px;
  --background: var(--alerta-surface);
  --border-radius: 14px;
  --border-color: var(--alerta-border);
  --inner-border-width: 0;
  border: 1px solid var(--alerta-border);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(23, 33, 43, 0.03);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}
.field-wrap:focus-within {
  border-color: var(--alerta-orange);
  box-shadow: 0 0 0 3px rgba(244, 162, 89, 0.15);
}
.form-section-title {
  margin: 24px 0 8px;
}
.report-progress {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 0;
  margin: 12px 0 18px;
  list-style: none;
}
.report-progress li {
  display: grid;
  justify-items: center;
  gap: 6px;
  color: var(--alerta-quiet);
  font-size: 10px;
  text-align: center;
}
.report-progress li span {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 50%;
  background: #e9edeb;
  color: var(--alerta-muted);
  font-size: 12px;
  font-weight: 700;
}
.report-progress .step-current { color: var(--alerta-brand); font-weight: 700; }
.report-progress .step-current span { background: var(--alerta-orange-soft); color: var(--alerta-brand); }
ion-textarea {
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-size: 14px;
}
ion-textarea::part(native) {
  min-height: 110px;
}
.location-box {
  --padding-start: 14px;
  --inner-padding-end: 14px;
}
.location-hint {
  margin: 8px 14px 0;
  color: var(--alerta-muted);
  font-size: 12px;
}
.location-button { margin: 4px 0 0 4px; --box-shadow: none; }
.location-icon {
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  color: var(--alerta-brand);
  margin-right: 10px;
}
.check-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.check-grid ion-item {
  min-height: 52px;
  border: 1px solid var(--alerta-border);
  border-radius: 13px;
  --border-radius: 13px;
  --padding-start: 12px;
  --inner-padding-end: 10px;
  font-size: 13px;
}
.upload-card {
  margin-top: 8px;
  border: 0;
  background: transparent;
  box-shadow: none;
}
.file-input { display: none; }
.upload-box {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 76px;
  justify-content: flex-start;
  border: 1px dashed var(--alerta-orange);
  border-radius: 14px;
  padding: 14px 16px;
  background: var(--alerta-beige);
  color: var(--alerta-ink);
  --background: var(--alerta-beige);
  --color: var(--alerta-ink);
  --box-shadow: none;
}
.upload-icon {
  color: var(--alerta-brand);
  font-size: 24px;
}
.upload-copy {
  display: grid;
  gap: 3px;
}
.upload-copy strong {
  font-size: 14px;
}
.upload-copy small {
  color: var(--alerta-muted);
  font-size: 12px;
}
.send-button {
  margin-top: 18px;
  --background: var(--alerta-orange);
  --color: var(--alerta-ink);
  --box-shadow: 0 5px 14px rgba(244, 162, 89, 0.28);
}
@media (max-width: 420px) {
  .check-grid {
    grid-template-columns: 1fr;
  }
}
</style>
