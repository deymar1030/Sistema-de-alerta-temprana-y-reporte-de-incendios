<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCitizenReportStore } from '../stores/citizen-report.store'

const router = useRouter()
const reportStore = useCitizenReportStore()

const form = ref({
  description: '',
  address: '',
  latitude: '',
  longitude: '',
  reference: '',
  photo: '',
  emergencyLevel: '',
})

const loading = ref(false)
const error = ref('')

const useCurrentLocation = () => {
  if (!navigator.geolocation) {
    error.value = 'Tu navegador no admite geolocalización.'
    return
  }

  navigator.geolocation.getCurrentPosition((position) => {
    form.value.latitude = position.coords.latitude.toString()
    form.value.longitude = position.coords.longitude.toString()
    error.value = ''
  }, () => {
    error.value = 'No se pudo acceder a tu ubicación actual.'
  })
}

const submitReport = async () => {
  if (!form.value.description || !form.value.address || !form.value.latitude || !form.value.longitude) {
    error.value = 'Descripción, ubicación y coordenadas son obligatorias.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await reportStore.createReport({
      id: `REP-${Date.now()}`,
      description: form.value.description,
      latitude: Number(form.value.latitude),
      longitude: Number(form.value.longitude),
      address: form.value.address,
      reference: form.value.reference,
      photo: form.value.photo,
      status: 'PENDIENTE_DE_VALIDACION',
      createdAt: new Date().toISOString(),
      citizenId: 'CIT-001',
    })

    window.alert('Reporte enviado correctamente. Será revisado por el centro de monitoreo.')
    await router.push('/ciudadano/mis-reportes')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo enviar el reporte.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] px-4 py-6 text-slate-800">
    <div class="mx-auto max-w-md rounded-[30px] bg-white p-5 shadow-lg shadow-orange-100">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-900">Reportar incendio</h1>
        <button class="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700" @click="useCurrentLocation">Usar mi ubicación</button>
      </div>

      <form class="mt-4 space-y-4" @submit.prevent="submitReport">
        <label class="block text-sm font-medium text-slate-700">
          Descripción
          <textarea v-model="form.description" rows="4" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="Describe lo observado..." />
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Ubicación
          <input v-model="form.address" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="Calle / avenida / barrio" />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block text-sm font-medium text-slate-700">
            Latitud
            <input v-model="form.latitude" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="-16.5" />
          </label>
          <label class="block text-sm font-medium text-slate-700">
            Longitud
            <input v-model="form.longitude" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="-68.1" />
          </label>
        </div>

        <label class="block text-sm font-medium text-slate-700">
          Referencia del lugar
          <input v-model="form.reference" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="Parque, esquina, tienda cercana" />
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Foto / evidencia
          <input v-model="form.photo" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300" placeholder="URL de imagen (opcional)" />
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Nivel estimado de emergencia
          <select v-model="form.emergencyLevel" class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-orange-300">
            <option value="">Sin especificar</option>
            <option value="BAJO">Bajo</option>
            <option value="MEDIO">Medio</option>
            <option value="ALTO">Alto</option>
            <option value="CRITICO">Crítico</option>
          </select>
        </label>

        <p v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

        <button type="submit" :disabled="loading" class="w-full rounded-2xl bg-[#f24a23] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-200 disabled:opacity-60">
          {{ loading ? 'Enviando...' : 'Enviar reporte' }}
        </button>
      </form>
    </div>
  </div>
</template>
