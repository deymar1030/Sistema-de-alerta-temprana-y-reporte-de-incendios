<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { backendAlertsService, type BackendAlert, type InstitutionDelivery } from '../services/backend-alerts.service'

const route = useRoute()
const authStore = useAuthStore()
const institutionId = computed(() => authStore.user?.institucionId ?? null)
const item = ref<BackendAlert | null>(null)
const loading = ref(false)
const error = ref('')
const myDelivery = computed<InstitutionDelivery | null>(() =>
  item.value?.instituciones_notificadas?.find(d => String(d.id_institucion) === String(institutionId.value)) ?? null,
)

const dateLabel = (date?: string | null) => {
  if (!date) return 'No registrada'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString('es-BO')
}

async function load() {
  item.value = null
  error.value = ''
  if (!institutionId.value) {
    error.value = 'Tu sesión no tiene una institución asignada.'
    return
  }
  loading.value = true
  try {
    const id = String(route.params.id)
    const received = await backendAlertsService.detail(id)
    // El backend valida permisos. También evitamos mostrar como "mía" una alerta sin envío al usuario.
    const own = received.instituciones_notificadas?.some(d => String(d.id_institucion) === String(institutionId.value))
    if (!own) throw new Error('Esta alerta no tiene un envío registrado para tu institución.')
    item.value = received
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo consultar el detalle.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="space-y-5">
    <RouterLink to="/institucion/alertas" class="inline-flex font-semibold text-orange-700 underline">Volver a alertas</RouterLink>
    <h1 class="text-2xl font-bold text-slate-900">Detalle institucional</h1>
    <p v-if="loading" role="status">Consultando estado del servidor...</p>
    <p v-if="error" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{{ error }}</p>

    <section v-if="item && myDelivery" class="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <strong class="text-lg text-slate-900">Alerta #{{ item.id_alerta }}</strong>
        <button type="button" class="rounded-lg border px-4 py-2 text-slate-700" :disabled="loading" @click="load">Actualizar</button>
      </div>
      <p class="text-slate-700">Estado global: <strong>{{ item.estado }}</strong></p>
      <p class="text-slate-700">Estado de tu institución: <strong>{{ myDelivery.estado }}</strong></p>
      <p class="text-slate-700">Institución: {{ myDelivery.nombre }}</p>
      <p class="text-slate-700">Envío: {{ dateLabel(myDelivery.fecha_envio) }}</p>
      <p class="text-slate-700">Última actualización: {{ dateLabel(myDelivery.fecha_actualizacion) }}</p>
      <p class="text-slate-700">Clasificación: {{ item.clasificacion ?? 'Sin clasificar' }}</p>
      <p class="text-slate-700">Ubicación: {{ item.predio?.nombre ?? item.reporte_origen?.ubicacion_tipo ?? 'No disponible' }}</p>
      <p v-if="item.reporte_origen?.descripcion" class="text-slate-700">Reporte de origen: {{ item.reporte_origen.descripcion }}</p>
      <p class="border-t pt-4 text-sm text-slate-500">Los cambios de estado se realizan desde la aplicación móvil institucional. Esta vista solo consulta datos persistidos.</p>
    </section>
  </main>
</template>
