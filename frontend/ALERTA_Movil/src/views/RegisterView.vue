<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="register-shell">
        <div class="brand-wrap">
          <img class="brand-logo" src="/logo-alerta-ave.svg" alt="ALERTA logo" />
          <h1>ALERTA</h1>
          <p>Registro de ciudadano</p>
        </div>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Crear cuenta</ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <form @submit.prevent="handleSubmit">
              <ion-item class="input-item">
                <ion-label position="stacked">Nombres *</ion-label>
                <ion-input v-model="form.nombre" type="text" placeholder="Nombres" />
              </ion-item>
              <p v-if="errors.nombre" class="field-error">{{ errors.nombre }}</p>

              <ion-item class="input-item">
                <ion-label position="stacked">Primer apellido *</ion-label>
                <ion-input v-model="form.primerApellido" type="text" placeholder="Primer apellido" />
              </ion-item>
              <p v-if="errors.primerApellido" class="field-error">{{ errors.primerApellido }}</p>

              <ion-item class="input-item">
                <ion-label position="stacked">Segundo apellido</ion-label>
                <ion-input v-model="form.segundoApellido" type="text" placeholder="Segundo apellido" />
              </ion-item>
              <p v-if="errors.segundoApellido" class="field-error">{{ errors.segundoApellido }}</p>

              <ion-item class="input-item">
                <ion-label position="stacked">Correo electrónico *</ion-label>
                <ion-input v-model="form.correo" type="email" placeholder="correo@ejemplo.com" />
              </ion-item>
              <p v-if="errors.correo" class="field-error">{{ errors.correo }}</p>

              <ion-item class="input-item">
                <ion-label position="stacked">Número de celular *</ion-label>
                <ion-input v-model="form.telefono" type="tel" placeholder="+591 70012345" />
              </ion-item>
              <p v-if="errors.telefono" class="field-error">{{ errors.telefono }}</p>

              <ion-item class="input-item">
                <ion-label position="stacked">Contraseña *</ion-label>
                <ion-input v-model="form.password" type="password" placeholder="Mínimo 8 caracteres" />
              </ion-item>
              <p v-if="errors.password" class="field-error">{{ errors.password }}</p>

              <ion-item class="input-item">
                <ion-label position="stacked">Confirmar contraseña *</ion-label>
                <ion-input v-model="form.confirmPassword" type="password" placeholder="Repite la contraseña" />
              </ion-item>
              <p v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</p>

              <label class="terms-row">
                <input v-model="form.acceptTerms" type="checkbox" />
                <span>Acepto los términos y condiciones.</span>
              </label>
              <p v-if="errors.acceptTerms" class="field-error">{{ errors.acceptTerms }}</p>

              <p v-if="errors.general" class="error-text">{{ errors.general }}</p>

              <ion-button expand="block" type="submit" :disabled="submitting">
                <ion-spinner v-if="submitting" name="crescent" />
                <span v-else>CREAR CUENTA</span>
              </ion-button>

              <div class="login-link-row">
                <button type="button" class="text-link" @click="router.push('/login')">Ya tengo una cuenta</button>
              </div>
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
const submitting = ref(false)
const form = ref({
  nombre: '',
  primerApellido: '',
  segundoApellido: '',
  correo: '',
  telefono: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
})
const errors = ref<Record<string, string>>({})

const validateForm = () => {
  const nextErrors: Record<string, string> = {}

  if (!form.value.nombre.trim()) nextErrors.nombre = 'Debes ingresar tus nombres.'
  if (!form.value.primerApellido.trim()) nextErrors.primerApellido = 'Debes ingresar tu primer apellido.'
  if (!form.value.correo.trim()) nextErrors.correo = 'El correo es obligatorio.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.correo)) nextErrors.correo = 'Ingresa un correo electrónico válido.'
  if (!form.value.telefono.trim()) nextErrors.telefono = 'El número de celular es obligatorio.'
  if (form.value.password.length < 8) nextErrors.password = 'La contraseña debe tener al menos 8 caracteres.'
  if (!form.value.confirmPassword) nextErrors.confirmPassword = 'Debe confirmar la contraseña.'
  else if (form.value.password !== form.value.confirmPassword) nextErrors.confirmPassword = 'Las contraseñas no coinciden.'
  if (!form.value.acceptTerms) nextErrors.acceptTerms = 'Debes aceptar los términos y condiciones.'

  return nextErrors
}

async function handleSubmit() {
  errors.value = validateForm()
  if (Object.keys(errors.value).length) {
    return
  }

  submitting.value = true

  try {
    const payload = {
      nombre: form.value.nombre.trim(),
      primerApellido: form.value.primerApellido.trim(),
      segundoApellido: form.value.segundoApellido.trim() || null,
      email: form.value.correo.trim().toLowerCase(),
      phone: form.value.telefono.trim(),
      password: form.value.password,
      confirmPassword: form.value.confirmPassword,
    }

    await authStore.register(payload)

    const toast = await toastController.create({
      message: 'Cuenta creada correctamente.',
      duration: 2200,
      position: 'bottom',
    })
    await toast.present()
    await router.replace('/login')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta.'
    errors.value = {
      general: message === 'Este correo electrónico ya está registrado.' ? message : 'No se pudo crear la cuenta.',
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.register-shell {
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
  margin-bottom: 0.2rem;
}

.terms-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin: 1rem 0 0.5rem;
  color: #475569;
  font-size: 0.9rem;
}

.terms-row input {
  margin-top: 0.2rem;
}

.field-error,
.error-text {
  color: #c62828;
  font-size: 0.8rem;
  margin: 0.2rem 0 0.8rem;
}

.login-link-row {
  margin-top: 1rem;
  text-align: center;
}

.text-link {
  border: none;
  background: transparent;
  color: #f97316;
  font-weight: 700;
  cursor: pointer;
}
</style>
