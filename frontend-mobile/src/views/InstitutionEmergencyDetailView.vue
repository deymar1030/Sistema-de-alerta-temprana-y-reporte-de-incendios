<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/institucion/inicio" />
        </ion-buttons>
        <ion-title>Emergencia</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card v-if="alertItem">
        <ion-card-header>
          <ion-card-title>{{ alertItem.description }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p><strong>Estado global:</strong> {{ alertItem.status }}</p>
          <p><strong>Estado de mi institución:</strong> {{ alertItem.institutionStatus ?? 'Sin envío asignado' }}</p>
          <p><strong>Riesgo:</strong> {{ alertItem.riskLevel === 'unknown' ? 'No evaluado' : alertItem.riskLevel }}</p>
          <p><strong>Ubicación:</strong> {{ alertItem.hasCoordinates
            ? `${alertItem.location.coordinates.latitude}, ${alertItem.location.coordinates.longitude}`
            : 'No disponible' }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(alertItem.createdAt) }}</p>

          <div class="action-row">
            <ion-button v-if="alertItem.institutionStatus === 'ENVIADA'" :disabled="updating" @click="applyAction('receive')">Recibir</ion-button>
            <ion-button v-if="['ENVIADA', 'RECIBIDA'].includes(alertItem.institutionStatus)" color="warning" :disabled="updating" @click="applyAction('attend')">Atender</ion-button>
            <ion-button v-if="alertItem.institutionStatus === 'ATENDIDA'" color="danger" :disabled="updating" @click="applyAction('close')">Cerrar</ion-button>
          </div>
        </ion-card-content>
      </ion-card>

<div v-else class="empty-state">{{ detailError || 'Cargando emergencia...' }}</div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  toastController,
} from '@ionic/vue'
import { alertService } from '../services/alert.service'
import { useAuthStore } from '../stores/auth.store'

const route = useRoute()
const authStore = useAuthStore()
const alertItem = ref<any>(null)
const detailError = ref('')
const updating = ref(false)

async function notify(message: string, duration = 1800) {
  const toast = await toastController.create({
    message,
    duration,
    position: 'bottom',
  })
  await toast.present()
}

const institutionId = computed(() => authStore.user?.institutionId ?? null)

async function loadDetail() {
  detailError.value = ''
  if (!institutionId.value) {
    detailError.value = 'Tu sesión no tiene una institución asignada.'
    return
  }
  try {
    // Consultar detalle ACTUAL, no un objeto previamente almacenado en memoria.
    alertItem.value = await alertService.getAlertById(String(route.params.id), institutionId.value)
    if (!alertItem.value) detailError.value = 'No se encontró la alerta o no se pudo cargar.'
  } catch (error) {
    detailError.value = error instanceof Error ? error.message : 'No se pudo cargar la alerta.'
  }
}

onMounted(loadDetail)

async function applyAction(action: 'receive' | 'attend' | 'close') {
  if (!institutionId.value || updating.value) return
  const id = String(route.params.id)
  updating.value = true
  try {
    if (action === 'receive') await alertService.receiveAlert(id, institutionId.value)
    if (action === 'attend') await alertService.attendAlert(id, institutionId.value)
    if (action === 'close') await alertService.closeAlert(id, institutionId.value)

    // La respuesta del backend es la fuente de verdad.
    const verified = await alertService.getAlertById(id, institutionId.value)
    if (!verified) throw new Error('Cambio solicitado, pero no fue posible comprobar el estado en el servidor.')
    alertItem.value = verified
    await notify(`Estado de la institución: ${verified.institutionStatus ?? 'sin confirmar'}`, 1800)
  } catch (error) {
    await notify(error instanceof Error ? error.message : 'No fue posible actualizar la emergencia', 2200)
  } finally {
    updating.value = false
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<style scoped>
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.empty-state {
  text-align: center;
  color: #64748b;
  margin-top: 2rem;
}
</style>
