<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToast, IonToolbar } from '@ionic/vue'
import { checkmarkCircleOutline, flameOutline, locationOutline, navigateOutline, timeOutline } from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useIncidentStore } from '../../stores/incident.store'
import IncidentTimeline from '../../components/common/IncidentTimeline.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import { hapticsService } from '../../services/haptics.service'
import type { IncidentStatus } from '../../types'

const route = useRoute()
const incidentStore = useIncidentStore()
const toastOpen = ref(false)
const toastMessage = ref('')
const isUpdating = ref(false)
const confirmFinalization = ref(false)

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
  } catch {
    toastMessage.value = 'No se pudo actualizar el estado.'
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

onMounted(async () => {
  await incidentStore.fetchIncidents()
})
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-title>Emergencia</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="container" v-if="incident">
        <div class="section-title">Emergencia activa</div>
        <ion-card class="hero-card">
          <ion-card-content>
            <div class="top-row">
              <div>
                <p class="muted">{{ incident.id }}</p>
                <h2>{{ incident.title }}</h2>
              </div>
              <span class="risk-pill"><ion-icon :icon="flameOutline" />{{ incident.risk }}</span>
            </div>
            <p class="description">{{ incident.description }}</p>
          </ion-card-content>
        </ion-card>

        <div class="section-title">Estado y siguiente acción</div>
        <ion-card class="next-action-card">
          <ion-card-content>
            <div class="current-status">
              <span>Estado actual</span>
              <StatusBadge :state="incident.status" :tone="statusTone" />
            </div>
            <div v-if="nextAction" class="next-action-copy">
              <span>Siguiente acción</span>
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
              <div><span class="label"><ion-icon :icon="locationOutline" />Ubicación</span><strong>{{ incident.location }}</strong></div>
              <div><span class="label"><ion-icon :icon="locationOutline" />Dirección</span><strong>{{ incident.address }}</strong></div>
              <div><span class="label"><ion-icon :icon="timeOutline" />Hora</span><strong>{{ new Date(incident.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) }}</strong></div>
              <div><span class="label"><ion-icon :icon="navigateOutline" />Distancia</span><strong>{{ incident.distanceKm }} km</strong></div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
            <div class="mini-map">
              <div class="map-pin"><ion-icon :icon="locationOutline" /></div>
              <div class="map-label">{{ incident.location }}</div>
            </div>
          </ion-card-content>
        </ion-card>

        <div class="section-title">Registro de tiempos</div>
        <IncidentTimeline :events="incident.timeline" />

        <div v-if="nextAction" class="action-block">
          <ion-button expand="block" size="large" class="primary-button" :disabled="isUpdating" @click="requestNextAction">
            <ion-icon slot="start" :icon="checkmarkCircleOutline" aria-hidden="true" />
            {{ isUpdating ? 'Actualizando...' : nextAction.label }}
          </ion-button>
        </div>
      </div>
      <div v-else class="container empty-state-box">
        <p>Emergencia no encontrada.</p>
      </div>
    </ion-content>

    <ion-toast
      :is-open="toastOpen"
      :message="toastMessage"
      :duration="1800"
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
.top-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.top-row > div { min-width: 0; }
.top-row h2 { overflow-wrap: anywhere; }
.muted {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.risk-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--alerta-red-soft);
  color: var(--alerta-red-critical);
  text-transform: uppercase;
  font-size: 10px;
  font-weight: 700;
}
.risk-pill ion-icon { font-size: 14px; }
.description {
  margin-top: 12px;
  color: var(--alerta-muted);
  font-size: 14px;
  line-height: 1.5;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 12px;
}
.label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--alerta-muted);
}
.label ion-icon { color: var(--alerta-orange); font-size: 16px; }
.info-grid strong { font-size: 14px; line-height: 1.4; }
.mini-map {
  height: 170px;
  border-radius: 14px;
  background: linear-gradient(135deg, #e6f0eb, #f3f7f4);
  position: relative;
  overflow: hidden;
}
.mini-map::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px);
  background-size: 24px 24px;
}
.map-pin {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 3px solid white;
  border-radius: 50%;
  background: var(--alerta-red);
  color: white;
  box-shadow: 0 5px 14px rgba(228, 71, 61, 0.28);
  font-size: 20px;
}
.map-label {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  background: rgba(255,255,255,0.96);
  color: var(--alerta-ink);
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.action-block {
  margin-top: 20px;
}
.action-block ion-button {
  --background: var(--alerta-orange);
  --color: var(--alerta-ink);
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
  color: var(--alerta-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}
.next-action-copy {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--alerta-border);
}
.next-action-copy strong {
  color: var(--alerta-ink);
  font-size: 13px;
  text-align: right;
}
.empty-state-box {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--alerta-muted);
}
@media (max-width: 420px) {
  .info-grid { grid-template-columns: 1fr; }
}
</style>
