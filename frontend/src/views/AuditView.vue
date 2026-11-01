<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuditStore } from '../stores/audit.store'

const store = useAuditStore()
const { systemEvents, userEvents, loadingSystem, loadingUsers, systemError, usersError } = storeToRefs(store)
const systemFilters = reactive({ evento: '', desde: '', hasta: '' })
const userFilters = reactive({ id_usuario: '', accion: '', desde: '', hasta: '' })

// Los filtros se envian al backend, no se escriben registros en estas tablas.
function searchSystem() {
  void store.fetchSystem({ ...systemFilters })
}
function searchUsers() {
  void store.fetchUsers({ ...userFilters })
}
function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-BO')
}

onMounted(() => {
  searchSystem()
  searchUsers()
})
</script>

<template>
  <main class="mx-auto max-w-[1500px] space-y-6">
    <header>
      <p class="text-xs font-bold uppercase tracking-wider text-orange-600">Consulta exclusiva · AUDITOR</p>
      <h1 class="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Auditoría del sistema</h1>
      <p class="mt-2 text-sm text-slate-600">Registros persistidos por el servidor. Esta pantalla es estrictamente de solo lectura.</p>
    </header>

    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="system-title">
      <h2 id="system-title" class="text-lg font-bold text-slate-900">Eventos del sistema</h2>
      <form class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4" @submit.prevent="searchSystem">
        <label class="text-sm font-semibold text-slate-700">Evento
          <input v-model.trim="systemFilters.evento" type="text" class="form-input mt-1 font-normal" placeholder="LOGIN" />
        </label>
        <label class="text-sm font-semibold text-slate-700">Desde
          <input v-model="systemFilters.desde" type="date" class="form-input mt-1 font-normal" />
        </label>
        <label class="text-sm font-semibold text-slate-700">Hasta
          <input v-model="systemFilters.hasta" type="date" class="form-input mt-1 font-normal" />
        </label>
        <button type="submit" :disabled="loadingSystem" class="min-h-11 self-end rounded-xl bg-orange-600 px-4 font-semibold text-white disabled:opacity-50">
          {{ loadingSystem ? 'Consultando...' : 'Filtrar eventos' }}
        </button>
      </form>
      <p v-if="systemError" role="alert" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ systemError }}</p>
      <p v-else-if="loadingSystem" role="status" class="mt-4 text-sm text-slate-600">Cargando eventos...</p>
      <p v-else-if="!systemEvents.length" class="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No se encontraron eventos con estos filtros.</p>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[650px] text-left text-sm">
          <thead class="bg-slate-50 text-slate-600"><tr><th class="p-3">ID</th><th class="p-3">Fecha y hora</th><th class="p-3">Evento</th><th class="p-3">Detalle</th></tr></thead>
          <tbody><tr v-for="entry in systemEvents" :key="entry.id_auditoria" class="border-t border-slate-100"><td class="p-3 font-semibold">{{ entry.id_auditoria }}</td><td class="p-3">{{ formatDate(entry.fecha_hora) }}</td><td class="p-3">{{ entry.evento }}</td><td class="break-words p-3">{{ entry.detalle ?? '—' }}</td></tr></tbody>
        </table>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="users-title">
      <h2 id="users-title" class="text-lg font-bold text-slate-900">Acciones por usuario</h2>
      <form class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5" @submit.prevent="searchUsers">
        <label class="text-sm font-semibold text-slate-700">ID de usuario
          <input v-model.trim="userFilters.id_usuario" inputmode="numeric" class="form-input mt-1 font-normal" placeholder="7" />
        </label>
        <label class="text-sm font-semibold text-slate-700">Acción
          <input v-model.trim="userFilters.accion" class="form-input mt-1 font-normal" placeholder="EDITAR_USUARIO" />
        </label>
        <label class="text-sm font-semibold text-slate-700">Desde
          <input v-model="userFilters.desde" type="date" class="form-input mt-1 font-normal" />
        </label>
        <label class="text-sm font-semibold text-slate-700">Hasta
          <input v-model="userFilters.hasta" type="date" class="form-input mt-1 font-normal" />
        </label>
        <button type="submit" :disabled="loadingUsers" class="min-h-11 self-end rounded-xl bg-orange-600 px-4 font-semibold text-white disabled:opacity-50">
          {{ loadingUsers ? 'Consultando...' : 'Filtrar acciones' }}
        </button>
      </form>
      <p v-if="usersError" role="alert" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ usersError }}</p>
      <p v-else-if="loadingUsers" role="status" class="mt-4 text-sm text-slate-600">Cargando acciones...</p>
      <p v-else-if="!userEvents.length" class="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No se encontraron acciones con estos filtros.</p>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[750px] text-left text-sm">
          <thead class="bg-slate-50 text-slate-600"><tr><th class="p-3">ID</th><th class="p-3">Usuario</th><th class="p-3">Fecha y hora</th><th class="p-3">Acción</th><th class="p-3">Detalle</th></tr></thead>
          <tbody><tr v-for="entry in userEvents" :key="entry.id_auditoriau" class="border-t border-slate-100"><td class="p-3 font-semibold">{{ entry.id_auditoriau }}</td><td class="p-3">#{{ entry.id_usuario }}</td><td class="p-3">{{ formatDate(entry.fecha_hora) }}</td><td class="p-3">{{ entry.accion }}</td><td class="break-words p-3">{{ entry.detalle ?? '—' }}</td></tr></tbody>
        </table>
      </div>
    </section>
  </main>
</template>
