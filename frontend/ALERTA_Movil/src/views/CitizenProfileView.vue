<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Perfil ciudadano</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="profile-shell">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ authStore.user?.name || 'Ciudadano' }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p><strong>Correo:</strong> {{ authStore.user?.email || 'Sin correo' }}</p>
            <p><strong>Celular:</strong> {{ authStore.user?.phone || 'Sin teléfono' }}</p>
            <p><strong>Ciudad:</strong> {{ authStore.user?.city || 'Sin ciudad' }}</p>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" color="medium" class="logout-button" @click="handleLogout">
          Cerrar sesión
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { useAuthStore } from '../stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await authStore.logout()
  await router.replace('/login')
}
</script>

<style scoped>
.profile-shell {
  max-width: 420px;
  margin: 0 auto;
}

.logout-button {
  margin-top: 1rem;
}
</style>
