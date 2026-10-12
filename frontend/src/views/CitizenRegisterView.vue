<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  city: '',
  terms: false,
})

const error = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  error.value = ''

  if (!form.value.firstName || !form.value.lastName || !form.value.email || !form.value.phone || !form.value.password || !form.value.city) {
    error.value = 'Todos los campos obligatorios deben completarse.'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    error.value = 'El correo electrónico no tiene un formato válido.'
    return
  }

  if (form.value.password.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'La confirmación de contraseña no coincide.'
    return
  }

  if (!/^\+?[0-9]{8,15}$/.test(form.value.phone.replace(/\s/g, ''))) {
    error.value = 'El número de celular no tiene un formato válido.'
    return
  }

  if (!form.value.terms) {
    error.value = 'Debes aceptar los términos y condiciones.'
    return
  }

  loading.value = true

  try {
    await authStore.registerCitizen({
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      email: form.value.email,
      phone: form.value.phone,
      city: form.value.city,
      password: form.value.password,
      confirmPassword: form.value.confirmPassword,
    })

    window.alert('Cuenta creada correctamente')
    await router.push('/ciudadano/login')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo crear la cuenta.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] px-4 py-6 text-slate-800">
    <div class="mx-auto max-w-md rounded-[32px] bg-white p-6 shadow-lg shadow-orange-100">
      <p class="text-center text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Registro</p>
      <h1 class="mt-3 text-center text-3xl font-bold text-slate-900">Crea tu cuenta</h1>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm font-medium text-slate-700">
            Nombres
            <input v-model="form.firstName" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="Juan" />
          </label>
          <label class="block text-sm font-medium text-slate-700">
            Apellidos
            <input v-model="form.lastName" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="Pérez" />
          </label>
        </div>

        <label class="block text-sm font-medium text-slate-700">
          Correo electrónico
          <input v-model="form.email" type="email" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="correo@ejemplo.com" />
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Número de celular
          <input v-model="form.phone" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="76543210" />
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Ciudad
          <input v-model="form.city" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="La Paz" />
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Contraseña
          <input v-model="form.password" type="password" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="Mínimo 8 caracteres" />
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Confirmar contraseña
          <input v-model="form.confirmPassword" type="password" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="Repite tu contraseña" />
        </label>

        <label class="flex items-start gap-3 text-sm text-slate-600">
          <input v-model="form.terms" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
          <span>Acepto los términos y condiciones para el uso de ALERTA.</span>
        </label>

        <p v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

        <button type="submit" :disabled="loading" class="w-full rounded-2xl bg-[#f24a23] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-200 disabled:opacity-60">
          {{ loading ? 'Creando cuenta...' : 'Registrarme' }}
        </button>
      </form>
    </div>
  </div>
</template>
