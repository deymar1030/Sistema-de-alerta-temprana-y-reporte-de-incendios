
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import { useRoute, useRouter } from 'vue-router'

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wifi,
  X,
} from 'lucide-vue-next'

import { useSensorStore } from '../stores/sensor.store'
import { usePredioStore } from '../stores/predio.store'
import { readingService } from '../services/reading.service'

import {
  SENSOR_STATES,
  SENSOR_TYPES,
  type CreateSensorInput,
} from '../services/sensor.service'

import type { Reading, Sensor } from '../types'

type SensorForm = {
  id_predio: string
  nombre: string
  tipo_sensor: string
  unidad_medida: string
  modelo: string
  fabricante: string
  fecha_instalacion: string
  estado: string
  rango_min: string
  rango_max: string
}

const route = useRoute()
const router = useRouter()
const sensors = useSensorStore()
const predios = usePredioStore()

const search = ref('')
const selectedType = ref('TODOS')
const selectedState = ref('TODOS')
const notice = ref('')
const noticeError = ref(false)

const formOpen = ref(false)
const formError = ref('')
const saving = ref(false)
const editingId = ref<string | null>(null)
const formDialog = ref<HTMLElement | null>(null)
const firstInput = ref<HTMLInputElement | null>(null)

let oldOverflow = ''
let oldFocus: HTMLElement | null = null

const selected = ref<Sensor | null>(null)
const detailLoading = ref(false)
const detailError = ref('')
const readings = ref<Reading[]>([])
const readingsLoading = ref(false)
const readingsError = ref('')

function unitFor(type: string): string {
  return (
    SENSOR_TYPES.find((item) => item.value === type)?.unit ??
    ''
  )
}

function emptyForm(): SensorForm {
  return {
    id_predio: '',
    nombre: '',
    tipo_sensor: 'TEMPERATURA',
    unidad_medida: '°C',
    modelo: '',
    fabricante: '',
    fecha_instalacion: '',
    estado: 'ACTIVO',
    rango_min: '',
    rango_max: '',
  }
}

const form = ref<SensorForm>(emptyForm())

watch(
  () => form.value.tipo_sensor,
  (next, previous) => {
    if (
      !form.value.unidad_medida ||
      form.value.unidad_medida === unitFor(previous)
    ) {
      form.value.unidad_medida = unitFor(next)
    }
  }
)

const filtered = computed(() => {
  const q = search.value.trim().toLocaleLowerCase()

  return sensors.sensors.filter((sensor) => {
    const matchesText =
      !q ||
      [
        sensor.nombre,
        sensor.id_sensor,
        sensor.ubicacion,
        sensor.modelo,
        sensor.variable,
      ].some((value) =>
        String(value ?? '')
          .toLocaleLowerCase()
          .includes(q)
      )

    const matchesType =
      selectedType.value === 'TODOS' ||
      sensor.variable === selectedType.value

    const matchesState =
      selectedState.value === 'TODOS' ||
      sensor.estado.toUpperCase() === selectedState.value ||
      (selectedState.value === 'MANTENIMIENTO' &&
        sensor.estado === 'Mantenimiento')

    return matchesText && matchesType && matchesState
  })
})

const typeOptions = computed(() => {
  const options: Array<{
    value: string
    label: string
  }> = SENSOR_TYPES.map((type) => ({
    value: type.value,
    label: type.label,
  }))

  const known = new Set(
    options.map((option) => option.value)
  )

  for (const sensor of sensors.sensors) {
    if (
      sensor.variable &&
      !known.has(sensor.variable)
    ) {
      options.push({
        value: sensor.variable,
        label: sensor.variable,
      })

      known.add(sensor.variable)
    }
  }

  return options
})

function predioName(id?: string): string {
  const match = predios.prediosDetail.find(
    (item) => String(item.id_predio) === String(id)
  )

  return (
    match?.nombre ||
    (id ? `Predio #${id}` : 'Sin predio')
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No se pudo completar la operación.'
}

function dateLabel(date: string): string {
  if (!date) return 'Sin fecha registrada'

  const value = new Date(date)

  return Number.isNaN(value.getTime())
    ? date
    : value.toLocaleDateString('es-BO')
}

function mapStateToApi(state: Sensor['estado']): string {
  switch (state) {
    case 'Activo':
      return 'ACTIVO'
    case 'Inactivo':
      return 'INACTIVO'
    case 'Mantenimiento':
      return 'MANTENIMIENTO'
    case 'Error':
      return 'ERROR'
    default:
      return ''
  }
}

function resetForm() {
  form.value = emptyForm()
  editingId.value = null
  formError.value = ''
}

function openDialog() {
  oldFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

  oldOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  formOpen.value = true

  void nextTick(() => firstInput.value?.focus())
}

function closeForm() {
  if (saving.value) return

  formOpen.value = false
  document.body.style.overflow = oldOverflow

  void nextTick(() => oldFocus?.focus())
}

function createForm() {
  resetForm()
  notice.value = ''
  openDialog()
}

function editForm(sensor: Sensor) {
  resetForm()

  editingId.value = sensor.id_sensor

  form.value = {
    id_predio: sensor.id_predio ?? '',
    nombre: sensor.nombre,
    tipo_sensor: sensor.variable,
    unidad_medida: sensor.unidad_medida,
    modelo: sensor.modelo,
    fabricante: sensor.fabricante,
    fecha_instalacion:
      sensor.fecha_instalacion?.slice(0, 10) ?? '',
    estado: mapStateToApi(sensor.estado),
    rango_min:
      sensor.rango_min == null
        ? ''
        : String(sensor.rango_min),
    rango_max:
      sensor.rango_max == null
        ? ''
        : String(sensor.rango_max),
  }

  if (!form.value.estado) {
    formError.value =
      'El estado del sensor no está reconocido. Selecciona uno válido antes de guardar.'
  }

  openDialog()
}

function positiveId(
  raw: unknown,
  field: string
): number {
  const text = String(raw ?? '').trim()
  const value = Number(text)

  if (
    !/^\d+$/.test(text) ||
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `Selecciona un ${field} válido.`
    )
  }

  return value
}

function buildPayload(): CreateSensorInput {
  const id = positiveId(
    form.value.id_predio,
    'predio'
  )

  if (
    !predios.prediosDetail.some(
      (item) =>
        String(item.id_predio) === String(id)
    )
  ) {
    throw new Error(
      'Selecciona un predio existente del listado.'
    )
  }

  const nombre = String(
    form.value.nombre ?? ''
  ).trim()

  if (!nombre) {
    throw new Error(
      'El nombre del sensor es obligatorio.'
    )
  }

  const tipo = String(
    form.value.tipo_sensor ?? ''
  ).trim().toUpperCase()

  if (!tipo) {
    throw new Error(
      'Selecciona el tipo del sensor.'
    )
  }

  const estado = String(
    form.value.estado ?? ''
  ).trim().toUpperCase()

  if (
    !SENSOR_STATES.some(
      (entry) => entry.value === estado
    )
  ) {
    throw new Error(
      'Selecciona un estado válido.'
    )
  }

  const payload: CreateSensorInput = {
    id_predio: id,
    nombre,
    tipo_sensor: tipo,
    estado,
  }

  const optional: Array<
    keyof Pick<
      CreateSensorInput,
      | 'unidad_medida'
      | 'modelo'
      | 'fabricante'
      | 'fecha_instalacion'
    >
  > = [
    'unidad_medida',
    'modelo',
    'fabricante',
    'fecha_instalacion',
  ]

  for (const key of optional) {
    const value = String(
      form.value[key] ?? ''
    ).trim()

    if (value) {
      payload[key] = value
    }
  }

  for (
    const key of [
      'rango_min',
      'rango_max',
    ] as const
  ) {
    const raw = String(
      form.value[key] ?? ''
    ).trim()

    if (!raw) continue

    const numeric = Number(raw)

    if (!Number.isFinite(numeric)) {
      throw new Error(
        `El campo ${key} debe ser numérico.`
      )
    }

    payload[key] = numeric
  }

  if (
    payload.rango_min !== undefined &&
    payload.rango_max !== undefined &&
    payload.rango_min > payload.rango_max
  ) {
    throw new Error(
      'El rango mínimo no puede superar al máximo.'
    )
  }

  return payload
}

async function save() {
  if (saving.value) return

  formError.value = ''

  let payload: CreateSensorInput

  try {
    payload = buildPayload()
  } catch (error) {
    formError.value = errorMessage(error)
    return
  }

  saving.value = true

  try {
    const wasEditing = editingId.value !== null

    if (wasEditing) {
      await sensors.updateSensor(
        editingId.value!,
        payload
      )
    } else {
      await sensors.createSensor(payload)
    }

    formOpen.value = false
    document.body.style.overflow = oldOverflow

    await sensors.fetchSensors()

    noticeError.value = Boolean(sensors.error)

    notice.value = sensors.error
      ? 'El servidor aceptó la operación, pero no se pudo recargar el listado. Actualízalo antes de repetirla.'
      : wasEditing
        ? 'Sensor actualizado correctamente.'
        : 'Sensor creado correctamente.'

    if (route.params.id) {
      await refreshDetail(
        String(route.params.id)
      )
    }
  } catch (error) {
    formError.value = errorMessage(error)
  } finally {
    saving.value = false
  }
}

async function remove(sensor: Sensor) {
  if (
    !window.confirm(
      `¿Eliminar el sensor "${sensor.nombre}"? Esta acción puede ser irreversible.`
    )
  ) {
    return
  }

  try {
    await sensors.deleteSensor(sensor.id_sensor)
    await sensors.fetchSensors()

    noticeError.value = Boolean(sensors.error)

    notice.value = sensors.error
      ? 'El sensor fue eliminado, pero no se pudo actualizar el listado.'
      : 'Sensor eliminado correctamente.'

    if (
      String(route.params.id ?? '') ===
      sensor.id_sensor
    ) {
      await router.push('/sensores')
    }
  } catch (error) {
    notice.value = errorMessage(error)
    noticeError.value = true
  }
}

async function openDetail(id: string) {
  await router.push(
    `/sensores/${encodeURIComponent(id)}`
  )
}

async function refreshDetail(id: string) {
  detailLoading.value = true
  detailError.value = ''
  selected.value = null
  readings.value = []
  readingsError.value = ''

  try {
    const detail =
      await sensors.getSensorById(id)

    if (
      String(route.params.id ?? '') !== id
    ) {
      return
    }

    if (!detail) {
      detailError.value =
        'No se encontró el sensor solicitado.'
      return
    }

    selected.value = detail
  } catch (error) {
    if (
      String(route.params.id ?? '') === id
    ) {
      detailError.value = errorMessage(error)
    }
  } finally {
    if (
      String(route.params.id ?? '') === id
    ) {
      detailLoading.value = false
    }
  }

  if (
    !selected.value ||
    String(route.params.id ?? '') !== id
  ) {
    return
  }

  readingsLoading.value = true

  try {
    const items =
      await readingService.getReadingsBySensor(id)

    if (
      String(route.params.id ?? '') === id
    ) {
      readings.value = items
    }
  } catch (error) {
    if (
      String(route.params.id ?? '') === id
    ) {
      readingsError.value = errorMessage(error)
    }
  } finally {
    if (
      String(route.params.id ?? '') === id
    ) {
      readingsLoading.value = false
    }
  }
}

function onKeydown(event: KeyboardEvent) {
  if (!formOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    closeForm()
    return
  }

  if (
    event.key !== 'Tab' ||
    !formDialog.value
  ) {
    return
  }

  const items = Array.from(
    formDialog.value.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'
    )
  ).filter(
    (item) => item.getClientRects().length > 0
  )

  if (!items.length) return

  if (
    event.shiftKey &&
    document.activeElement === items[0]
  ) {
    event.preventDefault()
    items[items.length - 1]?.focus()
  } else if (
    !event.shiftKey &&
    document.activeElement ===
      items[items.length - 1]
  ) {
    event.preventDefault()
    items[0]?.focus()
  }
}

watch(
  () => route.params.id,
  (next) => {
    const id = Array.isArray(next)
      ? next[0]
      : next

    if (!id) {
      selected.value = null
      readings.value = []
      detailError.value = ''
      return
    }

    void refreshDetail(id)
  },
  { immediate: true }
)

onMounted(() => {
  document.addEventListener(
    'keydown',
    onKeydown
  )

  void sensors.fetchSensors()
  void predios.fetchPredios()
})

onBeforeUnmount(() => {
  document.removeEventListener(
    'keydown',
    onKeydown
  )

  if (formOpen.value) {
    document.body.style.overflow = oldOverflow
  }
})
</script>

<template>
  <main
    class="admin-page mx-auto w-full max-w-[1500px] space-y-5 p-0 sm:p-2 lg:p-4"
  >
    <header
      class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div class="min-w-0">
        <p
          class="text-xs font-bold uppercase tracking-widest text-orange-600"
        >
          Administración
        </p>

        <h1
          class="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
        >
          Sensores
        </h1>

        <p
          class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600"
        >
          Consulta y administra sensores asociados a los predios registrados.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700"
        @click="createForm"
      >
        <Plus class="h-5 w-5" aria-hidden="true" />
        Crear sensor
      </button>
    </header>

    <div
      v-if="notice"
      role="status"
      class="flex items-start gap-3 rounded-xl border p-4 text-sm"
      :class="
        noticeError
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-emerald-200 bg-emerald-50 text-emerald-900'
      "
    >
      <AlertCircle
        v-if="noticeError"
        class="mt-0.5 h-5 w-5 shrink-0"
        aria-hidden="true"
      />

      <CheckCircle2
        v-else
        class="mt-0.5 h-5 w-5 shrink-0"
        aria-hidden="true"
      />

      <span class="min-w-0 flex-1 break-words">
        {{ notice }}
      </span>

      <button
        type="button"
        aria-label="Cerrar aviso"
        class="min-h-11 min-w-11 rounded-xl"
        @click="notice = ''"
      >
        <X class="mx-auto h-4 w-4" />
      </button>
    </div>

    <section
      class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      aria-label="Directorio de sensores"
    >
      <div
        class="flex min-w-0 flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="min-w-0">
          <h2
            class="flex items-center gap-2 text-lg font-bold text-slate-900"
          >
            <Wifi
              class="h-5 w-5 text-orange-600"
              aria-hidden="true"
            />
            Directorio de sensores
          </h2>

          <p class="mt-1 text-sm text-slate-600">
            {{ sensors.sensors.length }} sensores registrados
          </p>
        </div>

        <div class="flex min-w-0 flex-wrap gap-2">
          <label
            class="relative min-w-0 flex-1 sm:w-64 sm:flex-none"
          >
            <span class="sr-only">Buscar sensores</span>

            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />

            <input
              v-model="search"
              type="search"
              placeholder="Buscar sensor, tipo o predio"
              class="form-input pl-10"
            />
          </label>

          <label class="min-w-0 flex-1 sm:w-auto">
            <span class="sr-only">Filtrar por tipo</span>

            <select
              v-model="selectedType"
              class="form-input"
            >
              <option value="TODOS">
                Todos los tipos
              </option>

              <option
                v-for="type in typeOptions"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </label>

          <label class="min-w-0 flex-1 sm:w-auto">
            <span class="sr-only">Filtrar por estado</span>

            <select
              v-model="selectedState"
              class="form-input"
            >
              <option value="TODOS">
                Todos los estados
              </option>

              <option
                v-for="state in SENSOR_STATES"
                :key="state.value"
                :value="state.value"
              >
                {{ state.label }}
              </option>
            </select>
          </label>

          <button
            type="button"
            aria-label="Actualizar sensores"
            title="Actualizar sensores"
            class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
            :disabled="sensors.loading"
            @click="sensors.fetchSensors()"
          >
            <RefreshCw
              class="h-4 w-4"
              :class="{ 'animate-spin': sensors.loading }"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div
        v-if="sensors.loading"
        role="status"
        class="p-10 text-center text-sm text-slate-600"
      >
        Cargando sensores...
      </div>

      <div
        v-else-if="sensors.error"
        role="alert"
        class="m-4 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      >
        <p class="break-words">
          {{ sensors.error }}
        </p>

        <button
          type="button"
          class="mt-3 min-h-11 rounded-xl border border-red-200 bg-white px-4 font-semibold"
          @click="sensors.fetchSensors()"
        >
          Reintentar
        </button>
      </div>

      <div
        v-else-if="!filtered.length"
        class="p-10 text-center text-sm text-slate-600"
      >
        {{
          sensors.sensors.length
            ? 'No hay sensores que coincidan con los filtros.'
            : 'Aún no hay sensores registrados. Ya puedes asociar el primero a un predio.'
        }}
      </div>

      <template v-else>
        <!-- Tarjetas en móvil y tablet -->
        <div
          class="grid gap-3 p-4 sm:grid-cols-2 lg:hidden"
        >
          <article
            v-for="sensor in filtered"
            :key="sensor.id_sensor"
            class="min-w-0 space-y-3 rounded-xl border border-slate-200 p-4"
          >
            <div
              class="flex flex-wrap items-start justify-between gap-2"
            >
              <div class="min-w-0">
                <h3
                  class="break-words font-bold text-slate-900"
                >
                  {{ sensor.nombre }}
                </h3>

                <p
                  class="mt-1 break-words text-sm text-slate-600"
                >
                  {{ sensor.tipo_sensor }}
                  ·
                  {{ predioName(sensor.id_predio) }}
                </p>
              </div>

              <span
                class="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
              >
                #{{ sensor.id_sensor }}
              </span>
            </div>

            <div
              class="flex flex-wrap gap-2 text-sm text-slate-700"
            >
              <span
                class="rounded-full bg-slate-100 px-3 py-1"
              >
                {{ sensor.estado }}
              </span>

              <span>
                {{
                  sensor.ultima_lectura === null
                    ? 'Sin lecturas'
                    : `${sensor.ultima_lectura} ${sensor.unidad_medida}`
                }}
              </span>
            </div>

            <div class="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                class="min-h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-700"
                @click="openDetail(sensor.id_sensor)"
              >
                Ver detalle
              </button>

              <button
                type="button"
                class="min-h-11 rounded-xl border border-orange-200 px-3 text-sm font-medium text-orange-700"
                @click="editForm(sensor)"
              >
                Editar
              </button>

              <button
                type="button"
                class="min-h-11 rounded-xl border border-red-200 px-3 text-sm text-red-700"
                @click="remove(sensor)"
              >
                Eliminar
              </button>
            </div>
          </article>
        </div>

        <!-- Tabla en escritorio -->
        <div class="hidden overflow-x-auto lg:block">
          <table
            class="w-full min-w-[800px] text-left text-sm text-slate-700"
          >
            <thead
              class="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"
            >
              <tr>
                <th scope="col" class="px-4 py-3">
                  Sensor
                </th>
                <th scope="col" class="px-4 py-3">
                  Tipo
                </th>
                <th scope="col" class="px-4 py-3">
                  Predio
                </th>
                <th scope="col" class="px-4 py-3">
                  Estado
                </th>
                <th scope="col" class="px-4 py-3">
                  Última lectura
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-right"
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="sensor in filtered"
                :key="sensor.id_sensor"
                class="border-t border-slate-100 hover:bg-slate-50"
              >
                <td
                  class="max-w-60 break-words px-4 py-4"
                >
                  <div
                    class="font-semibold text-slate-900"
                  >
                    {{ sensor.nombre }}
                  </div>

                  <div class="mt-1 text-xs text-slate-500">
                    #{{ sensor.id_sensor }}
                  </div>
                </td>

                <td
                  class="max-w-40 break-words px-4 py-4"
                >
                  {{ sensor.tipo_sensor }}
                </td>

                <td
                  class="max-w-56 break-words px-4 py-4"
                >
                  {{ predioName(sensor.id_predio) }}
                </td>

                <td class="px-4 py-4">
                  <span
                    class="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                  >
                    {{ sensor.estado }}
                  </span>
                </td>

                <td class="px-4 py-4">
                  {{
                    sensor.ultima_lectura === null
                      ? 'Sin lecturas'
                      : `${sensor.ultima_lectura} ${sensor.unidad_medida}`
                  }}
                </td>

                <td class="px-4 py-4">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      aria-label="Ver detalle"
                      title="Ver detalle"
                      class="min-h-11 min-w-11 rounded-xl border border-slate-200 text-slate-700"
                      @click="openDetail(sensor.id_sensor)"
                    >
                      <Eye class="mx-auto h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      aria-label="Editar sensor"
                      title="Editar"
                      class="min-h-11 min-w-11 rounded-xl border border-slate-200 text-orange-700"
                      @click="editForm(sensor)"
                    >
                      <Pencil class="mx-auto h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      aria-label="Eliminar sensor"
                      title="Eliminar"
                      class="min-h-11 min-w-11 rounded-xl border border-red-200 text-red-700"
                      @click="remove(sensor)"
                    >
                      <Trash2 class="mx-auto h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>

    <!-- Detalle del sensor -->
    <section
      v-if="route.params.id"
      class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      aria-label="Detalle del sensor"
    >
      <header
        class="mb-4 flex flex-wrap items-start justify-between gap-3"
      >
        <div>
          <h2
            class="text-lg font-bold text-slate-900"
          >
            Detalle del sensor
          </h2>

          <p class="mt-1 text-sm text-slate-600">
            Información obtenida del backend
          </p>
        </div>

        <button
          type="button"
          class="min-h-11 rounded-xl border border-slate-200 px-4 text-sm text-slate-700"
          @click="router.push('/sensores')"
        >
          Cerrar detalle
        </button>
      </header>

      <p
        v-if="detailLoading"
        role="status"
        class="py-5 text-sm text-slate-600"
      >
        Cargando detalle...
      </p>

      <p
        v-else-if="detailError"
        role="alert"
        class="rounded-xl bg-red-50 p-4 text-sm text-red-800"
      >
        {{ detailError }}
      </p>

      <template v-else-if="selected">
        <h3
          class="mb-4 break-words text-xl font-bold text-slate-900"
        >
          {{ selected.nombre }}
        </h3>

        <dl
          class="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="entry in [
              { label: 'ID', value: selected.id_sensor },
              { label: 'Tipo', value: selected.tipo_sensor },
              { label: 'Predio', value: predioName(selected.id_predio) },
              { label: 'Estado', value: selected.estado },
              { label: 'Unidad', value: selected.unidad_medida || 'No registrada' },
              { label: 'Modelo', value: selected.modelo || 'No registrado' },
              { label: 'Fabricante', value: selected.fabricante || 'No registrado' },
              { label: 'Fecha de instalación', value: dateLabel(selected.fecha_instalacion) },
              { label: 'Rango mínimo', value: selected.rango_min ?? 'No registrado' },
              { label: 'Rango máximo', value: selected.rango_max ?? 'No registrado' },
            ]"
            :key="entry.label"
            class="min-w-0 rounded-xl bg-slate-50 p-3"
          >
            <dt
              class="text-xs font-bold uppercase tracking-wide text-slate-600"
            >
              {{ entry.label }}
            </dt>

            <dd
              class="mt-1 break-words font-medium text-slate-900"
            >
              {{ entry.value }}
            </dd>
          </div>
        </dl>

        <div
          class="mt-5 rounded-xl border border-slate-200 p-4"
        >
          <h4
            class="font-bold text-slate-900"
          >
            Lecturas registradas
          </h4>

          <p
            v-if="readingsLoading"
            role="status"
            class="mt-3 text-sm text-slate-600"
          >
            Consultando lecturas...
          </p>

          <p
            v-else-if="readingsError"
            role="alert"
            class="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
          >
            {{ readingsError }}
          </p>

          <p
            v-else-if="!readings.length"
            class="mt-3 text-sm text-slate-600"
          >
            Este sensor todavía no tiene lecturas.
          </p>

          <div
            v-else
            class="mt-3 space-y-2"
          >
            <div
              v-for="reading in readings.slice(0, 10)"
              :key="reading.id_lectura"
              class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"
            >
              <span
                class="font-medium text-slate-800"
              >
                {{ reading.variable }}
              </span>

              <span class="text-slate-800">
                {{ reading.valor }}
                {{ reading.unidad }}
                ·
                {{ reading.estado }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </section>

    <!-- Formulario modal -->
    <Teleport to="body">
      <div
        v-if="formOpen"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/65 p-2 sm:p-5"
        @click.self="closeForm"
      >
        <div
          ref="formDialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sensor-dialog-title"
          class="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]"
        >
          <header
            class="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-4 sm:px-6"
          >
            <div class="min-w-0">
              <p
                class="text-xs font-bold uppercase tracking-widest text-orange-600"
              >
                Sensores
              </p>

              <h2
                id="sensor-dialog-title"
                class="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl"
              >
                {{
                  editingId
                    ? 'Editar sensor'
                    : 'Crear sensor'
                }}
              </h2>

              <p class="mt-1 text-sm text-slate-600">
                Asocia el sensor a un predio registrado.
                Los campos sin asterisco son opcionales.
              </p>
            </div>

            <button
              type="button"
              class="min-h-11 min-w-11 shrink-0 rounded-xl border border-slate-200"
              aria-label="Cerrar formulario"
              :disabled="saving"
              @click="closeForm"
            >
              <X class="mx-auto h-5 w-5" />
            </button>
          </header>

          <form
            class="flex min-h-0 flex-1 flex-col"
            @submit.prevent="save"
          >
            <div
              class="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6"
            >
              <p
                v-if="formError"
                role="alert"
                class="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {{ formError }}
              </p>

              <div
                v-if="predios.error"
                role="alert"
                class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              >
                No se pudieron cargar los predios:
                {{ predios.error }}

                <button
                  type="button"
                  class="ml-3 underline"
                  @click="predios.fetchPredios()"
                >
                  Reintentar
                </button>
              </div>

              <div
                v-else-if="
                  !predios.loading &&
                  !predios.prediosDetail.length
                "
                class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              >
                No hay predios disponibles. Crea primero
                un predio en la sección Predios.
              </div>

              <div
                class="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Predio
                  <span class="text-orange-600">*</span>

                  <select
                    v-model="form.id_predio"
                    required
                    class="form-input mt-1 font-normal"
                    :disabled="
                      predios.loading ||
                      Boolean(predios.error) ||
                      !predios.prediosDetail.length
                    "
                  >
                    <option value="">
                      {{
                        predios.loading
                          ? 'Cargando predios...'
                          : 'Selecciona un predio'
                      }}
                    </option>

                    <option
                      v-for="predio in predios.prediosDetail"
                      :key="predio.id_predio"
                      :value="String(predio.id_predio)"
                    >
                      {{ predio.nombre }}
                      (#{{ predio.id_predio }})
                    </option>
                  </select>
                </label>

                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Nombre del sensor
                  <span class="text-orange-600">*</span>

                  <input
                    ref="firstInput"
                    v-model="form.nombre"
                    required
                    maxlength="200"
                    type="text"
                    placeholder="Ej. Sensor de humo patio"
                    class="form-input mt-1 font-normal"
                  />
                </label>

                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Tipo de sensor
                  <span class="text-orange-600">*</span>

                  <select
                    v-model="form.tipo_sensor"
                    required
                    class="form-input mt-1 font-normal"
                  >
                    <option
                      v-for="type in typeOptions"
                      :key="type.value"
                      :value="type.value"
                    >
                      {{ type.label }}
                    </option>
                  </select>
                </label>

                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Estado
                  <span class="text-orange-600">*</span>

                  <select
                    v-model="form.estado"
                    required
                    class="form-input mt-1 font-normal"
                  >
                    <option
                      value=""
                      disabled
                    >
                      Selecciona un estado
                    </option>

                    <option
                      v-for="state in SENSOR_STATES"
                      :key="state.value"
                      :value="state.value"
                    >
                      {{ state.label }}
                    </option>
                  </select>
                </label>

                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Unidad de medida

                  <input
                    v-model="form.unidad_medida"
                    type="text"
                    maxlength="50"
                    placeholder="Ej. ppm, °C"
                    class="form-input mt-1 font-normal"
                  />
                </label>

                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Modelo

                  <input
                    v-model="form.modelo"
                    type="text"
                    maxlength="100"
                    placeholder="Ej. MQ-2"
                    class="form-input mt-1 font-normal"
                  />
                </label>

                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Fabricante

                  <input
                    v-model="form.fabricante"
                    type="text"
                    maxlength="100"
                    placeholder="Nombre del fabricante"
                    class="form-input mt-1 font-normal"
                  />
                </label>

                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Fecha de instalación

                  <input
                    v-model="form.fecha_instalacion"
                    type="date"
                    class="form-input mt-1 font-normal"
                  />
                </label>

                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Rango mínimo

                  <input
                    v-model="form.rango_min"
                    type="number"
                    step="any"
                    placeholder="Ingrese rango"
                    class="form-input mt-1 font-normal"
                  />
                </label>

                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Rango máximo

                  <input
                    v-model="form.rango_max"
                    type="number"
                    step="any"
                    placeholder="Ingrese un rango"
                    class="form-input mt-1 font-normal"
                  />
                </label>
              </div>
            </div>

            <footer
              class="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end sm:px-6"
            >
              <button
                type="button"
                class="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700"
                :disabled="saving"
                @click="closeForm"
              >
                Cancelar
              </button>

              <button
                type="submit"
                class="min-h-11 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                :disabled="
                  saving ||
                  predios.loading ||
                  Boolean(predios.error) ||
                  !predios.prediosDetail.length
                "
              >
                {{
                  saving
                    ? 'Guardando...'
                    : editingId
                      ? 'Guardar cambios'
                      : 'Crear sensor'
                }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Teleport>
  </main>
</template>
