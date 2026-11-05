<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Copy, ShieldCheck } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.store'
import { authService, AuthHttpError } from '../services/auth.service'
import { homeForRole, isCompatibleRedirect } from '../utils/auth-navigation'
import { isMfaCode, type MfaEnrollment } from '../utils/mfa'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const enrollment = ref<MfaEnrollment | null>(null)
const qr = ref('')
const code = ref('')
const error = ref('')
const notice = ref('')
const configuring = ref(false)
const leaving = ref(false)
const now = ref(Date.now())
const codeInput = ref<HTMLInputElement | null>(null)
const heading = ref<HTMLElement | null>(null)
const setupRequired = computed(() => auth.mfaPending?.state === 'CONFIGURACION_REQUERIDA')
const busy = computed(() => auth.loading || configuring.value || leaving.value)
const seconds = computed(() => Math.max(0, Math.ceil(((auth.mfaPending?.expiresAt ?? now.value) - now.value) / 1000)))
const remaining = computed(() => `${Math.floor(seconds.value / 60)}:${String(seconds.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined
let controller: AbortController | undefined
let generation = 0

function clearSensitiveData() {
  generation++
  controller?.abort()
  enrollment.value = null; qr.value = ''; code.value = ''; notice.value = ''
}

function checkExpiry() {
  now.value = Date.now()
  if (auth.mfaPending && seconds.value === 0) {
    clearSensitiveData()
    auth.clearMfa()
    error.value = 'La verificación expiró. Inicia sesión nuevamente para solicitar otra.'
  }
}

async function configure() {
  checkExpiry()
  if (busy.value || !setupRequired.value || enrollment.value) return
  const current = ++generation
  configuring.value = true
  error.value = ''; notice.value = ''
  controller = new AbortController()
  try {
    const result = await authService.configureMfa(controller.signal)
    if (current !== generation || !auth.mfaPending) return
    enrollment.value = result
    try {
      // El secreto se convierte en imagen en este navegador, sin servicios externos.
      const { default: QRCode } = await import('qrcode')
      const image = await QRCode.toDataURL(result.uri, { width: 240, margin: 4, errorCorrectionLevel: 'M' })
      if (current === generation) qr.value = image
    } catch {
      if (current === generation) notice.value = 'No se pudo dibujar el QR. Usa la clave de configuración manual.'
    }
    await nextTick()
    if (current === generation) codeInput.value?.focus()
  } catch (cause) {
    if (current !== generation) return
    if (cause instanceof AuthHttpError && [401, 403].includes(cause.status)) auth.clearMfa()
    error.value = cause instanceof Error ? cause.message : 'No se pudo preparar el autenticador.'
  } finally { configuring.value = false }
}

async function verify() {
  checkExpiry()
  if (busy.value || !auth.mfaPending || (setupRequired.value && !enrollment.value)) return
  error.value = ''; notice.value = ''
  if (!isMfaCode(code.value)) { error.value = 'Ingresa los 6 dígitos que muestra tu autenticador.'; codeInput.value?.focus(); return }
  try {
    const user = await auth.verifyMfa(code.value)
    clearSensitiveData()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
    const role = user.role ?? user.rol
    await router.replace(isCompatibleRedirect(redirect, role) ? redirect! : homeForRole(role))
  } catch (cause) {
    code.value = ''
    error.value = cause instanceof Error ? cause.message : 'No se pudo verificar el código.'
    await nextTick()
    codeInput.value?.focus()
  }
}

async function restart() {
  if (busy.value) return
  leaving.value = true
  clearSensitiveData()
  try {
    await auth.cancelMfa()
    await router.replace({ path: '/login', query: typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {} })
  } finally { leaving.value = false }
}

async function copySecret() {
  if (!enrollment.value) return
  try { await navigator.clipboard.writeText(enrollment.value.secreto); notice.value = 'Clave copiada. Añádela a tu autenticador.' }
  catch { notice.value = 'No se pudo copiar. Selecciona y copia la clave manualmente.' }
}

watch(() => auth.mfaPending, value => { if (!value) clearSensitiveData() })
onMounted(() => { heading.value?.focus(); checkExpiry(); timer = setInterval(checkExpiry, 1000) })
onBeforeUnmount(() => { clearInterval(timer); clearSensitiveData() })
</script>

<template>
  <main class="mfa-screen flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
    <section class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-8" aria-labelledby="mfa-heading">
      <div class="mb-6 flex items-center gap-3 text-orange-800"><ShieldCheck :size="28" aria-hidden="true" /><span class="font-bold tracking-widest">ALERTA</span></div>
      <h1 id="mfa-heading" ref="heading" tabindex="-1" class="text-2xl font-extrabold leading-tight">{{ setupRequired ? 'Configura tu autenticador' : 'Verifica tu identidad' }}</h1>
      <p v-if="auth.mfaPending" class="mt-3 break-words text-sm leading-6 text-slate-600">Esta cuenta requiere una segunda verificación: <strong class="text-slate-800">{{ auth.mfaPending.email }}</strong>.</p>
      <p v-if="auth.mfaPending" class="mt-2 text-sm text-slate-600">Tiempo disponible: <span class="font-semibold tabular-nums">{{ remaining }}</span></p>
      <p v-if="error" id="mfa-error" role="alert" class="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ error }}</p>
      <p v-if="notice" role="status" class="mt-4 text-sm text-slate-700">{{ notice }}</p>

      <template v-if="auth.mfaPending">
        <div v-if="setupRequired" class="mt-5 space-y-4">
          <p class="text-sm leading-6 text-slate-700">Añade esta cuenta a tu aplicación de autenticación y confirma con el código que genere.</p>
          <button v-if="!enrollment" type="button" class="mfa-primary w-full" :disabled="busy" @click="configure">{{ configuring ? 'Preparando configuración…' : 'Configurar autenticador' }}</button>
          <template v-else>
            <img v-if="qr" :src="qr" alt="Código QR para añadir esta cuenta a tu autenticador" width="240" height="240" class="mx-auto max-w-full" />
            <details class="rounded-lg border border-slate-200 px-3 py-2" :open="!qr">
              <summary class="min-h-11 cursor-pointer py-3 text-sm font-semibold">Configurar con una clave manual</summary>
              <p class="mt-1 text-sm text-slate-600">Selecciona una cuenta basada en tiempo (TOTP) en tu aplicación e introduce esta clave:</p>
              <code class="mt-3 block select-all break-all rounded bg-slate-50 p-3 text-sm tracking-wider">{{ enrollment.secreto }}</code>
              <button type="button" class="mfa-secondary mt-1" @click="copySecret"><Copy :size="16" aria-hidden="true" /> Copiar clave</button>
            </details>
          </template>
        </div>

        <form v-if="!setupRequired || enrollment" class="mt-6 space-y-4" @submit.prevent="verify">
          <div>
            <label for="mfa-code" class="block text-sm font-semibold">Código de verificación</label>
            <input id="mfa-code" ref="codeInput" v-model="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required spellcheck="false" :disabled="busy" :aria-invalid="!!error" :aria-describedby="error ? 'mfa-help mfa-error' : 'mfa-help'" class="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-4 text-center font-mono text-2xl tracking-[.3em]" />
            <p id="mfa-help" class="mt-2 text-sm text-slate-600">Ingresa los 6 dígitos actuales de tu aplicación de autenticación.</p>
          </div>
          <button type="submit" class="mfa-primary w-full" :disabled="busy || !isMfaCode(code)">{{ auth.loading ? 'Verificando…' : setupRequired ? 'Confirmar y continuar' : 'Verificar y continuar' }}</button>
        </form>
      </template>

      <p v-else-if="!error" role="status" class="mt-4 text-sm text-slate-700">Inicia sesión nuevamente para verificar tu cuenta.</p>
      <button type="button" class="mfa-secondary mt-5 w-full" :disabled="busy" @click="restart"><ArrowLeft :size="16" aria-hidden="true" /> {{ leaving ? 'Volviendo…' : 'Volver al inicio de sesión' }}</button>
    </section>
  </main>
</template>

<style scoped>
.mfa-primary, .mfa-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 700; }
.mfa-primary { background: #9a3412; color: #fafafa; }
.mfa-primary:hover:not(:disabled) { background: #7c2d12; }
.mfa-secondary { color: #334155; }
.mfa-secondary:hover:not(:disabled) { background: #f1f5f9; }
button:disabled, input:disabled { opacity: .55; cursor: not-allowed; }
button:focus-visible, input:focus-visible, summary:focus-visible { outline: 2px solid #9a3412; outline-offset: 3px; }
h1:focus { outline: none; }
</style>
