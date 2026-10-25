<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, RefreshCw, Search, UserCheck, UserX, X } from 'lucide-vue-next'
import { useInstitutionStore } from '../stores/institution.store'
import { useUserStore } from '../stores/user.store'
import { userService, type CreateUserInput } from '../services/user.service'
import { getRoleLabel, type User, type UserRole } from '../types'

const institutions = useInstitutionStore()
const users = useUserStore()
const search = ref('')
const roleFilter = ref<UserRole | 'TODOS'>('TODOS')
const editingId = ref<string | null>(null)
const originalRole = ref<UserRole | null>(null)
const loadingUserId = ref<string | null>(null)
const modalOpen = ref(false)
const saving = ref(false)
const actionError = ref('')
const successMessage = ref('')

const form = reactive({
  nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  correo: '',
  telefono: '',
  contrasena: '',
  role: 'CIUDADANO' as UserRole,
  institutionId: '',
})

const roles: Array<{ value: UserRole | 'TODOS'; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ADMIN', label: 'Administradores' },
  { value: 'AUDITOR', label: 'Auditores' },
  { value: 'JEFE_INSTITUCION', label: 'Jefes de institución' },
  { value: 'OPERATIVO', label: 'Operativos' },
  { value: 'CIUDADANO', label: 'Ciudadanos' },
]

// AUDITOR es un rol válido para listar, pero no se habilita su asignación
// desde este formulario sin confirmar los permisos del backend.
const formRoles: Array<{ value: UserRole; label: string }> = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'JEFE_INSTITUCION', label: 'Jefe de institución' },
  { value: 'OPERATIVO', label: 'Operativo' },
  { value: 'CIUDADANO', label: 'Ciudadano' },
]

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return users.users.filter((user) => {
    const role = user.role ?? user.rol
    if (roleFilter.value !== 'TODOS' && role !== roleFilter.value) return false
    return [user.nombre, user.email, user.phone, user.id, role]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

const needsInstitution = computed(
  () => form.role === 'JEFE_INSTITUCION' || form.role === 'OPERATIVO',
)
const lockedAuditorRole = computed(
  () => editingId.value !== null && originalRole.value === 'AUDITOR',
)

function reset() {
  Object.assign(form, {
    nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    correo: '',
    telefono: '',
    contrasena: '',
    role: 'CIUDADANO',
    institutionId: '',
  })
  editingId.value = null
  originalRole.value = null
  actionError.value = ''
}

function openCreate() {
  reset()
  successMessage.value = ''
  modalOpen.value = true
}

async function openEdit(user: User) {
  actionError.value = ''
  successMessage.value = ''
  loadingUserId.value = user.id
  try {
    // Se consulta el detalle porque el store de listados no conserva firstName.
    // Usar el nombre completo de la tabla duplicaría los apellidos al guardar.
    const detail = await userService.getUserById(user.id)
    reset()
    editingId.value = detail.id
    originalRole.value = detail.role ?? detail.rol ?? null
    form.nombre = detail.firstName ?? ''
    form.primer_apellido = detail.primerApellido ?? ''
    form.segundo_apellido = detail.segundoApellido ?? ''
    form.correo = detail.email
    form.telefono = detail.telefono ?? detail.phone ?? ''
    form.role = detail.role ?? detail.rol ?? 'CIUDADANO'
    form.institutionId = detail.institutionId ?? detail.institucionId ?? ''
    modalOpen.value = true
  } catch (error) {
    actionError.value = error instanceof Error
      ? error.message
      : 'No se pudo consultar el detalle del usuario.'
  } finally {
    loadingUserId.value = null
  }
}

function close() {
  if (!saving.value) modalOpen.value = false
}

async function refresh() {
  await Promise.all([institutions.fetchInstitutions(), users.fetchUsers()])
}

onMounted(() => { void refresh() })

async function save() {
  actionError.value = ''
  if (!form.nombre.trim() || !form.correo.trim()) {
    actionError.value = 'Nombre y correo son obligatorios.'
    return
  }
  if (!editingId.value && form.contrasena.trim().length < 8) {
    actionError.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }
  if (form.contrasena.trim() && form.contrasena.trim().length < 8) {
    actionError.value = 'La nueva contraseña debe tener al menos 8 caracteres.'
    return
  }
  if (needsInstitution.value && !form.institutionId) {
    actionError.value = 'Selecciona una institución para este usuario.'
    return
  }

  const payload: CreateUserInput = {
    nombre: form.nombre.trim(),
    primer_apellido: form.primer_apellido.trim(),
    segundo_apellido: form.segundo_apellido.trim(),
    correo: form.correo.trim().toLowerCase(),
    telefono: form.telefono.trim(),
    ...(lockedAuditorRole.value ? {} : { nombre_rol: form.role }),
    ...(!lockedAuditorRole.value
      ? { id_institucion: needsInstitution.value ? form.institutionId : null }
      : {}),
    ...(form.contrasena.trim() ? { contrasena: form.contrasena } : {}),
  }

  saving.value = true
  try {
    const editing = editingId.value
    if (editing) await users.updateUser(editing, payload)
    else await users.createUser(payload)
    modalOpen.value = false
    successMessage.value = `Usuario ${editing ? 'actualizado' : 'creado'} correctamente.`
    await users.fetchUsers()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'No se pudo guardar el usuario.'
  } finally {
    saving.value = false
  }
}

async function toggle(user: User) {
  const verb = user.activo ? 'desactivar' : 'reactivar'
  if (!window.confirm(`¿Quieres ${verb} a ${user.nombre}?`)) return

  actionError.value = ''
  successMessage.value = ''
  try {
    if (user.activo) await users.deactivateUser(user.id)
    else await users.reactivateUser(user.id)
    await users.fetchUsers()
    if (users.error) throw new Error(users.error)
    successMessage.value = 'El estado del usuario se actualizó correctamente.'
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'No se pudo cambiar el estado.'
  }
}

function institutionName(user: User) {
  const id = user.institutionId ?? user.institucionId
  if (!id) return 'No asignada'
  return institutions.institutions.find((item) => item.id === id)?.nombre
    ?? 'Institución no encontrada'
}
</script>

<template>
  <div class="admin-page mx-auto max-w-[1600px] space-y-5">
    <header class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-wider text-orange-600">Administración</p>
        <h1 class="mt-1 break-words text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Usuarios del sistema
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Gestiona cuentas, roles e instituciones. Los cambios se guardan en el servidor.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        :disabled="loadingUserId !== null"
        @click="openCreate"
      >
        <Plus class="h-5 w-5" /> Crear usuario
      </button>
    </header>

    <p
      v-if="successMessage"
      role="status"
      class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
    >{{ successMessage }}</p>
    <p
      v-if="actionError && !modalOpen"
      role="alert"
      class="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >{{ actionError }}</p>

    <section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex min-w-0 flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
        <div class="flex min-w-0 gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar usuarios por rol">
          <button
            v-for="item in roles"
            :key="item.value"
            type="button"
            class="min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors"
            :class="roleFilter === item.value
              ? 'border-orange-500 bg-orange-50 text-orange-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
            :aria-pressed="roleFilter === item.value"
            @click="roleFilter = item.value"
          >{{ item.label }}</button>
        </div>
        <div class="flex min-w-0 items-center gap-2">
          <label class="relative min-w-0 flex-1 lg:w-64 lg:flex-none">
            <span class="sr-only">Buscar usuarios</span>
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              v-model="search"
              type="search"
              placeholder="Buscar usuarios"
              class="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-orange-500"
            />
          </label>
          <button
            type="button"
            class="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Actualizar lista de usuarios"
            :disabled="users.loading"
            @click="refresh"
          ><RefreshCw class="h-4 w-4" /></button>
        </div>
      </div>

      <p v-if="users.loading" class="p-10 text-center text-sm text-slate-600">Cargando usuarios...</p>
      <p v-else-if="users.error" role="alert" class="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {{ users.error }}
      </p>
      <p v-else-if="!filtered.length" class="p-10 text-center text-sm text-slate-600">
        No se encontraron usuarios para este filtro.
      </p>
      <template v-else>
        <!-- Tarjetas en teléfonos: sin tabla horizontal ni texto fuera del recuadro. -->
        <div class="space-y-3 p-4 md:hidden">
          <article v-for="user in filtered" :key="user.id" class="min-w-0 rounded-xl border border-slate-200 p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <p class="min-w-0 break-words font-bold text-slate-900">{{ user.nombre }}</p>
              <span
                class="rounded-full px-2 py-1 text-xs font-semibold"
                :class="user.activo ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'"
              >{{ user.activo ? 'Activo' : 'Inactivo' }}</span>
            </div>
            <p class="mt-2 break-all text-sm text-slate-600">{{ user.email }}</p>
            <p class="mt-1 break-words text-sm text-slate-600">
              {{ getRoleLabel(user.role ?? user.rol) }} · {{ institutionName(user) }}
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700"
                :disabled="loadingUserId !== null"
                @click="openEdit(user)"
              ><Pencil class="h-4 w-4" />{{ loadingUserId === user.id ? 'Cargando...' : 'Editar' }}</button>
              <button
                type="button"
                class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700"
                @click="toggle(user)"
              ><component :is="user.activo ? UserX : UserCheck" class="h-4 w-4" />
                {{ user.activo ? 'Desactivar' : 'Reactivar' }}
              </button>
            </div>
          </article>
        </div>

        <!-- Tabla en tablet/escritorio con scroll interno si falta espacio. -->
        <div class="hidden max-w-full overflow-x-auto md:block">
          <table class="w-full min-w-[870px] text-left text-sm">
            <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th class="px-4 py-4">Nombre</th>
                <th class="px-4 py-4">Correo</th>
                <th class="px-4 py-4">Rol</th>
                <th class="px-4 py-4">Institución</th>
                <th class="px-4 py-4">Estado</th>
                <th class="px-4 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filtered" :key="user.id" class="border-t border-slate-100 hover:bg-slate-50">
                <td class="max-w-48 break-words px-4 py-4 font-semibold text-slate-900">{{ user.nombre }}</td>
                <td class="max-w-52 break-all px-4 py-4 text-slate-700">{{ user.email }}</td>
                <td class="break-words px-4 py-4 text-slate-700">{{ getRoleLabel(user.role ?? user.rol) }}</td>
                <td class="max-w-44 break-words px-4 py-4 text-slate-700">{{ institutionName(user) }}</td>
                <td class="px-4 py-4">
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-semibold"
                    :class="user.activo ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'"
                  >{{ user.activo ? 'Activo' : 'Inactivo' }}</span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
                      :aria-label="`Editar ${user.nombre}`"
                      :disabled="loadingUserId !== null"
                      @click="openEdit(user)"
                    ><Pencil class="h-4 w-4 text-orange-600" /></button>
                    <button
                      type="button"
                      class="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
                      :aria-label="`${user.activo ? 'Desactivar' : 'Reactivar'} ${user.nombre}`"
                      @click="toggle(user)"
                    ><component :is="user.activo ? UserX : UserCheck" class="h-4 w-4 text-slate-600" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </div>

  <!-- Teleport impide que el modal quede tapado o recortado por el layout. -->
  <Teleport to="body">
    <div
      v-if="modalOpen"
      class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-2 sm:p-4"
      role="presentation"
      @click.self="close"
      @keydown.esc="close"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-dialog-title"
        class="flex max-h-[94dvh] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div class="flex items-center justify-between gap-2 border-b border-slate-200 p-4 sm:px-6">
          <h2 id="user-dialog-title" class="min-w-0 break-words text-xl font-extrabold text-slate-900">
            {{ editingId ? 'Editar usuario' : 'Crear usuario' }}
          </h2>
          <button
            type="button"
            aria-label="Cerrar formulario"
            class="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
            :disabled="saving"
            @click="close"
          ><X class="h-5 w-5" /></button>
        </div>

        <form id="user-form" class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" @submit.prevent="save">
          <div class="grid min-w-0 gap-4 sm:grid-cols-2">
            <label class="block min-w-0 text-sm font-semibold text-slate-700">
              Nombre <span class="text-orange-600">*</span>
              <input v-model="form.nombre" required class="form-input mt-1.5" autocomplete="given-name" />
            </label>
            <label class="block min-w-0 text-sm font-semibold text-slate-700">
              Primer apellido
              <input v-model="form.primer_apellido" class="form-input mt-1.5" autocomplete="family-name" />
            </label>
            <label class="block min-w-0 text-sm font-semibold text-slate-700">
              Segundo apellido
              <input v-model="form.segundo_apellido" class="form-input mt-1.5" />
            </label>
            <label class="block min-w-0 text-sm font-semibold text-slate-700">
              Teléfono
              <input v-model="form.telefono" type="tel" class="form-input mt-1.5" autocomplete="tel" />
            </label>
            <label class="block min-w-0 text-sm font-semibold text-slate-700 sm:col-span-2">
              Correo electrónico <span class="text-orange-600">*</span>
              <input v-model="form.correo" required type="email" class="form-input mt-1.5" autocomplete="email" />
            </label>
            <label v-if="lockedAuditorRole" class="block min-w-0 text-sm font-semibold text-slate-700">
              Rol (asignado por seguridad)
              <input :value="getRoleLabel(form.role)" disabled class="form-input mt-1.5" />
            </label>
            <label v-else class="block min-w-0 text-sm font-semibold text-slate-700">
              Rol <span class="text-orange-600">*</span>
              <select v-model="form.role" class="form-input mt-1.5" required>
                <option v-for="item in formRoles" :key="item.value" :value="item.value">{{ item.label }}</option>
              </select>
            </label>
            <label v-if="needsInstitution" class="block min-w-0 text-sm font-semibold text-slate-700">
              Institución <span class="text-orange-600">*</span>
              <select v-model="form.institutionId" class="form-input mt-1.5" required>
                <option value="">Seleccionar institución</option>
                <option v-for="item in institutions.institutions" :key="item.id" :value="item.id">
                  {{ item.nombre }}
                </option>
              </select>
            </label>
            <label class="block min-w-0 text-sm font-semibold text-slate-700" :class="needsInstitution ? 'sm:col-span-2' : ''">
              {{ editingId ? 'Nueva contraseña (opcional)' : 'Contraseña *' }}
              <input
                v-model="form.contrasena"
                type="password"
                autocomplete="new-password"
                class="form-input mt-1.5"
                minlength="8"
                :required="!editingId"
              />
            </label>
          </div>
          <p v-if="actionError" role="alert" class="break-words rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {{ actionError }}
          </p>
        </form>

        <div class="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            class="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700"
            :disabled="saving"
            @click="close"
          >Cancelar</button>
          <button
            type="submit"
            form="user-form"
            class="min-h-11 rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            :disabled="saving"
          >{{ saving ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Crear usuario') }}</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>