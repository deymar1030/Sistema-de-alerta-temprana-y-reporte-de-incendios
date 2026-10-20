<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const submitted = ref(false)

const handleSubmit = () => {
  if (!email.value.trim()) {
    return
  }

  submitted.value = true
}
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] px-4 py-8 text-slate-800">
    <div class="mx-auto max-w-md rounded-[32px] bg-white p-6 shadow-lg shadow-orange-100">
      <p class="text-center text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Recuperación</p>
      <h1 class="mt-3 text-center text-3xl font-bold text-slate-900">Restablecer contraseña</h1>

      <form v-if="!submitted" class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <label class="block text-sm font-medium text-slate-700">
          Correo electrónico
          <input v-model="email" type="email" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="correo@ejemplo.com" />
        </label>
        <button type="submit" class="w-full rounded-2xl bg-[#f24a23] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-200">
          Enviar enlace
        </button>
      </form>

      <div v-else class="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
        Si el correo ingresado está registrado, recibirá instrucciones para restablecer la contraseña.
      </div>

      <button class="mt-5 text-sm font-medium text-orange-600" @click="router.push('/ciudadano/login')">Volver al inicio de sesión</button>
    </div>
  </div>
</template>
