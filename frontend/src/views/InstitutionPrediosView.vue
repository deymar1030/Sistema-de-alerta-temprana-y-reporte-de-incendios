<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.store'
import { useInstitutionStore } from '../stores/institution.store'
import { predioService, type PredioMapEntry } from '../services/predio.service'
import PrediosRiesgoPanel from '../components/predios/PrediosRiesgoPanel.vue'

const auth = useAuthStore()
const institutionStore = useInstitutionStore()
const institutionId = computed(() => auth.user?.institutionId ?? auth.user?.institucionId ?? null)
const institution = computed(() => institutionStore.institutions.find(item => String(item.id) === String(institutionId.value)) ?? null)

const predios = ref<PredioMapEntry[]>([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [prediosResult] = await Promise.all([
      predioService.getMapPredios(),
      institutionStore.institutions.length ? Promise.resolve() : institutionStore.fetchInstitutions(),
    ])
    predios.value = prediosResult
  } catch (cause) {
    predios.value = []
    error.value = cause instanceof Error ? cause.message : 'No se pudieron cargar los predios.'
  } finally {
    loading.value = false
  }
}

onMounted(() => { void load() })
</script>

<template>
  <div class="admin-page flex flex-col gap-4">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Predios y nivel de riesgo</h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-600">
          Cada predio está pintado según su Índice de Riesgo de Predio (IRP): mientras más alto, mayor es el daño
          esperado si allí se produce un incendio.
        </p>
      </div>
      <button type="button" class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" :disabled="loading" @click="load">
        <RefreshCw :size="16" aria-hidden="true" /> {{ loading ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </header>

    <p v-if="error" role="alert" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{{ error }}</p>

    <PrediosRiesgoPanel :items="predios" :loading="loading" :institution="institution" />
  </div>
</template>
