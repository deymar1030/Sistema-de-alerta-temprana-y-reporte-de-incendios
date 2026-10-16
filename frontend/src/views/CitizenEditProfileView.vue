<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const form = ref({
  firstName: user.value?.firstName ?? user.value?.nombre?.split(' ')[0] ?? '',
  lastName: user.value?.lastName ?? user.value?.nombre?.split(' ').slice(1).join(' ') ?? '',
  phone: user.value?.phone ?? '',
  city: user.value?.city ?? '',
})

const save = () => {
  if (!user.value) return
  user.value.firstName = form.value.firstName
  user.value.lastName = form.value.lastName
  user.value.phone = form.value.phone
  user.value.city = form.value.city
  user.value.nombre = `${form.value.firstName} ${form.value.lastName}`.trim()
  window.alert('Perfil actualizado correctamente')
  router.push('/ciudadano/perfil')
}
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] px-4 py-6 text-slate-800">
    <div class="mx-auto max-w-md rounded-[30px] bg-white p-5 shadow-lg shadow-orange-100">
      <h1 class="text-2xl font-bold text-slate-900">Editar perfil</h1>
      <form class="mt-4 space-y-4" @submit.prevent="save">
        <label class="block text-sm font-medium text-slate-700">
          Nombres
          <input v-model="form.firstName" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" />
        </label>
        <label class="block text-sm font-medium text-slate-700">
          Apellidos
          <input v-model="form.lastName" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" />
        </label>
        <label class="block text-sm font-medium text-slate-700">
          Celular
          <input v-model="form.phone" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" />
        </label>
        <label class="block text-sm font-medium text-slate-700">
          Ciudad
          <input v-model="form.city" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" />
        </label>
        <button type="submit" class="w-full rounded-2xl bg-[#f24a23] px-4 py-3 text-base font-semibold text-white">Guardar cambios</button>
      </form>
    </div>
  </div>
</template>
