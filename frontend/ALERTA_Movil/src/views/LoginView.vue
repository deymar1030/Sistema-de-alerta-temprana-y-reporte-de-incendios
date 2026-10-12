<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="login-shell">
        <div class="brand-wrap">
          <img class="brand-logo" src="/logo-alerta-ave.svg" alt="ALERTA logo" />
          <h1>ALERTA</h1>
          <p>Prevención y coordinación de incendios.</p>
        </div>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Login</ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <form @submit.prevent="submitLogin">
              <ion-item class="input-item">
                <ion-label position="stacked">Correo</ion-label>
                <ion-input v-model="email" type="email" autocomplete="email" placeholder="usuario@correo.com" />
              </ion-item>

              <ion-item class="input-item">
                <ion-label position="stacked">Contraseña</ion-label>
                <ion-input v-model="password" type="password" autocomplete="current-password" placeholder="********" />
              </ion-item>

              <ion-button expand="block" type="submit" :disabled="submitting || !email || !password">
                <ion-spinner v-if="submitting" name="crescent" />
                <span v-else>INGRESAR</span>
              </ion-button>

              <div class="links-block">
                <button type="button" class="text-link" @click="recoverPassword">¿Olvidaste tu contraseña?</button>
                <p class="signup-copy">¿No tienes una cuenta?</p>
                <button type="button" class="primary-link" @click="router.push('/register')">CREAR CUENTA</button>
              </div>

              <p v-if="authStore.error" class="error-text">{{ authStore.error }}</p>
            </form>
          </ion-card-content>
        </ion-card>
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
  IonPage,
  IonSpinner,
  toastController,
} from '@ionic/vue'
import { useAuthStore } from '../stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()
const email = ref('ciudadano@alerta.bo')
const password = ref('Ciudadano123')
const submitting = ref(false)

async function notify(message: string) {
  const toast = await toastController.create({
    message,
    duration: 1800,
    position: 'bottom',
  })
  await toast.present()
}

async function recoverPassword() {
  await notify('Contacta a soporte para recuperar tu contraseña.')
}

async function submitLogin() {
  if (!email.value.trim() || !password.value.trim()) {
    authStore.setError('Correo y contraseña son obligatorios.')
    return
  }

  submitting.value = true

  try {
    const user = await authStore.login(email.value.trim(), password.value)

    if (user.role === 'CITIZEN') {
      await router.push('/citizen/home')
    } else if (user.role === 'INSTITUTION_USER') {
      await router.push('/institucion/inicio')
    } else {
      authStore.setError('Este usuario debe ingresar desde la plataforma web.')
      await router.push('/login')
    }

    if (user.role === 'CITIZEN' || user.role === 'INSTITUTION_USER') {
      await notify('Inicio de sesión correcto')
    }
  } catch (error) {
    authStore.setError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.')
  } finally {
    submitting.value = false
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
  margin-bottom: 1.25rem;
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
  color: #64748b;
}

.input-item {
  margin-bottom: 0.75rem;
}

.links-block {
  margin-top: 1rem;
  text-align: center;
}

.text-link,
.primary-link {
  border: none;
  background: transparent;
  font-weight: 700;
  cursor: pointer;
}

.text-link {
  color: #475569;
  display: block;
  width: 100%;
  margin: 0 auto 0.5rem;
}

.signup-copy {
  margin: 0.75rem 0 0.25rem;
  color: #475569;
  font-size: 0.9rem;
}

.primary-link {
  color: #f97316;
  font-size: 1rem;
}

.error-text {
  margin-top: 1rem;
  color: #c62828;
  font-size: 0.9rem;
  text-align: center;
}
</style>
