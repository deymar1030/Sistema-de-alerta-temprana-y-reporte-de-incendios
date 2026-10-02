<script setup lang="ts">
import { IonButton, IonCard, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { businessOutline, personOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import type { UserRole } from '../types'

const router = useRouter()
const authStore = useAuthStore()

const chooseRole = async (role: UserRole) => {
  await authStore.setRole(role)
  if (role === 'INSTITUTION_USER') {
    await router.push('/institucion/inicio')
    return
  }
  await router.push('/ciudadano/inicio')
}
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-title>ALERTA</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="container">
        <div class="logo-block">
          <div class="brand">ALERTA</div>
          <h1>Prevención de Incendios</h1>
          <p>Selecciona el modo de demostración para continuar.</p>
        </div>

        <ion-card class="hero-card">
          <div class="card-inner">
            <span class="icon-circle"><ion-icon :icon="businessOutline" /></span>
            <h2>Modo de demostración</h2>
            <p>Este flujo simula la experiencia de los dos roles móviles del sistema.</p>
          </div>
        </ion-card>

        <div class="stack">
          <ion-button expand="block" size="large" @click="chooseRole('INSTITUTION_USER')">
            <ion-icon slot="start" :icon="businessOutline" aria-hidden="true" />
            Usuario de Institución
          </ion-button>
          <ion-button expand="block" size="large" color="medium" fill="outline" @click="chooseRole('CITIZEN')">
            <ion-icon slot="start" :icon="personOutline" aria-hidden="true" />
            Ciudadano
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.container {
  max-width: 480px;
  margin: 0 auto;
  padding-top: 1.25rem;
}
.logo-block {
  margin-bottom: 1.25rem;
}
.logo-block h1 {
  margin-top: 0.4rem;
  font-size: 22px;
  line-height: 1.1;
}
.logo-block p {
  margin-top: 0.75rem;
  color: #596773;
}
.card-inner {
  display: grid;
  justify-items: start;
  gap: 12px;
  padding: 18px;
}
.card-inner h2 {
  font-size: 18px;
  margin-bottom: 0.3rem;
}
.card-inner p {
  color: #596773;
  line-height: 1.45;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 1.2rem;
}
</style>
