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
          <p><strong>Estado:</strong> {{ alertItem.status }}</p>
          <p><strong>Riesgo:</strong> {{ alertItem.riskLevel }}</p>
          <p><strong>Ubicación:</strong> {{ alertItem.location.coordinates.latitude }}, {{ alertItem.location.coordinates.longitude }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(alertItem.createdAt) }}</p>

          <div class="action-row">
            <ion-button @click="applyAction('receive')">Recibir</ion-button>
            <ion-button color="warning" @click="applyAction('attend')">Atender</ion-button>
            <ion-button color="danger" @click="applyAction('close')">Cerrar</ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <div v-else class="empty-state">Cargando emergencia...</div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
import { useAlertStore } from '../stores/alert.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const alertStore = useAlertStore()
const alertItem = ref<any>(null)

async function notify(message: string, duration = 1800) {
  const toast = await toastController.create({
    message,
    duration,
    position: 'bottom',
  })
  await toast.present()
}

onMounted(async () => {
  const id = String(route.params.id)
  alertItem.value = await alertStore.getById(id)
})

const institutionId = computed(() => authStore.user?.institutionId ?? 'institucion-demo')

async function applyAction(action: 'receive' | 'attend' | 'close') {
  const id = String(route.params.id)
  try {
    if (action === 'receive') await alertService.receiveAlert(id, institutionId.value)
    if (action === 'attend') await alertService.attendAlert(id, institutionId.value)
    if (action === 'close') await alertService.closeAlert(id, institutionId.value)

    await notify('Estado actualizado', 1400)
    await router.push('/institucion/inicio')
  } catch (error) {
    await notify(error instanceof Error ? error.message : 'No fue posible actualizar la emergencia', 2200)
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
