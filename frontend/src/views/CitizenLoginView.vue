<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('ciudadano@alerta.bo')
const password = ref('Ciudadano123')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    await authStore.login(email.value, password.value)
    await router.push('/ciudadano/inicio')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Correo o contraseña incorrectos'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] px-4 py-8 text-slate-800">
    <div class="mx-auto max-w-md rounded-[32px] bg-white p-6 shadow-lg shadow-orange-100">
      <div class="flex items-center justify-center">
        <img src="/logo-alerta-ave.svg" alt="ALERTA" class="h-16 w-16" />
      </div>
      <p class="mt-4 text-center text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Ciudadano</p>
      <h1 class="mt-3 text-center text-3xl font-bold text-slate-900">Inicia sesión</h1>

      <form class="mt-6 space-y-4" @submit.prevent="handleLogin">
        <label class="block text-sm font-medium text-slate-700">
          Correo electrónico
          <input v-model="email" type="email" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="correo@ejemplo.com" />
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Contraseña
          <input v-model="password" type="password" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="********" />
        </label>

        <p v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

        <button type="submit" :disabled="loading" class="w-full rounded-2xl bg-[#f24a23] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-200 disabled:opacity-60">
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <div class="mt-5 text-center">
        <button class="text-sm font-medium text-orange-600" @click="router.push('/ciudadano/recuperar-password')">¿Olvidaste tu contraseña?</button>
      </div>

      <div class="mt-6 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
        <p>Cuenta demo:</p>
        <p class="mt-1 font-medium">ciudadano@alerta.bo / Ciudadano123</p>
      </div>
    </div>
  </div>
</template>
