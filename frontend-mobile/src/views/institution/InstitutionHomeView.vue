<script setup lang="ts">
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'
import { alertCircleOutline, arrowForwardOutline, checkmarkCircleOutline, flameOutline, locationOutline, personOutline, shieldCheckmarkOutline, timeOutline, logOutOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'
import { CapacitorHttp } from '@capacitor/core'
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

const activeIncident = computed(() => incidentStore.incidents.find((item) => item.status !== 'FINALIZADA'))
const alertsPending = computed(() => alertStore.alerts.filter((item) => item.status !== 'FINALIZADA').length)
const alertsToday = computed(() => alertStore.alerts.filter((item) => item.status === 'FINALIZADA').length)

const onLogout = async () => {
  await authStore.logout()
  router.replace('/auth/login')
}

const obtenerDatosInstitucion = async () => {
  try {
    // 1. Obtenemos quién es el usuario y a qué institución pertenece
    const meResponse = await fetch('https://alertaincendios.duckdns.org/api/auth/me', { credentials: 'include' });
    const meData = await meResponse.json();
    
    if (meData.success && meData.data.id_institucion) {
      const idInst = meData.data.id_institucion;
      
      // 2. Traemos el nombre real de esa institución
      const instResponse = await fetch(`https://alertaincendios.duckdns.org/api/instituciones/${idInst}`, { credentials: 'include' });
      const instData = await instResponse.json();
      
      if (instData.success && instData.data.nombre) {
        nombreInstitucion.value = instData.data.nombre;
      } else {
        nombreInstitucion.value = `Institución #${idInst}`;
      }
    }
  } catch (error) {
    console.error('Error al obtener el nombre de la institución', error);
    nombreInstitucion.value = 'Mi Institución'; 
  }
}

onMounted(async () => {
  console.log('--- DIAGNÓSTICO DE CONEXIÓN ---');
  console.log('Token actual:', localStorage.getItem('token') || localStorage.getItem('access_token') || 'NO EXISTE TOKEN');
  
  obtenerDatosInstitucion();
  
  await Promise.all([incidentStore.fetchIncidents(), alertStore.fetchAlerts()]);
  
  console.log('Alertas cargadas:', alertStore.alerts);
  console.log('Emergencias cargadas:', incidentStore.incidents);
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
    <ion-content>
      <div class="container">
        <div class="brand">ALERTA</div>
        
        <!-- Aquí se corrige el texto duplicado mostrando solo el nombre limpio -->
        <h1>{{ nombreInstitucion }}</h1>
        
        <p class="subtitle"><ion-icon :icon="personOutline" aria-hidden="true" />{{ authStore.user?.name ?? 'Usuario institucional' }}</p>
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

        <div v-if="activeIncident" class="section-block">
          <div class="section-title">Emergencia activa</div>
          <ion-card class="active-card">
            <ion-card-header>
              <div class="active-header">
                <div>
                  <p class="muted">{{ activeIncident.id }}</p>
                  <h3>{{ activeIncident.title }}</h3>
                </div>
                <span class="risk-pill"><ion-icon :icon="flameOutline" />{{ activeIncident.risk }}</span>
              </div>
            </ion-card-header>
            <ion-card-content>
              <p class="location-row"><ion-icon :icon="locationOutline" /><strong>{{ activeIncident.location }}</strong></p>
              <p class="detail"><ion-icon :icon="timeOutline" />Hora: {{ new Date(activeIncident.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) }}</p>
              <ion-button expand="block" class="primary-button" :router-link="`/institucion/emergencia/${activeIncident.id}`"><ion-icon slot="start" :icon="arrowForwardOutline" />Ver emergencia</ion-button>
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
  </ion-page>
</template>

<style scoped>
.container { padding: 20px 16px; max-width: 720px; margin: 0 auto; }
.brand { color: var(--alerta-orange, #f24a23); font-weight: 800; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
.container > h1 { margin-top: 0; font-size: 26px; font-weight: 700; color: #111; }
.subtitle { display: flex; align-items: center; gap: 6px; margin-top: 5px; color: var(--alerta-muted, #666); font-size: 14px; }
.subtitle ion-icon { font-size: 16px; }
.status-card { margin-top: 20px; margin-inline: 0; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.status-copy { display: flex; align-items: center; gap: 12px; }
.status-copy > div { display: grid; gap: 2px; }
.green-circle { background: #e6f6eb; color: #108e41; padding: 10px; border-radius: 50%; display: flex; font-size: 24px; }
.yellow-circle { background: #fdf5e2; color: #b8860b; padding: 10px; border-radius: 50%; display: flex; font-size: 24px; }
.red-circle { background: #fdeeee; color: #d9382e; padding: 10px; border-radius: 50%; display: flex; font-size: 24px; }
.status-label { color: var(--alerta-muted, #666); font-size: 11px; font-weight: 700; text-transform: uppercase; }
.status-state { color: #111; font-size: 15px; font-weight: 700; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 20px; }
.summary-grid ion-card { margin: 0; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.metric-card ion-card-content { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 16px; }
.summary-label { margin: 0; color: var(--alerta-muted, #666); font-size: 11px; font-weight: 700; text-transform: uppercase; line-height: 1.3; }
.summary-grid h2 { margin: 0; font-size: 28px; font-weight: 700; color: #111; line-height: 1; }
.section-block { display: grid; gap: 12px; margin-top: 28px; }
.section-title { font-size: 16px; font-weight: 700; color: #111; margin-bottom: 4px; }
.active-card { margin: 0; border-left: 4px solid var(--alerta-red, #d9382e); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.active-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.muted { margin: 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--alerta-muted, #666); }
.active-header h3 { margin: 4px 0 0 0; font-size: 16px; font-weight: 700; }
.risk-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: #fdeeee; color: #d9382e; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
.location-row { display: flex; align-items: center; gap: 8px; margin: 12px 0 6px 0; font-size: 14px; color: #111; }
.location-row ion-icon { color: var(--alerta-orange, #f24a23); font-size: 18px; }
.detail { display: flex; align-items: center; gap: 6px; margin: 0 0 16px 0; font-size: 13px; color: var(--alerta-muted, #666); }
.primary-button { --background: var(--alerta-orange, #f24a23); --color: white; --border-radius: 8px; margin: 0; }
</style>