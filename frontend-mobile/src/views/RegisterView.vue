<script setup lang="ts">
import {
  IonButton, IonCheckbox, IonContent, IonIcon, IonInput,
  IonItem, IonModal, IonPage, IonToast
} from '@ionic/vue'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/auth.service'

const router = useRouter()

// Variables del formulario
const nombre = ref('')
const primer_apellido = ref('')
const segundo_apellido = ref('')
const telefono = ref('')
const correo = ref('')
const contrasena = ref('')
const terminos = ref(false)

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const toastOpen = ref(false)
const terminosAbiertos = ref(false)

const abrirTerminos = () => {
  terminosAbiertos.value = true
}

const aceptarTerminos = () => {
  terminos.value = true
  terminosAbiertos.value = false
}

const errores = ref({
  nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  telefono: '',
  correo: '',
  contrasena: '',
  terminos: ''
})

const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const regexPassword = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

// Filtro en tiempo real para bloquear letras en el teléfono
const soloNumeros = (event: any) => {
  telefono.value = event.target.value.replace(/[^0-9]/g, '')
}

// Observadores para validación en tiempo real (mientras escribe)
watch(nombre, (valor) => {
  if (valor.length > 0) {
    if (valor.trim().length < 3) errores.value.nombre = 'Mínimo 3 letras.'
    else if (!regexLetras.test(valor)) errores.value.nombre = 'Sin números ni símbolos.'
    else errores.value.nombre = ''
  } else errores.value.nombre = ''
})

watch(primer_apellido, (valor) => {
  if (valor.length > 0) {
    if (valor.trim().length < 3) errores.value.primer_apellido = 'Mínimo 3 letras.'
    else if (!regexLetras.test(valor)) errores.value.primer_apellido = 'Sin números ni símbolos.'
    else errores.value.primer_apellido = ''
  } else errores.value.primer_apellido = ''
})

watch(segundo_apellido, (valor) => {
  if (valor.length > 0) {
    if (valor.trim().length < 3) errores.value.segundo_apellido = 'Mínimo 3 letras.'
    else if (!regexLetras.test(valor)) errores.value.segundo_apellido = 'Sin números ni símbolos.'
    else errores.value.segundo_apellido = ''
  } else errores.value.segundo_apellido = ''
})

watch(telefono, (valor) => {
  if (valor.length > 0) {
    if (valor.length < 8) errores.value.telefono = 'Mínimo 8 dígitos.'
    else errores.value.telefono = ''
  } else errores.value.telefono = ''
})

watch(correo, (valor) => {
  if (valor.length > 0) {
    if (!regexCorreo.test(valor)) errores.value.correo = 'Correo electrónico inválido.'
    else errores.value.correo = ''
  } else errores.value.correo = ''
})

watch(contrasena, (valor) => {
  if (valor.length > 0) {
    if (!regexPassword.test(valor)) errores.value.contrasena = 'Mínimo 8 caracteres (incluye letras y números).'
    else errores.value.contrasena = ''
  } else errores.value.contrasena = ''
})

watch(terminos, (valor) => {
  if (valor) errores.value.terminos = ''
})

const showToast = (msg: string) => {
  errorMessage.value = msg
  toastOpen.value = true
}

// Validación final al presionar el botón
const handleRegister = async () => {
  let isValid = true

  if (nombre.value.trim().length < 3 || !regexLetras.test(nombre.value)) {
    errores.value.nombre = 'Nombre inválido.'
    isValid = false
  }
  if (primer_apellido.value.trim().length < 3 || !regexLetras.test(primer_apellido.value)) {
    errores.value.primer_apellido = 'Apellido inválido.'
    isValid = false
  }
  if (segundo_apellido.value.trim().length > 0 && (segundo_apellido.value.trim().length < 3 || !regexLetras.test(segundo_apellido.value))) {
    errores.value.segundo_apellido = 'Apellido inválido.'
    isValid = false
  }
  if (telefono.value.trim().length < 8) {
    errores.value.telefono = 'Teléfono inválido (mínimo 8 dígitos).'
    isValid = false
  }
  if (!regexCorreo.test(correo.value)) {
    errores.value.correo = 'Correo electrónico inválido.'
    isValid = false
  }
  if (!regexPassword.test(contrasena.value)) {
    errores.value.contrasena = 'Contraseña débil.'
    isValid = false
  }
  if (!terminos.value) {
    errores.value.terminos = 'Debes aceptar los Términos y Condiciones.'
    isValid = false
  }

  if (!isValid) return

  isLoading.value = true
  try {
    await authService.register({
      nombre: nombre.value.trim(),
      primer_apellido: primer_apellido.value.trim(),
      segundo_apellido: segundo_apellido.value.trim(),
      telefono: telefono.value.trim(),
      correo: correo.value.trim(),
      contrasena: contrasena.value
    })

    await router.push('/login')
  } catch (error: any) {
    if (error.message === 'CORREO_YA_REGISTRADO') {
      showToast('Este correo ya está registrado')
    } else {
      showToast('Error al crear la cuenta. Intenta de nuevo.')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true" class="register-content">
      <div class="wave-header">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" class="wave-svg">
          <!-- Ola de atrás: naranja claro -->
          <path
            fill="var(--alerta-brand, #f28723)"
            fill-opacity="0.35"
            d="M0,160L60,170.7C120,181,240,203,360,192C480,181,600,139,720,133.3C840,128,960,160,1080,181.3C1200,203,1320,213,1380,218.7L1440,224L1440,0L0,0Z"
          ></path>
          <!-- Ola de adelante: naranja de la marca -->
          <path
            fill="var(--alerta-brand, #f28723)"
            fill-opacity="1"
            d="M0,96L60,106.7C120,117,240,139,360,138.7C480,139,600,117,720,106.7C840,96,960,96,1080,112C1200,128,1320,160,1380,176L1440,192L1440,0L0,0Z"
          ></path>
        </svg>
      </div>

      <div class="form-container">
        <header class="title-block">
          <h1 class="title">Registrate</h1>
          <p class="subtitle">Completa tus datos para comenzar</p>
        </header>

        <div class="form-group">
          <div class="field">
            <ion-item lines="none" class="soft-input">
              <ion-input v-model="nombre" type="text" placeholder="Nombre" />
            </ion-item>
            <span v-if="errores.nombre" class="error-text">{{ errores.nombre }}</span>
          </div>

          <div class="field">
            <ion-item lines="none" class="soft-input">
              <ion-input v-model="primer_apellido" type="text" placeholder="Primer apellido" />
            </ion-item>
            <span v-if="errores.primer_apellido" class="error-text">{{ errores.primer_apellido }}</span>
          </div>

          <div class="field">
            <ion-item lines="none" class="soft-input">
              <ion-input v-model="segundo_apellido" type="text" placeholder="Segundo apellido (opcional)" />
            </ion-item>
            <span v-if="errores.segundo_apellido" class="error-text">{{ errores.segundo_apellido }}</span>
          </div>

          <div class="field">
            <ion-item lines="none" class="soft-input">
              <ion-input
                v-model="telefono"
                type="tel"
                inputmode="numeric"
                placeholder="Teléfono"
                @ionInput="soloNumeros">
              </ion-input>
            </ion-item>
            <span v-if="errores.telefono" class="error-text">{{ errores.telefono }}</span>
          </div>

          <div class="field">
            <ion-item lines="none" class="soft-input">
              <ion-input v-model="correo" type="email" placeholder="Correo electrónico" />
            </ion-item>
            <span v-if="errores.correo" class="error-text">{{ errores.correo }}</span>
          </div>

          <div class="field">
            <ion-item lines="none" class="soft-input">
              <ion-input v-model="contrasena" :type="showPassword ? 'text' : 'password'" placeholder="Contraseña" />
              <ion-button fill="clear" slot="end" @click="showPassword = !showPassword" class="eye-btn">
                <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" color="medium" />
              </ion-button>
            </ion-item>
            <span v-if="errores.contrasena" class="error-text">{{ errores.contrasena }}</span>
          </div>

          <div class="terms-container">
            <ion-checkbox v-model="terminos" class="custom-checkbox"></ion-checkbox>
            <span class="terms-text">Acepto los <a href="#" @click.prevent="abrirTerminos">Términos y Condiciones</a></span>
          </div>
          <span v-if="errores.terminos" class="error-text error-center">{{ errores.terminos }}</span>

          <ion-button expand="block" shape="round" class="submit-button" :disabled="isLoading" @click="handleRegister">
            {{ isLoading ? 'Registrando...' : 'Crear cuenta' }}
          </ion-button>

          <p class="login-row">
            ¿Ya tienes cuenta? <a href="/login" class="login-link">Inicia sesión</a>
          </p>
        </div>
      </div>

      <ion-modal
        :is-open="terminosAbiertos"
        class="terms-modal"
        @didDismiss="terminosAbiertos = false"
      >
        <div class="terms-card">
          <h2 class="terms-title">Términos y Condiciones</h2>

          <div class="terms-body">
            <h3>Uso de ubicación y cámara</h3>
            <p>
              Al aceptar, autorizas el uso de tu <strong>ubicación</strong> para registrar el lugar
              de una alerta y mostrarte información cercana, y de tu <strong>cámara</strong> para
              tomar fotos o videos que respalden tus reportes. Solo se usan mientras utilizas la
              aplicación.
            </p>

            <h3>Aceptación</h3>
            <p>
              Al crear una cuenta aceptas estos términos. Si no estás de acuerdo,
              te pedimos que no uses el servicio.
            </p>

            <h3>Datos personales</h3>
            <p>
              Guardamos tu nombre, apellidos, teléfono y correo para gestionar tu cuenta.
              No los compartimos con terceros sin tu consentimiento, salvo que la ley lo exija.
            </p>

            <h3>Uso responsable</h3>
            <p>
              Te comprometes a enviar información verídica y a no hacer reportes falsos.
              Eres responsable de la confidencialidad de tu contraseña.
            </p>

            <h3>Cambios</h3>
            <p>
              Podemos actualizar estos términos. Si los cambios son importantes,
              te avisaremos dentro de la aplicación.
            </p>
          </div>

          <div class="terms-actions">
            <ion-button fill="clear" class="terms-close" @click="terminosAbiertos = false">
              Cerrar
            </ion-button>
            <ion-button class="submit-button terms-accept" @click="aceptarTerminos">
              Aceptar
            </ion-button>
          </div>
        </div>
      </ion-modal>

      <ion-toast
        :is-open="toastOpen"
        :message="errorMessage"
        :duration="3000"
        @didDismiss="toastOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<style scoped>
.register-content {
  --background: #ffffff;
}

.wave-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 180px;
  z-index: 1;
  pointer-events: none;
}

.wave-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.form-container {
  position: relative;
  z-index: 2;
  max-width: 420px;
  margin: 0 auto;
  padding: 100px 28px 40px;
  display: flex;
  flex-direction: column;
}

/* Título centrado */
.title-block {
  text-align: center;
  margin-bottom: 36px;
}

.title {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--alerta-ink, #1c2b45);
}

.subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 400;
  color: #8a94a6;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Campos suaves: fondo gris muy claro, bordes redondeados, sin líneas fuertes */
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
  border-color: var(--alerta-brand, #f28723);
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

.error-text {
  color: #c4574f;
  font-size: 12px;
  font-weight: 400;
  padding-left: 6px;
}

.error-center {
  text-align: center;
  padding-left: 0;
}

.terms-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  gap: 8px;
}

.custom-checkbox {
  width: auto;
  flex: none;
  margin: 0;
  --size: 18px;
  --border-radius: 6px;
  --border-color: #c9cfd9;
  --checkbox-background-checked: var(--alerta-brand, #f28723);
  --border-color-checked: var(--alerta-brand, #f28723);
}

.terms-text {
  font-size: 13px;
  color: #6b7587;
}

.terms-text a {
  color: var(--alerta-brand, #f28723);
  text-decoration: none;
}

.submit-button {
  --background: var(--alerta-brand, #f28723);
  --background-activated: var(--alerta-brand, #f28723);
  --color: #ffffff;
  --box-shadow: none;
  --border-radius: 14px;
  margin: 12px 0 0;
  height: 52px;
  font-size: 15px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
}

.login-row {
  text-align: center;
  margin: 8px 0 0;
  font-size: 14px;
  color: #8a94a6;
}

.login-link {
  color: var(--alerta-ink, #1c2b45);
  font-weight: 600;
  text-decoration: none;
}

/* Modal de términos y condiciones (recuadro pequeño) */
ion-modal.terms-modal {
  --width: 88%;
  --max-width: 380px;
  --height: auto;
  --max-height: 80%;
  --border-radius: 20px;
  --box-shadow: 0 10px 40px rgba(28, 43, 69, 0.18);
  --backdrop-opacity: 0.35;
  align-items: center;
  justify-content: center;
}

.terms-card {
  display: flex;
  flex-direction: column;
  padding: 24px 22px 16px;
  background: #ffffff;
}

.terms-title {
  margin: 0 0 12px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--alerta-ink, #1c2b45);
}

.terms-body {
  max-height: 45vh;
  overflow-y: auto;
  padding-right: 4px;
}

.terms-body h3 {
  margin: 14px 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--alerta-ink, #1c2b45);
}

.terms-body h3:first-child {
  margin-top: 0;
}

.terms-body p {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: #6b7587;
}

.terms-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.terms-close {
  --color: #8a94a6;
  text-transform: none;
  font-weight: 500;
}

.terms-accept {
  margin: 0;
  height: 44px;
  min-width: 110px;
  --border-radius: 12px;
}
</style>