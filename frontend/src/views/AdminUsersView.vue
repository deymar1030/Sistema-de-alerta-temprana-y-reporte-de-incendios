<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Pencil, Plus, UserCheck, UserX, X } from 'lucide-vue-next'
import StatusBadge from '../components/common/StatusBadge.vue'
import { usersMock } from '../mocks/users'
import { useAuthStore } from '../stores/auth.store'
import type { User, UserRole } from '../types'

const authStore = useAuthStore()
const institutionId = computed(() => authStore.user?.institucionId ?? 'INS-001')
const users = ref<User[]>(usersMock.filter((item) => item.institucionId === institutionId.value).map((item) => ({ ...item, activo: item.activo ?? true })))
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ nombre: '', email: '', telefono: '', rol: 'INSTITUTION_USER' as UserRole })

const openCreate = () => { editingId.value = null; Object.assign(form, { nombre: '', email: '', telefono: '', rol: 'INSTITUTION_USER' as UserRole }); modalOpen.value = true }
const openEdit = (user: User) => { editingId.value = user.id; Object.assign(form, { nombre: user.nombre, email: user.email, telefono: user.telefono ?? '', rol: user.rol }); modalOpen.value = true }
const save = () => {
  if (!form.nombre.trim() || !form.email.trim()) return
  if (editingId.value) {
    const user = users.value.find((item) => item.id === editingId.value)
    if (user) Object.assign(user, { nombre: form.nombre, email: form.email, telefono: form.telefono, rol: form.rol })
  } else {
    users.value.push({ id: `USR-DEMO-${users.value.length + 1}`, nombre: form.nombre, email: form.email, telefono: form.telefono, rol: form.rol, institucionId: institutionId.value, activo: true })
  }
  modalOpen.value = false
}
const toggle = (user: User) => { user.activo = !user.activo }
</script>

<template>
  <div class="space-y-6">
    <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500">Administración institucional · Demo</p><h2 class="mt-2 text-2xl font-semibold text-slate-900">Personal y usuarios</h2><p class="mt-2 text-sm text-slate-600">Gestiona usuarios internos de la institución. Las acciones son simuladas en el frontend.</p></div><button class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f24a23] px-4 py-3 text-sm font-semibold text-white" @click="openCreate"><Plus class="h-4 w-4"/> Nuevo usuario</button></section>
    <section class="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><table class="min-w-[760px] w-full text-left text-sm"><thead class="border-b border-slate-200 text-[10px] uppercase tracking-[0.16em] text-slate-500"><tr><th class="pb-3">Nombre</th><th class="pb-3">Correo</th><th class="pb-3">Rol</th><th class="pb-3">Estado</th><th class="pb-3 text-right">Acciones</th></tr></thead><tbody><tr v-for="user in users" :key="user.id" class="border-b border-slate-100 last:border-0"><td class="py-4 font-semibold text-slate-900">{{ user.nombre }}</td><td class="py-4 text-slate-600">{{ user.email }}</td><td class="py-4 text-slate-600">{{ user.rol==='INSTITUTION_ADMIN'?'Administrador':'Personal operativo' }}</td><td class="py-4"><StatusBadge :state="user.activo?'ACTIVO':'INACTIVO'" :tone="user.activo?'success':'neutral'">{{ user.activo?'ACTIVO':'INACTIVO' }}</StatusBadge></td><td class="py-4"><div class="flex justify-end gap-2"><button class="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-orange-200 hover:text-orange-600" title="Editar" @click="openEdit(user)"><Pencil class="h-4 w-4"/></button><button class="rounded-lg border border-slate-200 p-2 text-slate-600" :title="user.activo?'Desactivar':'Activar'" @click="toggle(user)"><UserX v-if="user.activo" class="h-4 w-4"/><UserCheck v-else class="h-4 w-4"/></button></div></td></tr></tbody></table></section>

    <div v-if="modalOpen" class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm" @click.self="modalOpen=false"><form class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" @submit.prevent="save"><div class="flex items-center justify-between"><h3 class="text-xl font-semibold text-slate-900">{{ editingId?'Editar usuario':'Nuevo usuario' }}</h3><button type="button" class="rounded-lg p-2 text-slate-500" @click="modalOpen=false"><X class="h-5 w-5"/></button></div><div class="mt-5 grid gap-4"><label class="text-sm font-medium text-slate-700">Nombre<input v-model="form.nombre" required class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-300"/></label><label class="text-sm font-medium text-slate-700">Correo<input v-model="form.email" required type="email" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-300"/></label><label class="text-sm font-medium text-slate-700">Teléfono<input v-model="form.telefono" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-orange-300"/></label><label class="text-sm font-medium text-slate-700">Rol<select v-model="form.rol" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="INSTITUTION_USER">Personal operativo</option><option value="INSTITUTION_ADMIN">Administrador</option></select></label></div><div class="mt-6 flex justify-end gap-2"><button type="button" class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700" @click="modalOpen=false">Cancelar</button><button class="rounded-xl bg-[#f24a23] px-4 py-2.5 text-sm font-semibold text-white">Guardar</button></div></form></div>
  </div>
</template>
