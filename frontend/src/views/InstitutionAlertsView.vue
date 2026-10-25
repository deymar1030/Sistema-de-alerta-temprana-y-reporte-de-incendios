<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { backendAlertsService, type BackendAlert } from '../services/backend-alerts.service'

const authStore = useAuthStore()
const institutionId = computed(() => authStore.user?.institucionId ?? null)
const alerts = ref<BackendAlert[]>([])
const loading = ref(false)
const error = ref('')

async function load() {
  alerts.value = []
  error.value = ''
  if (!institutionId.value) {
    error.value = 'La cuenta no tiene una institución asignada.'
    return
  }
  loading.value = true
  try {
    alerts.value = await backendAlertsService.byInstitution(institutionId.value)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudieron consultar las alertas institucionales.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="space-y-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-orange-700">Institución</p>
        <h1 class="mt-1 text-2xl font-bold text-slate-900">Alertas recibidas</h1>
        <p class="mt-2 text-sm text-slate-600">Distribución automática confirmada por el backend. La gestión del personal operativo corresponde al móvil.</p>
      </div>
      <button type="button" class="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50" :disabled="loading" @click="load">Actualizar</button>
    </header>

    <p v-if="loading" role="status">Cargando alertas de tu institución...</p>
    <p v-if="error" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{{ error }}</p>
    <p v-if="!loading && !error && !alerts.length" class="rounded-xl border border-dashed p-6 text-slate-600">Todavía no hay alertas asignadas a esta institución.</p>

    <section v-if="!error && !loading" class="grid gap-4 md:grid-cols-2">
      <article v-for="alert in alerts" :key="String(alert.id_alerta)" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap justify-between gap-2">
          <strong class="text-lg text-slate-900">Alerta #{{ alert.id_alerta }}</strong>
          <span class="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-900">{{ alert.estado }}</span>
        </div>
        <p class="mt-3 text-sm text-slate-700">Clasificación: {{ alert.clasificacion ?? 'Sin clasificar' }}</p>
        <p class="mt-1 text-sm text-slate-600">{{ alert.fecha }} {{ alert.hora }}</p>
        <RouterLink :to="`/institucion/alertas/${encodeURIComponent(String(alert.id_alerta))}`" class="mt-4 inline-flex font-semibold text-orange-700 underline underline-offset-4">Ver estado del envío</RouterLink>
      </article>
    </section>
  </main>
</template>
