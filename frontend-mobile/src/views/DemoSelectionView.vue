<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="login-shell">
        <div class="brand-wrap">
          <img class="brand-logo" src="/logo-alerta-ave.svg" alt="ALERTA logo" />
          <h1>ALERTA</h1>
          <p>Acceso seguro para personal operativo y ciudadanía.</p>
        </div>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Iniciar sesión</ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <form @submit.prevent="submitLogin">
              <ion-item class="input-item">
                <ion-label position="stacked">Correo</ion-label>
                <ion-input v-model="email" type="email" required autocomplete="email" placeholder="usuario@correo.com" />
              </ion-item>

              <ion-item class="input-item">
                <ion-label position="stacked">Contraseña</ion-label>
                <ion-input v-model="password" type="password" required autocomplete="current-password" placeholder="********" />
              </ion-item>

              <ion-button expand="block" type="submit" :disabled="authStore.loading || !email || !password">
                <ion-spinner v-if="authStore.loading" name="crescent" />
                <span v-else>Ingresar</span>
              </ion-button>

              <p v-if="authStore.error" class="error-text">{{ authStore.error }}</p>
            </form>
          </ion-card-content>
        </ion-card>

        <ion-list class="info-list">
          <ion-item>
            <ion-label>
              <h3>Acceso móvil</h3>
              <p>Solo usuarios con rol operativo o ciudadano pueden entrar a la app móvil.</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label>
              <h3>Roles web</h3>
              <p>Los roles 1 y 2 quedan bloqueados con un mensaje de acceso web.</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  toastController,
} from '@ionic/vue'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { useAuthStore } from '../stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')

async function notify(message: string, duration = 1800) {
  const toast = await toastController.create({
    message,
    duration,
    position: 'bottom',
  })
  await toast.present()
}

async function submitLogin() {
  try {
    const user = await authStore.login(email.value.trim(), password.value)

    if (user.role === 'CIUDADANO') {
      await router.push('/ciudadano/inicio')
    } else if (user.role === 'OPERATIVO') {
      await router.push('/institucion/inicio')
    } else {
      await router.push('/login')
    }

    Haptics.impact({ style: ImpactStyle.Medium })
    await notify('Inicio de sesión correcto', 1800)
  } catch (error) {
    await notify(error instanceof Error ? error.message : 'Error al iniciar sesión', 2200)
  }
}
</script>

<style scoped>
.login-shell {
  max-width: 420px;
  margin: 0 auto;
  padding-top: 2rem;
}

.brand-wrap {
  text-align: center;
  margin-bottom: 1.5rem;
}

.brand-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 0.5rem;
}

.brand-wrap h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: 0.12em;
}

.brand-wrap p {
  margin-top: 0.5rem;
  color: #666;
}

.input-item {
  margin-bottom: 0.75rem;
}

.error-text {
  margin-top: 1rem;
  color: #c62828;
  text-align: center;
  font-size: 0.9rem;
}

.info-list {
  margin-top: 1rem;
}
</style>