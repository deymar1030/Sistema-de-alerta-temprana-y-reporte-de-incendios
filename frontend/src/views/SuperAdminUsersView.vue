<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useInstitutionStore } from '../stores/institution.store'
import { useUserStore } from '../stores/user.store'
import { getRoleLabel, type UserRole } from '../types'

const institutionStore = useInstitutionStore()
const userStore = useUserStore()
const searchText = ref('')
const selectedRole = ref<'ALL' | UserRole>('ALL')
const showForm = ref(false)

const roleTabs = [
  { key: 'ALL', label: 'Todos' },
  { key: 'ADMIN', label: 'Administradores' },
  { key: 'JEFE_INSTITUCION', label: 'Admin. institución' },
  { key: 'OPERATIVO', label: 'Personal institución' },
  { key: 'CIUDADANO', label: 'Ciudadanos' },
] as const

const form = ref<{
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
  institutionId: string
  status: 'ACTIVE' | 'INACTIVE'
}>({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'ADMIN',
  institutionId: '',
  status: 'ACTIVE',
})

const needsInstitution = computed(() => form.value.role === 'JEFE_INSTITUCION' || form.value.role === 'OPERATIVO')
const institutionOptions = computed(() => institutionStore.institutions)

const roleCounts = computed(() => ({
  ALL: userStore.users.length,
  ADMIN: userStore.users.filter((user) => (user.role ?? user.rol ?? 'CIUDADANO') === 'ADMIN').length,
  JEFE_INSTITUCION: userStore.users.filter((user) => (user.role ?? user.rol ?? 'CIUDADANO') === 'JEFE_INSTITUCION').length,
  OPERATIVO: userStore.users.filter((user) => (user.role ?? user.rol ?? 'CIUDADANO') === 'OPERATIVO').length,
  CIUDADANO: userStore.users.filter((user) => (user.role ?? user.rol ?? 'CIUDADANO') === 'CIUDADANO').length,
}))

const filteredUsers = computed(() => {
  const text = searchText.value.trim().toLowerCase()

  return userStore.users.filter((user) => {
    const role = (user.role ?? user.rol ?? 'CIUDADANO') as UserRole
    const matchesRole = selectedRole.value === 'ALL' || role === selectedRole.value
    const hayBusqueda = !text || `${user.nombre ?? ''} ${user.email ?? ''} ${user.firstName ?? ''} ${user.lastName ?? ''}`.toLowerCase().includes(text)

    return matchesRole && hayBusqueda
  })
})

const resetForm = () => {
  form.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'ADMIN',
    institutionId: '',
    status: 'ACTIVE',
  }
}

watch(
  () => form.value.role,
  (nextRole) => {
    if (nextRole !== 'JEFE_INSTITUCION' && nextRole !== 'OPERATIVO') {
      form.value.institutionId = ''
    }
  },
)

const initializeData = async () => {
  try {
    await institutionStore.fetchInstitutions()
  } catch {
    // Se mantiene el error visible en el store.
  }

  await userStore.fetchUsers()
}

const handleDeleteUser = async (id: string) => {
  const confirmed = window.confirm('¿Deseas eliminar este usuario?')
  if (!confirmed) return

  await userStore.deactivateUser(id)
  await userStore.fetchUsers()
}

const submit = async () => {
  if (!form.value.firstName.trim() || !form.value.lastName.trim()) {
    return
  }

  if (!form.value.email.trim()) {
    return
  }

  if (form.value.password.length < 8) {
    return
  }

  if (needsInstitution.value && !form.value.institutionId) {
    alert('Debe seleccionar una institución.')
    return
  }

  await userStore.createUser({
    role: form.value.role,
    nombre: `${form.value.firstName.trim()} ${form.value.lastName.trim()}`,
    correo: form.value.email.trim(),
    password: form.value.password,
    institutionId: needsInstitution.value ? form.value.institutionId : null,
    status: form.value.status,
    activo: form.value.status === 'ACTIVE',
    phone: '',
  })

  showForm.value = false
  resetForm()
}

onMounted(async () => {
  await initializeData()
})
</script>

<template>
  <div class="space-y-5 p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Administración</p>
        <h1 class="mt-1 text-3xl font-bold text-slate-900">Usuarios del sistema</h1>
      </div>
      <button class="rounded-xl bg-[#f24a23] px-4 py-2.5 font-semibold text-white" @click="showForm = true">+ Crear usuario</button>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-1 items-center gap-3 overflow-x-auto pb-1">
          <button
            v-for="tab in roleTabs"
            :key="tab.key"
            type="button"
            class="rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap"
            :class="selectedRole === tab.key ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'"
            @click="selectedRole = tab.key"
          >
            {{ tab.label }} ({{ roleCounts[tab.key] }})
          </button>
        </div>

        <label class="relative block w-full max-w-md">
          <input
            v-model="searchText"
            type="search"
            placeholder="Buscar por nombre o correo..."
            class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-3 text-sm outline-none focus:border-orange-300"
          />
        </label>
      </div>
    </div>

    <div v-if="showForm" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 class="text-lg font-bold text-slate-900">Crear usuario</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <input v-model="form.firstName" placeholder="Nombres" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
        <input v-model="form.lastName" placeholder="Apellidos" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
        <input v-model="form.email" placeholder="Correo" type="email" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:col-span-2" />
        <input v-model="form.password" placeholder="Contraseña temporal" type="password" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:col-span-2" />
        <select v-model="form.role" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <option value="ADMIN">Administrador</option>
          <option value="JEFE_INSTITUCION">Administrador de la institución</option>
          <option value="OPERATIVO">Personal de la institución</option>
        </select>
        <select v-model="form.status" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select>

        <div v-if="needsInstitution" class="md:col-span-2">
          <label class="block text-sm font-medium text-slate-700">Institución</label>

          <p v-if="institutionStore.loading" class="mt-2 text-sm text-slate-500">Cargando instituciones...</p>
          <p v-else-if="institutionStore.error" class="mt-2 text-sm text-red-600">{{ institutionStore.error }}</p>

          <select v-if="!institutionStore.loading && !institutionStore.error" v-model="form.institutionId" class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <option value="">Seleccione una institución</option>
            <option v-for="institution in institutionOptions" :key="institution.id" :value="institution.id">
              {{ institution.nombre }}
            </option>
          </select>
        </div>
      </div>
      <div class="mt-4 flex gap-3">
        <button class="rounded-xl bg-[#f24a23] px-4 py-2 font-semibold text-white" @click="submit">Guardar</button>
        <button class="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700" @click="showForm = false">Cancelar</button>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-600">
          <tr>
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3">Correo</th>
            <th class="px-4 py-3">Rol</th>
            <th class="px-4 py-3">Institución</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3">Fecha</th>
            <th class="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id" class="border-t border-slate-200">
            <td class="px-4 py-3 font-medium text-slate-800">{{ user.nombre }}</td>
            <td class="px-4 py-3 text-slate-600">{{ user.email }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold uppercase text-orange-700">{{ getRoleLabel(user.role ?? user.rol) }}</span>
            </td>
            <td class="px-4 py-3 text-slate-600">
              {{ user.institutionId ? institutionStore.institutions.find((item) => item.id === user.institutionId)?.nombre ?? '—' : '—' }}
            </td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-1 text-[10px] font-bold uppercase" :class="(user.status ?? 'ACTIVE') === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'">
                {{ (user.status ?? (user.activo ? 'ACTIVE' : 'INACTIVE')) === 'ACTIVE' ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-BO') : 'Reciente' }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button class="text-orange-600" type="button">Editar</button>
                <button class="text-red-600" type="button" @click="handleDeleteUser(user.id)">Eliminar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!filteredUsers.length && !userStore.loading" class="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
        No se encontraron usuarios para este criterio.
      </div>
    </div>
  </div>
</template>
