<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] px-4 py-6 text-slate-800">
    <div class="mx-auto max-w-md rounded-[30px] bg-white p-5 shadow-lg shadow-orange-100">
      <h1 class="text-2xl font-bold text-slate-900">Perfil</h1>

      <div class="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p><span class="font-semibold">Nombre:</span> {{ user?.firstName ?? user?.nombre?.split(' ')[0] ?? 'Ciudadano' }}</p>
        <p><span class="font-semibold">Apellido:</span> {{ user?.lastName ?? user?.nombre?.split(' ').slice(1).join(' ') ?? '-' }}</p>
        <p><span class="font-semibold">Correo:</span> {{ user?.email }}</p>
        <p><span class="font-semibold">Teléfono:</span> {{ user?.phone ?? 'No registrado' }}</p>
        <p><span class="font-semibold">Ciudad:</span> {{ user?.city ?? 'No especificada' }}</p>
        <p><span class="font-semibold">Fecha de registro:</span> {{ user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Reciente' }}</p>
      </div>

      <div class="mt-5 space-y-3">
        <button class="w-full rounded-2xl bg-[#f24a23] px-4 py-3 text-base font-semibold text-white" @click="router.push('/ciudadano/perfil/editar')">Editar perfil</button>
        <button class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-700" @click="router.push('/ciudadano/perfil/cambiar-password')">Cambiar contraseña</button>
      </div>
    </div>
  </div>
</template>
