<script setup lang="ts">
import { 
  IonButton, IonCheckbox, IonContent, IonIcon, IonInput, IonItem, IonPage, 
  onIonViewWillEnter, alertController, IonModal, IonHeader, IonToolbar, 
  IonTitle, IonButtons 
} from '@ionic/vue'
import { eyeOutline, eyeOffOutline, closeOutline, informationCircleOutline, shieldCheckmarkOutline, eyeOutline as visionOutline, flagOutline } from 'ionicons/icons'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const showPassword = ref(false)

// Estado para el modal de información de pantalla completa
const isInfoModalOpen = ref(false)

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
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="wave-header">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" class="wave-svg">
          <path
            fill="var(--alerta-brand, #f24a23)"
            fill-opacity="0.35"
            d="M0,160L60,170.7C120,181,240,203,360,192C480,181,600,139,720,133.3C840,128,960,160,1080,181.3C1200,203,1320,213,1380,218.7L1440,224L1440,0L0,0Z"
          ></path>
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

          <div class="footer-links">
            <p class="register-row">
              ¿No tienes cuenta? <a href="/registro" class="register-link">Regístrate</a>
            </p>
            <p class="info-row">
              <a href="#" @click.prevent="isInfoModalOpen = true" class="info-link">
                <ion-icon :icon="informationCircleOutline"></ion-icon>
                Acerca de nosotros
              </a>
            </p>
          </div>
        </div>
      </div>

      <!-- Modal de Información a Pantalla Completa -->
      <ion-modal :is-open="isInfoModalOpen" @didDismiss="isInfoModalOpen = false">
        <ion-header class="modal-header-custom">
          <ion-toolbar color="light">
            <ion-buttons slot="start">
              <ion-button @click="isInfoModalOpen = false" color="dark">
                <ion-icon :icon="closeOutline" style="font-size: 28px;"></ion-icon>
              </ion-button>
            </ion-buttons>
            <ion-title class="modal-page-title">Alerta</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="modal-content-full">
          <div class="about-container">
            
            <div class="about-hero">
              <img src="/logo.png" alt="Alerta AVE" class="about-logo" />
              <h2 class="about-title">ALERTA</h2>
              <p class="about-tagline">Protegiendo nuestro entorno, juntos.</p>
            </div>

            <div class="about-section">
              <div class="section-header">
                <ion-icon :icon="shieldCheckmarkOutline" class="section-icon"></ion-icon>
                <h3>¿Quiénes somos?</h3>
              </div>
              <p class="justified-text">
                Somos una plataforma tecnológica de vanguardia diseñada para revolucionar la gestión de emergencias urbanas y el monitoreo de incendios. Nuestro sistema integral conecta directamente a la ciudadanía con las instituciones operativas de respuesta rápida, utilizando tecnología de Internet de las Cosas (IoT), geolocalización precisa y procesamiento de datos en tiempo real para salvaguardar la vida y el patrimonio de nuestra comunidad.
              </p>
            </div>

            <div class="about-section">
              <div class="section-header">
                <ion-icon :icon="flagOutline" class="section-icon"></ion-icon>
                <h3>Nuestra Misión</h3>
              </div>
              <p class="justified-text">
                Proveer un ecosistema digital de alerta temprana que optimice los tiempos de respuesta institucionales. Buscamos dotar a los ciudadanos de una herramienta accesible y confiable para reportar incidentes, al mismo tiempo que proporcionamos a los equipos de emergencia un panel de control operativo que garantice intervenciones coordinadas, seguras y altamente eficaces ante cualquier desastre.
              </p>
            </div>

            <div class="about-section">
              <div class="section-header">
                <ion-icon :icon="visionOutline" class="section-icon"></ion-icon>
                <h3>Nuestra Visión</h3>
              </div>
              <p class="justified-text">
                Consolidarnos como la plataforma líder y el estándar tecnológico nacional en la prevención y gestión de emergencias. Aspiramos a construir ciudades más inteligentes, resilientes y solidarias, donde la colaboración entre la sociedad civil y las autoridades, impulsada por la innovación tecnológica, reduzca drásticamente el impacto de los incendios y otros incidentes críticos.
              </p>
            </div>

            <div class="about-footer">
              <p>Versión 1.0.0</p>
              <p>© 2026 Sistema Alerta AVE</p>
            </div>

          </div>
        </ion-content>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<style scoped>
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

.footer-links {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.register-row {
  margin: 0;
  font-size: 14px;
  color: #8a94a6;
}

.register-link {
  color: var(--alerta-ink, #1c2b45);
  font-weight: 700;
  text-decoration: none;
}

.info-row {
  margin: 0;
}

.info-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--alerta-brand, #f24a23); /* <- Cambiado a rojo */
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.info-link:active {
  opacity: 0.5;
}

.info-link ion-icon {
  font-size: 18px;
  color: var(--alerta-brand, #f24a23);
}

/* Estilos de la Nueva Ventana (Modal Full Screen) */
.modal-header-custom {
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.modal-page-title {
  font-weight: 800;
  color: #1c2b45;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.modal-content-full {
  --background: #fdfdfd;
}

.about-container {
  padding: 32px 24px;
  max-width: 600px;
  margin: 0 auto;
}

.about-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 40px;
}

.about-logo {
  width: 90px;
  height: 90px;
  object-fit: contain;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 12px rgba(242, 74, 35, 0.2));
}

.about-title {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 800;
  color: var(--alerta-brand, #f24a23);
  letter-spacing: 1px;
}

.about-tagline {
  margin: 0;
  font-size: 15px;
  color: #6b7587;
  font-weight: 600;
}

.about-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.03);
  border: 1px solid #f0f0f0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.section-icon {
  font-size: 24px;
  color: var(--alerta-brand, #f24a23);
  background: #fdeeee;
  padding: 6px;
  border-radius: 8px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1c2b45;
}

.justified-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #4a5568;
  text-align: justify; /* Texto justificado como solicitaste */
}

.about-footer {
  margin-top: 40px;
  text-align: center;
  padding-bottom: 20px;
}

.about-footer p {
  margin: 4px 0;
  font-size: 12px;
  font-weight: 700;
  color: #a3acba;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>