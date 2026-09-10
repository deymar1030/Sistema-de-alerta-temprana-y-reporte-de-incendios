<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Wifi, Factory, ArrowRight } from 'lucide-vue-next'
import { useSensorStore } from '../stores/sensor.store'
import { readingService } from '../services/reading.service'
import type { Sensor, Reading } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import StatusBadge from '../components/common/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const sensorStore = useSensorStore()
const search = ref('')
const selectedType = ref('Todos')
const selectedState = ref('Todos')
const sensorDetail = ref<Sensor | null>(null)
const sensorReadings = ref<Reading[]>([])

const filteredSensors = computed(() => {
  const term = search.value.trim().toLowerCase()
  return sensorStore.sensors.filter((sensor) => {
    const matchesText = !term || [sensor.nombre, sensor.id_sensor, sensor.ubicacion].some((value) => value.toLowerCase().includes(term))
    const matchesType = selectedType.value === 'Todos' || sensor.tipo_sensor === selectedType.value
    const matchesState = selectedState.value === 'Todos' || sensor.estado === selectedState.value
    return matchesText && matchesType && matchesState
  })
})

const openSensor = async (sensor: Sensor) => {
  router.push(`/sensores/${sensor.id_sensor}`)
  const detail = await sensorStore.getSensorById(sensor.id_sensor)
  sensorDetail.value = detail ?? null
  sensorReadings.value = await readingService.getReadingsBySensor(sensor.id_sensor)
}

onMounted(async () => {
  await sensorStore.fetchSensors()
  const id = route.params.id as string | undefined
  if (id) {
    const sensor = sensorStore.sensors.find((item) => item.id_sensor === id)
    if (sensor) {
      sensorDetail.value = sensor
      sensorReadings.value = await readingService.getReadingsBySensor(sensor.id_sensor)
    }
  }
})

watch(
  () => route.params.id,
  async (id: string | string[] | undefined) => {
    const sensorId = Array.isArray(id) ? id[0] : id
    if (!sensorId) {
      sensorDetail.value = null
      sensorReadings.value = []
      return
    }
    const sensor = sensorStore.sensors.find((item) => item.id_sensor === sensorId)
    if (sensor) {
      sensorDetail.value = sensor
      sensorReadings.value = await readingService.getReadingsBySensor(sensor.id_sensor)
    }
  },
)
</script>

<template>
  <div class="space-y-6">
    <div v-if="sensorStore.loading" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <LoadingSpinner />
    </div>
    <div v-else-if="sensorStore.error" class="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-red-200">
      {{ sensorStore.error }}
    </div>
    <div v-else class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="relative flex-1">
            <Search class="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input v-model="search" class="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-3 text-sm text-white outline-none ring-0 placeholder:text-slate-400 focus:border-orange-500" placeholder="Buscar sensor" />
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <select v-model="selectedType" class="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100">
              <option>Todos</option>
              <option>Temperatura</option>
              <option>Humo</option>
              <option>CO</option>
            </select>
            <select v-model="selectedState" class="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100">
              <option>Todos</option>
              <option>Activo</option>
              <option>Inactivo</option>
              <option>Mantenimiento</option>
              <option>Error</option>
            </select>
          </div>
        </div>

        <div class="mt-5 overflow-x-auto">
          <table class="min-w-full text-left text-sm text-slate-300">
            <thead class="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th class="pb-3">ID</th>
                <th class="pb-3">Nombre</th>
                <th class="pb-3">Tipo</th>
                <th class="pb-3">Estado</th>
                <th class="pb-3">Última lectura</th>
                <th class="pb-3">Ubicación</th>
                <th class="pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sensor in filteredSensors" :key="sensor.id_sensor" class="border-t border-slate-800 align-top">
                <td class="py-3 font-medium text-white">{{ sensor.id_sensor }}</td>
                <td class="py-3">
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-300">
                      <Wifi class="h-4 w-4" />
                    </div>
                    <div>
                      <div class="font-medium text-white">{{ sensor.nombre }}</div>
                      <div class="text-xs text-slate-400">{{ sensor.modelo }}</div>
                    </div>
                  </div>
                </td>
                <td class="py-3">{{ sensor.tipo_sensor }}</td>
                <td class="py-3">
                  <StatusBadge :tone="sensor.estado === 'Activo' ? 'success' : sensor.estado === 'Mantenimiento' ? 'warning' : sensor.estado === 'Error' ? 'danger' : 'neutral'" :state="sensor.estado">
                    {{ sensor.estado }}
                  </StatusBadge>
                </td>
                <td class="py-3">{{ sensor.ultima_lectura }} {{ sensor.unidad_medida }}</td>
                <td class="py-3">{{ sensor.ubicacion }}</td>
                <td class="py-3">
                  <button class="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-orange-500 hover:text-white" @click="openSensor(sensor)">
                    Ver detalle <ArrowRight class="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <aside v-if="sensorDetail" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Detalle</p>
            <h2 class="mt-2 text-xl font-semibold text-white">{{ sensorDetail.nombre }}</h2>
          </div>
          <StatusBadge :tone="sensorDetail.estado === 'Activo' ? 'success' : sensorDetail.estado === 'Mantenimiento' ? 'warning' : sensorDetail.estado === 'Error' ? 'danger' : 'neutral'" :state="sensorDetail.estado">
            {{ sensorDetail.estado }}
          </StatusBadge>
        </div>

        <dl class="space-y-3 text-sm text-slate-300">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <dt>ID</dt><dd class="text-white">{{ sensorDetail.id_sensor }}</dd>
          </div>
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <dt>Tipo</dt><dd class="text-white">{{ sensorDetail.tipo_sensor }}</dd>
          </div>
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <dt>Unidad</dt><dd class="text-white">{{ sensorDetail.unidad_medida }}</dd>
          </div>
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <dt>Modelo</dt><dd class="text-white">{{ sensorDetail.modelo }}</dd>
          </div>
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <dt>Fabricante</dt><dd class="text-white">{{ sensorDetail.fabricante }}</dd>
          </div>
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <dt>Instalación</dt><dd class="text-white">{{ sensorDetail.fecha_instalacion }}</dd>
          </div>
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <dt>Ubicación</dt><dd class="text-white">{{ sensorDetail.ubicacion }}</dd>
          </div>
        </dl>

        <div class="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div class="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <Factory class="h-4 w-4 text-orange-300" />
            Últimas lecturas
          </div>
          <ul class="space-y-2 text-sm text-slate-300">
            <li v-for="reading in sensorReadings.slice(0, 4)" :key="reading.id_lectura" class="flex items-center justify-between gap-2 rounded-lg bg-slate-900 px-2 py-2">
              <span>{{ reading.variable }}</span>
              <span class="text-white">{{ reading.valor }} {{ reading.unidad }}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>
