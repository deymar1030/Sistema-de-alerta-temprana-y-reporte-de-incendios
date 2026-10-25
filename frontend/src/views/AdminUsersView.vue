<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, Search, UserCheck, UserX, X } from 'lucide-vue-next'
import StatusBadge from '../components/common/StatusBadge.vue'
import { useToast } from '../composables/useToast'
import { useAuthStore } from '../stores/auth.store'
import { useUserStore } from '../stores/user.store'
import type { User } from '../types'

const { showToast } = useToast()
const authStore = useAuthStore()
const userStore = useUserStore()

const institutionId = computed(() => authStore.user?.institucionId ?? '')
const query = ref('')
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  correo: '',
  telefono: '',
  contrasena: '',
})

const visibleUsers = computed(() => {
  const search = query.value.trim().toLowerCase()

  return userStore.users.filter((user) => {
    const matchesRole = user.rol === 'OPERATIVO'
    const matchesInstitution = user.institucionId === institutionId.value
    const hayBusqueda = !search || `${user.nombre} ${user.email}`.toLowerCase().includes(search)
    return matchesRole && matchesInstitution && hayBusqueda
  })
})

const resetForm = () => {
  Object.assign(form, {
    nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    correo: '',
    telefono: '',
    contrasena: '',
  })
}

const openCreate = () => {
  editingId.value = null
  resetForm()
  modalOpen.value = true
}

const openEdit = (user: User) => {
  editingId.value = user.id
  const nombreGenerado = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  const nombreBase = user.nombre ?? (nombreGenerado || user.email)
  Object.assign(form, {
    nombre: user.firstName ?? nombreBase.split(' ')[0] ?? '',
    primer_apellido: user.primerApellido ?? user.lastName ?? '',
    segundo_apellido: user.segundoApellido ?? '',
    correo: user.email,
    telefono: user.telefono ?? '',
    contrasena: '',
  })
  modalOpen.value = true
}

const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const save = async () => {
  if (!form.nombre.trim()) {
    showToast({ type: 'error', title: 'Nombre requerido', description: 'Ingresa el nombre del operativo.' })
    return
  }

  if (!form.correo.trim() || !validateEmail(form.correo.trim())) {
    showToast({ type: 'error', title: 'Correo inválido', description: 'Debe ingresar un correo válido.' })
    return
  }

  if (!institutionId.value) {
    showToast({ type: 'error', title: 'Institución no disponible', description: 'No se pudo determinar la institución del usuario actual.' })
    return
  }

  if (!editingId.value && !form.contrasena.trim()) {
    showToast({ type: 'error', title: 'Contraseña requerida', description: 'Debe ingresar la contraseña del nuevo operativo.' })
    return
  }

  try {
    const payload = {
      role: 'OPERATIVO' as const,
      id_institucion: institutionId.value,
      nombre: form.nombre.trim(),
      primer_apellido: form.primer_apellido.trim(),
      segundo_apellido: form.segundo_apellido.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim(),
      ...(editingId.value ? {} : { contrasena: form.contrasena.trim() }),
    }

    if (editingId.value) {
      await userStore.updateUser(editingId.value, { ...payload, id_institucion: institutionId.value })
      showToast({ type: 'success', title: 'Operativo actualizado', description: 'Se guardaron los cambios del usuario.' })
    } else {
      await userStore.createUser(payload)
      showToast({ type: 'success', title: 'Operativo creado', description: 'El operativo fue registrado correctamente.' })
    }

    modalOpen.value = false
    editingId.value = null
    resetForm()
  } catch (error) {
    showToast({
      type: 'error',
      title: 'No se pudo guardar',
      description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
    })
  }
}

const toggleStatus = async (user: User) => {
  try {
    if (user.activo) {
      await userStore.deactivateUser(user.id)
      showToast({ type: 'info', title: 'Operativo desactivado', description: 'Se inhabilitó el usuario.' })
    } else {
      await userStore.reactivateUser(user.id)
      showToast({ type: 'success', title: 'Operativo reactivado', description: 'El usuario quedó activo nuevamente.' })
    }
  } catch (error) {
    showToast({
      type: 'error',
      title: 'No se pudo actualizar',
      description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
    })
  }
}

onMounted(async () => {
  await userStore.fetchUsers()
})
</script>

<template>
  <div class="space-y-6">
    <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500">Administración institucional</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-900">Personal operativo</h2>
        <p class="mt-2 text-sm text-slate-600">Gestiona operativos de tu institución. Solo se muestran usuarios del mismo centro institucional.</p>
      </div>
      <button class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f24a23] px-4 py-3 text-sm font-semibold text-white" @click="openCreate">
        <Plus class="h-4 w-4" />
        Nuevo operativo
      </button>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label class="relative block w-full max-w-md">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input v-model="query" type="search" placeholder="Buscar por nombre o correo" class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-300" />
        </label>
        <p class="text-sm text-slate-600">{{ visibleUsers.length }} registros</p>
      </div>
    </section>

    <section class="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <table class="min-w-[760px] w-full text-left text-sm">
        <thead class="border-b border-slate-200 text-[10px] uppercase tracking-[0.16em] text-slate-500">
          <tr>
            <th class="pb-3">Nombre</th>
            <th class="pb-3">Correo</th>
            <th class="pb-3">Teléfono</th>
            <th class="pb-3">Estado</th>
            <th class="pb-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in visibleUsers" :key="user.id" class="border-b border-slate-100 last:border-0">
            <td class="py-4 font-semibold text-slate-900">{{ user.nombre }}</td>
            <td class="py-4 text-slate-600">{{ user.email }}</td>
            <td class="py-4 text-slate-600">{{ user.telefono || 'Sin teléfono' }}</td>
            <td class="py-4">
              <StatusBadge :state="user.activo ? 'ACTIVO' : 'INACTIVO'" :tone="user.activo ? 'success' : 'neutral'">{{ user.activo ? 'ACTIVO' : 'INACTIVO' }}</StatusBadge>
            </td>
            <td class="py-4">
              <div class="flex justify-end gap-2">
                <button class="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-orange-200 hover:text-orange-600" title="Editar" @click="openEdit(user)">
                  <Pencil class="h-4 w-4" />
                </button>
                <button class="rounded-lg border border-slate-200 p-2 text-slate-600" :title="user.activo ? 'Desactivar' : 'Reactivar'" @click="toggleStatus(user)">
                  <UserX v-if="user.activo" class="h-4 w-4" />
                  <UserCheck v-else class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!visibleUsers.length && !userStore.loading" class="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
        No se encontraron operativos para esta institución.
      </div>
    </section>

    <div v-if="modalOpen" class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-2 backdrop-blur-sm sm:p-4" @click.self="modalOpen = false">
      <form class="max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6" @submit.prevent="save">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-slate-900">{{ editingId ? 'Editar operativo' : 'Nuevo operativo' }}</h3>
          <button type="button" class="rounded-lg p-2 text-slate-500" @click="modalOpen = false"><X class="h-5 w-5" /></button>
        </div>

        <div class="mt-5 grid gap-4">
          <label class="text-sm font-medium text-slate-700">Nombre
            <input v-model="form.nombre" required class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-300" />
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="text-sm font-medium text-slate-700">Primer apellido
              <input v-model="form.primer_apellido" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-300" />
            </label>
            <label class="text-sm font-medium text-slate-700">Segundo apellido
              <input v-model="form.segundo_apellido" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-300" />
            </label>
          </div>

          <label class="text-sm font-medium text-slate-700">Correo
            <input v-model="form.correo" required type="email" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-300" />
          </label>

          <label class="text-sm font-medium text-slate-700">Teléfono
            <input v-model="form.telefono" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-300" />
          </label>

          <label v-if="!editingId" class="text-sm font-medium text-slate-700">Contraseña
            <input v-model="form.contrasena" required type="password" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-300" />
          </label>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700" @click="modalOpen = false">Cancelar</button>
          <button class="rounded-xl bg-[#f24a23] px-4 py-2.5 text-sm font-semibold text-white">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>
