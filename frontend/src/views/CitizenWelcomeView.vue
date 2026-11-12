<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] px-4 py-8 text-slate-800">
    <div class="mx-auto max-w-md rounded-[32px] bg-white p-6 shadow-lg shadow-orange-100">
      <div class="flex items-center justify-center">
        <img src="/logo-alerta-ave.svg" alt="ALERTA" class="h-20 w-20" />
      </div>
      <p class="mt-6 text-center text-xs font-bold uppercase tracking-[0.3em] text-orange-500">ALERTA</p>
      <h1 class="mt-4 text-center text-3xl font-bold text-slate-900">Tu seguridad, reportada a tiempo</h1>
      <p class="mt-3 text-center text-sm text-slate-600">
        Reporta incendios, consulta alertas y recibe instrucciones de emergencia desde tu teléfono.
      </p>

      <div class="mt-8 space-y-3">
        <button class="w-full rounded-2xl bg-[#f24a23] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-200" @click="router.push('/ciudadano/registro')">
          Crear cuenta
        </button>
        <button class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base font-semibold text-slate-700" @click="router.push('/ciudadano/login')">
          Iniciar sesión
        </button>
      </div>
    </div>
  </div>
</template>
