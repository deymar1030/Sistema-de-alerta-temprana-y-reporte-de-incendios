<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Wifi, Factory, ArrowRight } from 'lucide-vue-next'

import { useSensorStore } from '../stores/sensor.store'
import { readingService } from '../services/reading.service'
import { useToast } from '../composables/useToast'

import type { Sensor, Reading } from '../types'

import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import StatusBadge from '../components/common/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const sensorStore = useSensorStore()

const search = ref('')
const selectedType = ref('Todos')
const selectedState = ref('Todos')

const sensorDetail = ref<Sensor | null>(null)
const sensorReadings = ref<Reading[]>([])

const emptySensorForm = () => ({
  id_predio: '',
  nombre: '',
  tipo_sensor: 'TEMPERATURA',
  estado: 'ACTIVO',
  modelo: '',
  fabricante: '',
  unidad_medida: '',
  fecha_instalacion: new Date().toISOString().slice(0, 10),
  rango_min: '',
  rango_max: '',
})

const sensorForm = ref(emptySensorForm())
const showSensorForm = ref(false)
const editingSensorId = ref<string | null>(null)

const mapSensorTypeToApi = (value: Sensor['tipo_sensor']) => {
  switch (value) {
    case 'Temperatura':
      return 'TEMPERATURA'
    case 'Humo':
      return 'HUMO'
    case 'CO':
      return 'CO'
    case 'Humedad':
      return 'HUMEDAD'
    default:
      return 'TEMPERATURA'
  }
}

const mapSensorStateToApi = (value: Sensor['estado']) => {
  switch (value) {
    case 'Activo':
      return 'ACTIVO'
    case 'Inactivo':
      return 'INACTIVO'
    case 'Mantenimiento':
      return 'MANTENIMIENTO'
    case 'Error':
      return 'ERROR'
    default:
      return 'ACTIVO'
  }
}

const openCreateSensor = () => {
  sensorForm.value = emptySensorForm()
  editingSensorId.value = null
  showSensorForm.value = true
}

const openEditSensor = (sensor: Sensor) => {
  sensorForm.value = {
    id_predio: sensor.id_predio ?? '',
    nombre: sensor.nombre,
    tipo_sensor: mapSensorTypeToApi(sensor.tipo_sensor),
    estado: mapSensorStateToApi(sensor.estado),
    modelo: sensor.modelo,
    fabricante: sensor.fabricante,
    unidad_medida: sensor.unidad_medida,
    fecha_instalacion: sensor.fecha_instalacion,
    rango_min: String(sensor.rango_min ?? ''),
    rango_max: String(sensor.rango_max ?? ''),
  }
  editingSensorId.value = sensor.id_sensor
  showSensorForm.value = true
}

const normalizeSensorForm = () => {
  const idPredio = Number(sensorForm.value.id_predio)
  const nombre = sensorForm.value.nombre.trim()
  const tipoSensor = sensorForm.value.tipo_sensor
  const estado = sensorForm.value.estado
  const modelo = sensorForm.value.modelo.trim()
  const fabricante = sensorForm.value.fabricante.trim()
  const unidadMedida = sensorForm.value.unidad_medida.trim()
  const fechaInstalacion = sensorForm.value.fecha_instalacion

  if (!idPredio) {
    throw new Error('Debe indicar el predio del sensor.')
  }

  if (!nombre) {
    throw new Error('Debe ingresar el nombre del sensor.')
  }

  if (!tipoSensor) {
    throw new Error('Debe seleccionar el tipo de sensor.')
  }

  if (!estado) {
    throw new Error('Debe seleccionar el estado del sensor.')
  }

  if (!modelo) {
    throw new Error('Debe ingresar el modelo del sensor.')
  }

  if (!fabricante) {
    throw new Error('Debe ingresar el fabricante del sensor.')
  }

  if (!unidadMedida) {
    throw new Error('Debe indicar la unidad de medida.')
  }

  if (!fechaInstalacion) {
    throw new Error('Debe indicar la fecha de instalación.')
  }

  return {
    id_predio: idPredio,
    nombre,
    tipo_sensor: tipoSensor,
    estado,
    modelo,
    fabricante,
    unidad_medida: unidadMedida,
    fecha_instalacion: fechaInstalacion,
    rango_min: Number(sensorForm.value.rango_min || 0),
    rango_max: Number(sensorForm.value.rango_max || 0),
  }
}

const submitSensor = async () => {
  try {
    const payload = normalizeSensorForm()

    if (editingSensorId.value) {
      await sensorStore.updateSensor(editingSensorId.value, payload)
      showToast({ type: 'success', title: 'Sensor actualizado', description: 'Los cambios se guardaron correctamente.' })
    } else {
      await sensorStore.createSensor(payload)
      showToast({ type: 'success', title: 'Sensor creado', description: 'El sensor fue registrado correctamente.' })
    }

    showSensorForm.value = false
    editingSensorId.value = null
    sensorForm.value = emptySensorForm()
    await sensorStore.fetchSensors()

    if (route.params.id) {
      const detail = await sensorStore.getSensorById(String(route.params.id))
      sensorDetail.value = detail ?? null
      sensorReadings.value = detail ? await readingService.getReadingsBySensor(detail.id_sensor) : []
    }
  } catch (error) {
    showToast({ type: 'error', title: 'No se pudo guardar el sensor', description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.' })
  }
}

const deleteSensor = async (sensor: Sensor) => {
  const confirmed = window.confirm(`¿Deseas eliminar el sensor "${sensor.nombre}"?`)

  if (!confirmed) {
    return
  }

  try {
    await sensorStore.deleteSensor(sensor.id_sensor)
    await sensorStore.fetchSensors()

    if (sensorDetail.value?.id_sensor === sensor.id_sensor) {
      sensorDetail.value = null
      sensorReadings.value = []
    }

    showToast({ type: 'success', title: 'Sensor eliminado', description: 'El registro se eliminó correctamente.' })
  } catch (error) {
    showToast({ type: 'error', title: 'No se pudo eliminar el sensor', description: error instanceof Error ? error.message : 'La eliminación falló.' })
  }
}

const filteredSensors = computed(() => {
  const term = search.value.trim().toLowerCase()

  return sensorStore.sensors.filter((sensor) => {
    const matchesText =
      !term ||
      [
        sensor.nombre,
        sensor.id_sensor,
        sensor.ubicacion,
      ].some((value) =>
        value.toLowerCase().includes(term),
      )

    const matchesType =
      selectedType.value === 'Todos' ||
      sensor.tipo_sensor === selectedType.value

    const matchesState =
      selectedState.value === 'Todos' ||
      sensor.estado === selectedState.value

    return (
      matchesText &&
      matchesType &&
      matchesState
    )
  })
})

const openSensor = async (sensor: Sensor) => {
  /*
   * Por ahora mantenemos esta ruta heredada porque
   * /sensores/:id ya existe en el router.
   */
  await router.push(`/sensores/${sensor.id_sensor}`)

  const detail =
    await sensorStore.getSensorById(sensor.id_sensor)

  sensorDetail.value = detail ?? null

  sensorReadings.value =
    await readingService.getReadingsBySensor(
      sensor.id_sensor,
    )
}

onMounted(async () => {
  await sensorStore.fetchSensors()

  const id = route.params.id as string | undefined

  if (id) {
    const detail =
      await sensorStore.getSensorById(id)

    sensorDetail.value = detail ?? null

    sensorReadings.value =
      await readingService.getReadingsBySensor(id)
  }
})

watch(
  () => route.params.id,

  async (
    id: string | string[] | undefined,
  ) => {
    const sensorId =
      Array.isArray(id)
        ? id[0]
        : id

    if (!sensorId) {
      sensorDetail.value = null
      sensorReadings.value = []
      return
    }

    const detail =
      await sensorStore.getSensorById(sensorId)

    sensorDetail.value = detail ?? null

    sensorReadings.value =
      await readingService.getReadingsBySensor(
        sensorId,
      )
  },
)
</script>

<template>
  <div class="space-y-6">
    <!-- Cargando -->
    <div
      v-if="sensorStore.loading"
      class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
    >
      <LoadingSpinner />
    </div>

    <!-- Error -->
    <div
      v-else-if="sensorStore.error"
      class="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-red-200"
    >
      {{ sensorStore.error }}
    </div>

    <!-- Contenido -->
    <div
      v-else
      class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"
    >
      <!-- Lista de sensores -->
      <section
        class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
      >
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400">Sensores</p>
          </div>

          <button
            type="button"
            class="inline-flex items-center rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-200 transition hover:bg-orange-500/20"
            @click="openCreateSensor"
          >
            + Crear sensor
          </button>
        </div>

        <div v-if="showSensorForm" class="mb-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">{{ editingSensorId ? 'Editar sensor' : 'Crear sensor' }}</h3>
            <button type="button" class="text-sm text-slate-400 hover:text-white" @click="showSensorForm = false">Cerrar</button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="block text-sm text-slate-300">
              <span class="mb-1 block">ID predio</span>
              <input v-model="sensorForm.id_predio" type="number" min="1" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-orange-500" />
            </label>

            <label class="block text-sm text-slate-300">
              <span class="mb-1 block">Nombre</span>
              <input v-model="sensorForm.nombre" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-orange-500" />
            </label>

            <label class="block text-sm text-slate-300">
              <span class="mb-1 block">Tipo</span>
              <select v-model="sensorForm.tipo_sensor" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-orange-500">
                <option value="TEMPERATURA">Temperatura</option>
                <option value="HUMO">Humo</option>
                <option value="CO">CO</option>
                <option value="HUMEDAD">Humedad</option>
              </select>
            </label>

            <label class="block text-sm text-slate-300">
              <span class="mb-1 block">Estado</span>
              <select v-model="sensorForm.estado" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-orange-500">
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
                <option value="ERROR">Error</option>
              </select>
            </label>

            <label class="block text-sm text-slate-300">
              <span class="mb-1 block">Modelo</span>
              <input v-model="sensorForm.modelo" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-orange-500" />
            </label>

            <label class="block text-sm text-slate-300">
              <span class="mb-1 block">Fabricante</span>
              <input v-model="sensorForm.fabricante" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-orange-500" />
            </label>

            <label class="block text-sm text-slate-300">
              <span class="mb-1 block">Unidad de medida</span>
              <input v-model="sensorForm.unidad_medida" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-orange-500" />
            </label>

            <label class="block text-sm text-slate-300">
              <span class="mb-1 block">Fecha instalación</span>
              <input v-model="sensorForm.fecha_instalacion" type="date" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-orange-500" />
            </label>

            <label class="block text-sm text-slate-300">
              <span class="mb-1 block">Rango mínimo</span>
              <input v-model="sensorForm.rango_min" type="number" step="0.01" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-orange-500" />
            </label>

            <label class="block text-sm text-slate-300">
              <span class="mb-1 block">Rango máximo</span>
              <input v-model="sensorForm.rango_max" type="number" step="0.01" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-orange-500" />
            </label>
          </div>

          <div class="mt-4 flex justify-end gap-3">
            <button type="button" class="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200" @click="showSensorForm = false">Cancelar</button>
            <button type="button" class="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white" @click="submitSensor">Guardar</button>
          </div>
        </div>

        <!-- Filtros -->
        <div
          class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="relative flex-1">
            <Search
              class="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400"
            />

            <input
              v-model="search"
              class="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-3 text-sm text-white outline-none ring-0 placeholder:text-slate-400 focus:border-orange-500"
              placeholder="Buscar sensor"
            />
          </div>

          <div
            class="flex flex-col gap-2 sm:flex-row"
          >
            <!-- Tipo -->
            <select
              v-model="selectedType"
              class="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100"
            >
              <option>Todos</option>
              <option>Temperatura</option>
              <option>Humo</option>
              <option>CO</option>
              <option>Humedad</option>
            </select>

            <!-- Estado -->
            <select
              v-model="selectedState"
              class="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100"
            >
              <option>Todos</option>
              <option>Activo</option>
              <option>Inactivo</option>
              <option>Mantenimiento</option>
              <option>Error</option>
            </select>
          </div>
        </div>

        <!-- Tabla -->
        <div class="mt-5 overflow-x-auto">
          <table
            class="min-w-full text-left text-sm text-slate-300"
          >
            <thead
              class="text-[10px] uppercase tracking-[0.2em] text-slate-400"
            >
              <tr>
                <th class="pb-3">ID</th>
                <th class="pb-3">Nombre</th>
                <th class="pb-3">Tipo</th>
                <th class="pb-3">Estado</th>
                <th class="pb-3">
                  Última lectura
                </th>
                <th class="pb-3">
                  Ubicación
                </th>
                <th class="pb-3">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="sensor in filteredSensors"
                :key="sensor.id_sensor"
                class="border-t border-slate-800 align-top"
              >
                <!-- ID -->
                <td
                  class="py-3 font-medium text-white"
                >
                  {{ sensor.id_sensor }}
                </td>

                <!-- Nombre -->
                <td class="py-3">
                  <div
                    class="flex items-center gap-3"
                  >
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-300"
                    >
                      <Wifi class="h-4 w-4" />
                    </div>

                    <div>
                      <div
                        class="font-medium text-white"
                      >
                        {{ sensor.nombre }}
                      </div>

                      <div
                        class="text-xs text-slate-400"
                      >
                        {{ sensor.modelo }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Tipo -->
                <td class="py-3">
                  {{ sensor.tipo_sensor }}
                </td>

                <!-- Estado -->
                <td class="py-3">
                  <StatusBadge
                    :tone="
                      sensor.estado === 'Activo'
                        ? 'success'
                        : sensor.estado === 'Mantenimiento'
                          ? 'warning'
                          : sensor.estado === 'Error'
                            ? 'danger'
                            : 'neutral'
                    "
                    :state="sensor.estado"
                  >
                    {{ sensor.estado }}
                  </StatusBadge>
                </td>

                <!-- Última lectura -->
                <td class="py-3">
                  <span
                    v-if="sensor.ultima_lectura !== null"
                    class="font-medium text-white"
                  >
                    {{ sensor.ultima_lectura }}
                    {{ sensor.unidad_medida }}
                  </span>

                  <span
                    v-else
                    class="text-slate-500"
                  >
                    Sin lecturas
                  </span>
                </td>

                <!-- Ubicación -->
                <td class="py-3">
                  {{ sensor.ubicacion }}
                </td>

                <!-- Acción -->
                <td class="py-3">
                  <div class="flex flex-col gap-2">
                    <button
                      class="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-orange-500 hover:text-white"
                      @click="openSensor(sensor)"
                    >
                      Ver detalle

                      <ArrowRight
                        class="h-3.5 w-3.5"
                      />
                    </button>

                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:border-orange-500 hover:text-white"
                        @click="openEditSensor(sensor)"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        class="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-500/20"
                        @click="deleteSensor(sensor)"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sin resultados -->
        <div
          v-if="filteredSensors.length === 0"
          class="py-10 text-center text-sm text-slate-500"
        >
          No se encontraron sensores.
        </div>
      </section>

      <!-- Detalle del sensor -->
      <aside
        v-if="sensorDetail"
        class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
      >
        <div
          class="mb-4 flex items-center justify-between"
        >
          <div>
            <p
              class="text-[10px] uppercase tracking-[0.22em] text-slate-400"
            >
              Detalle
            </p>

            <h2
              class="mt-2 text-xl font-semibold text-white"
            >
              {{ sensorDetail.nombre }}
            </h2>
          </div>

          <StatusBadge
            :tone="
              sensorDetail.estado === 'Activo'
                ? 'success'
                : sensorDetail.estado === 'Mantenimiento'
                  ? 'warning'
                  : sensorDetail.estado === 'Error'
                    ? 'danger'
                    : 'neutral'
            "
            :state="sensorDetail.estado"
          >
            {{ sensorDetail.estado }}
          </StatusBadge>
        </div>

        <!-- Datos -->
        <dl
          class="space-y-3 text-sm text-slate-300"
        >
          <div
            class="flex items-center justify-between border-b border-slate-800 pb-2"
          >
            <dt>ID</dt>

            <dd class="text-white">
              {{ sensorDetail.id_sensor }}
            </dd>
          </div>

          <div
            class="flex items-center justify-between border-b border-slate-800 pb-2"
          >
            <dt>Tipo</dt>

            <dd class="text-white">
              {{ sensorDetail.tipo_sensor }}
            </dd>
          </div>

          <div
            class="flex items-center justify-between border-b border-slate-800 pb-2"
          >
            <dt>Unidad</dt>

            <dd class="text-white">
              {{ sensorDetail.unidad_medida }}
            </dd>
          </div>

          <div
            class="flex items-center justify-between border-b border-slate-800 pb-2"
          >
            <dt>Modelo</dt>

            <dd class="text-white">
              {{ sensorDetail.modelo }}
            </dd>
          </div>

          <div
            class="flex items-center justify-between border-b border-slate-800 pb-2"
          >
            <dt>Fabricante</dt>

            <dd class="text-white">
              {{ sensorDetail.fabricante }}
            </dd>
          </div>

          <div
            class="flex items-center justify-between border-b border-slate-800 pb-2"
          >
            <dt>Instalación</dt>

            <dd class="text-white">
              {{
                new Date(
                  sensorDetail.fecha_instalacion,
                ).toLocaleDateString()
              }}
            </dd>
          </div>

          <div
            class="flex items-center justify-between border-b border-slate-800 pb-2"
          >
            <dt>Ubicación</dt>

            <dd
              class="max-w-[220px] text-right text-white"
            >
              {{ sensorDetail.ubicacion }}
            </dd>
          </div>

          <div
            v-if="sensorDetail.rango_min !== undefined"
            class="flex items-center justify-between border-b border-slate-800 pb-2"
          >
            <dt>Rango mínimo</dt>

            <dd class="text-white">
              {{ sensorDetail.rango_min }}
              {{ sensorDetail.unidad_medida }}
            </dd>
          </div>

          <div
            v-if="sensorDetail.rango_max !== undefined"
            class="flex items-center justify-between border-b border-slate-800 pb-2"
          >
            <dt>Rango máximo</dt>

            <dd class="text-white">
              {{ sensorDetail.rango_max }}
              {{ sensorDetail.unidad_medida }}
            </dd>
          </div>

          <div
            class="flex items-center justify-between border-b border-slate-800 pb-2"
          >
            <dt>Última lectura</dt>

            <dd class="text-white">
              <span
                v-if="sensorDetail.ultima_lectura !== null"
              >
                {{ sensorDetail.ultima_lectura }}
                {{ sensorDetail.unidad_medida }}
              </span>

              <span
                v-else
                class="text-slate-500"
              >
                Sin lecturas
              </span>
            </dd>
          </div>
        </dl>

        <!-- Lecturas -->
        <div
          class="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
        >
          <div
            class="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"
          >
            <Factory
              class="h-4 w-4 text-orange-300"
            />

            Últimas lecturas
          </div>

          <ul
            v-if="sensorReadings.length > 0"
            class="space-y-2 text-sm text-slate-300"
          >
            <li
              v-for="reading in sensorReadings.slice(0, 4)"
              :key="reading.id_lectura"
              class="flex items-center justify-between gap-2 rounded-lg bg-slate-900 px-2 py-2"
            >
              <span>
                {{ reading.variable }}
              </span>

              <span class="text-white">
                {{ reading.valor }}
                {{ reading.unidad }}
              </span>
            </li>
          </ul>

          <p
            v-else
            class="py-4 text-center text-sm text-slate-500"
          >
            Este sensor no tiene lecturas registradas.
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>