<script setup lang="ts">
import { IonButton, IonCheckbox, IonContent, IonIcon, IonInput, IonItem, IonPage, onIonViewWillEnter  } from '@ionic/vue'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { alertController } from '@ionic/vue';

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const showPassword = ref(false)
onIonViewWillEnter(() => {
  password.value = ''
  showPassword.value = false
})
const handleLogin = async () => {
  if (!email.value || !password.value) return

  isLoading.value = true
  try {
    const user = await authStore.login(email.value, password.value)
    password.value = ''
    if (user.role === 'INSTITUTION_USER') {
    await router.push('/institucion/inicio')
    } else if (user.role === 'CITIZEN') {
      await router.push('/ciudadano/inicio')
    }
  } catch (error: any) {
  const mensaje = error?.message === 'ROL_NO_PERMITIDO'
    ? 'Tu cuenta es de administración. Ingresa desde la plataforma web.'
    : 'El correo o la contraseña son incorrectos'

  const alert = await alertController.create({
    header: 'No se pudo ingresar',
    message: mensaje,
    buttons: ['OK']
  })
  await alert.present()
} 
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="wave-header">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" class="wave-svg">
          <!-- Ola de atrás: tono claro -->
          <path
            fill="var(--alerta-brand, #f24a23)"
            fill-opacity="0.35"
            d="M0,160L60,170.7C120,181,240,203,360,192C480,181,600,139,720,133.3C840,128,960,160,1080,181.3C1200,203,1320,213,1380,218.7L1440,224L1440,0L0,0Z"
          ></path>
          <!-- Ola de adelante: color de la marca -->
          <path
            fill="var(--alerta-brand, #f24a23)"
            fill-opacity="1"
            d="M0,96L60,106.7C120,117,240,139,360,138.7C480,139,600,117,720,106.7C840,96,960,96,1080,112C1200,128,1320,160,1380,176L1440,192L1440,0L0,0Z"
          ></path>
        </svg>
      </div>

      <div class="login-container">
        <div class="avatar-logo">
          <img src="/logo.png" alt="Logo de ALERTA" class="logo-image" />
        </div>

        <header class="title-block">
          <h1 class="app-title">ALERTA</h1>
          <p class="subtitle">Inicia sesión para continuar</p>
        </header>

        <div class="form-group">
          <ion-item lines="none" class="soft-input">
            <ion-input v-model="email" type="email" placeholder="Correo electrónico" />
          </ion-item>

          <ion-item lines="none" class="soft-input">
            <ion-input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Contraseña"
            />
            <ion-button fill="clear" slot="end" class="eye-btn" @click="showPassword = !showPassword">
              <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" color="medium" />
            </ion-button>
          </ion-item>

          <div class="options-row">
            <ion-checkbox
              v-model="rememberMe"
              label-placement="end"
              justify="start"
              class="remember-checkbox"
            >
              Recordarme
            </ion-checkbox>
          </div>

          <ion-button
            expand="block"
            shape="round"
            class="signin-button"
            :disabled="isLoading"
            @click="handleLogin"
          >
            {{ isLoading ? 'Ingresando...' : 'Ingresar' }}
          </ion-button>

          <p class="register-row">
            ¿No tienes cuenta? <a href="/registro" class="register-link">Regístrate</a>
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
/*
  Tipografía: Nunito (redondeada y amable).
  Instálala con:  npm i @fontsource/nunito
  e impórtala en main.ts:
    import '@fontsource/nunito/400.css'
    import '@fontsource/nunito/600.css'
    import '@fontsource/nunito/700.css'
*/
.login-content {
  --background: #ffffff;
  --ion-font-family: 'Nunito', -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-family: var(--ion-font-family);
}

.wave-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 190px;
  z-index: 1;
  pointer-events: none;
}

.wave-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.login-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 420px;
  margin: 0 auto;
  padding: 100px 28px 40px;
}

/* Logo sobre el borde de la ola */
.avatar-logo {
  width: 112px;
  height: 112px;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(28, 43, 69, 0.12);
  overflow: hidden;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 16px;
  box-sizing: border-box;
}

.title-block {
  text-align: center;
  margin: 20px 0 28px;
}

.app-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--alerta-ink, #1c2b45);
}

.subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 400;
  color: #8a94a6;
}

.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Campos suaves, iguales a los del registro */
.soft-input {
  --background: #f5f6f8;
  --border-radius: 14px;
  --padding-start: 16px;
  --inner-padding-end: 8px;
  --min-height: 52px;
  --highlight-color-focused: transparent;
  border: 1px solid transparent;
  border-radius: 14px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.soft-input:focus-within {
  --background: #ffffff;
  border-color: var(--alerta-brand, #f24a23);
}

ion-input {
  --color: var(--alerta-ink, #333);
  --placeholder-color: #a3acba;
  --placeholder-opacity: 1;
  font-size: 15px;
  font-weight: 400;
}

.eye-btn {
  margin: 0;
}

.options-row {
  display: flex;
  padding-left: 4px;
}

.remember-checkbox {
  font-size: 13px;
  color: #6b7587;
  --size: 18px;
  --border-radius: 6px;
  --border-color: #c9cfd9;
  --checkbox-background-checked: var(--alerta-brand, #f24a23);
  --border-color-checked: var(--alerta-brand, #f24a23);
}

.signin-button {
  --background: var(--alerta-brand, #f24a23);
  --background-activated: var(--alerta-brand, #f24a23);
  --color: #ffffff;
  --border-radius: 14px;
  --box-shadow: 0 6px 16px rgba(242, 74, 35, 0.22);
  margin: 8px 0 0;
  height: 52px;
  font-size: 15px;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0;
}

.register-row {
  text-align: center;
  margin: 8px 0 0;
  font-size: 14px;
  color: #8a94a6;
}

.register-link {
  color: var(--alerta-ink, #1c2b45);
  font-weight: 700;
  text-decoration: none;
}
</style>