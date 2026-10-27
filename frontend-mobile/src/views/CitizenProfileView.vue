
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button
            text="Volver"
            default-href="/ciudadano/inicio"
          />
        </ion-buttons>

        <ion-title>Mi perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <section
        class="profile-shell"
        aria-labelledby="profile-title"
      >
        <ion-card class="profile-card">
          <ion-card-header>
            <ion-card-subtitle>
              CUENTA CIUDADANA
            </ion-card-subtitle>

            <ion-card-title id="profile-title">
              {{ user?.name || 'Ciudadano' }}
            </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <dl class="details">
              <div class="detail-row">
                <dt>Nombre</dt>
                <dd>
                  {{ user?.name || 'No registrado' }}
                </dd>
              </div>

              <div class="detail-row">
                <dt>Correo</dt>
                <dd>
                  {{ user?.email || 'No registrado' }}
                </dd>
              </div>

              <div class="detail-row">
                <dt>Teléfono</dt>
                <dd>
                  {{ user?.phone || 'No registrado' }}
                </dd>
              </div>

              <div class="detail-row">
                <dt>Ciudad</dt>
                <dd>
                  {{ user?.city || 'No especificada' }}
                </dd>
              </div>
            </dl>
          </ion-card-content>
        </ion-card>

        <ion-button
          expand="block"
          color="danger"
          class="logout-button"
          :disabled="signingOut"
          @click="handleLogout"
        >
          {{
            signingOut
              ? 'Cerrando sesión...'
              : 'Cerrar sesión'
          }}
        </ion-button>

        <p
          v-if="logoutError"
          class="error-message"
          role="alert"
        >
          {{ logoutError }}
        </p>
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'

import { useAuthStore } from '../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const signingOut = ref(false)
const logoutError = ref('')

async function handleLogout() {
  if (signingOut.value) return

  const confirmed = window.confirm(
    '¿Deseas cerrar tu sesión de ALERTA?'
  )

  if (!confirmed) return

  signingOut.value = true
  logoutError.value = ''

  try {
    await authStore.logout()

    await router.replace('/login')
  } catch (error) {
    logoutError.value =
      error instanceof Error
        ? error.message
        : 'No se pudo cerrar la sesión. Intenta de nuevo.'
  } finally {
    signingOut.value = false
  }
}
</script>

<style scoped>
.profile-shell {
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  padding-bottom: max(
    16px,
    env(safe-area-inset-bottom)
  );
}

.profile-card {
  margin: 0 0 18px;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
}

.details {
  margin: 0;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 11px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row dt {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.detail-row dd {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
  overflow-wrap: anywhere;
}

.logout-button {
  min-height: 48px;
  --border-radius: 12px;
}

.error-message {
  margin: 14px 4px 0;
  padding: 12px;
  border-radius: 10px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 14px;
  overflow-wrap: anywhere;
}
</style>
