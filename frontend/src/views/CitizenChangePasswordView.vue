<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const form = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const error = ref('')

const save = async () => {
  try {
    await authStore.changePassword(form.value.currentPassword, form.value.newPassword, form.value.confirmPassword)
    window.alert('Contraseña actualizada correctamente')
    router.push('/ciudadano/perfil')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] px-4 py-6 text-slate-800">
    <div class="mx-auto max-w-md rounded-[30px] bg-white p-5 shadow-lg shadow-orange-100">
      <h1 class="text-2xl font-bold text-slate-900">Cambiar contraseña</h1>
      <form class="mt-4 space-y-4" @submit.prevent="save">
        <label class="block text-sm font-medium text-slate-700">
          Contraseña actual
          <input v-model="form.currentPassword" type="password" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" />
        </label>
        <label class="block text-sm font-medium text-slate-700">
          Nueva contraseña
          <input v-model="form.newPassword" type="password" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" />
        </label>
        <label class="block text-sm font-medium text-slate-700">
          Confirmar nueva contraseña
          <input v-model="form.confirmPassword" type="password" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" />
        </label>
        <p v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
        <button type="submit" class="w-full rounded-2xl bg-[#f24a23] px-4 py-3 text-base font-semibold text-white">Guardar contraseña</button>
      </form>
    </div>
  </div>
</template>
