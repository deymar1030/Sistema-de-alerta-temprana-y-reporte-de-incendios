<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { MapPin, Pencil, Plus, Trash2, X } from 'lucide-vue-next'

import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import { useToast } from '../composables/useToast'
import {
  locationService,
  type GeographicZone,
} from '../services/location.service'
import { usePredioStore } from '../stores/predio.store'
import {
  motorService,
  type MotorDeteccion,
} from '../services/motor.service'

const predioStore = usePredioStore()
const { showToast } = useToast()

const zoneOptions = ref<GeographicZone[]>([])
const motorOptions = ref<MotorDeteccion[]>([])
const showForm = ref(false)
const editingId = ref<string | null>(null)

/*
|--------------------------------------------------------------------------
| DETALLE DEL PREDIO
|--------------------------------------------------------------------------
| Guarda temporalmente el predio seleccionado para mostrarlo en el modal.
| No realiza ninguna petición nueva al backend.
*/
const selectedPredio = ref<any | null>(null)

const createEmptyForm = () => ({
  id_zona: '',
  id_motordet: '',
  tipo_predio: 'VIVIENDA',
  nombre: '',
  direccion: '',
  latitud: '',
  longitud: '',
  contrasena_mqtt: '',
  fecha_evaluacion: new Date().toISOString().slice(0, 10),

  estado_electrico: 1,
  estado_gas: 1,
  fuentes_calor: 1,
  carga_combustible: 1,
  material_construccion: 1,
  ocupacion: 1,
  nivel_proteccion: 1,
})

const form = ref(createEmptyForm())

const scoreFields = [
  'estado_electrico',
  'estado_gas',
  'fuentes_calor',
  'carga_combustible',
  'material_construccion',
  'ocupacion',
  'nivel_proteccion',
] as const

/*
|--------------------------------------------------------------------------
| ZONA
|--------------------------------------------------------------------------
*/
const zoneLabel = (idZona: string | number) => {
  const match = zoneOptions.value.find(
    (zone) => String(zone.id_zona) === String(idZona),
  )

  return match?.nombre ?? `Zona ${idZona}`
}

/*
|--------------------------------------------------------------------------
| VALIDACIÓN DE VALORES 1 - 5
|--------------------------------------------------------------------------
*/
const isValidScore = (value: number | string) => {
  const numeric = Number(value)

  return (
    Number.isInteger(numeric) &&
    numeric >= 1 &&
    numeric <= 5
  )
}

/*
|--------------------------------------------------------------------------
| FORMULARIO
|--------------------------------------------------------------------------
*/
const resetForm = () => {
  form.value = createEmptyForm()
  editingId.value = null
}

const validateForm = () => {
  if (!form.value.id_zona) {
    throw new Error('Debe seleccionar la zona del predio.')
  }

  if (!form.value.id_motordet) {
    throw new Error('Debe indicar el ID del motor de detección.')
  }

  if (!form.value.nombre.trim()) {
    throw new Error('Debe ingresar el nombre del predio.')
  }

  if (!form.value.direccion.trim()) {
    throw new Error('Debe ingresar la dirección del predio.')
  }

  if (!form.value.tipo_predio.trim()) {
    throw new Error('Debe indicar el tipo de predio.')
  }

  const lat = Number(form.value.latitud)
  const lng = Number(form.value.longitud)

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error(
      'La latitud debe ser un valor válido entre -90 y 90.',
    )
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error(
      'La longitud debe ser un valor válido entre -180 y 180.',
    )
  }

  for (const field of scoreFields) {
    if (!isValidScore(form.value[field] ?? 0)) {
      const label = field.replace(/_/g, ' ')

      throw new Error(
        `El campo ${label} solo acepta valores entre 1 y 5.`,
      )
    }
  }
}

/*
|--------------------------------------------------------------------------
| PAYLOAD DEL BACKEND
|--------------------------------------------------------------------------
*/
const normalizePayload = () => ({
  id_zona: Number(form.value.id_zona),
  id_motordet: Number(form.value.id_motordet),

  tipo_predio: form.value.tipo_predio.trim(),
  nombre: form.value.nombre.trim(),
  direccion: form.value.direccion.trim(),

  latitud: Number(form.value.latitud),
  longitud: Number(form.value.longitud),

  contrasena_mqtt: form.value.contrasena_mqtt.trim(),

  fecha_evaluacion: form.value.fecha_evaluacion,

  estado_electrico: Number(form.value.estado_electrico),
  estado_gas: Number(form.value.estado_gas),
  fuentes_calor: Number(form.value.fuentes_calor),
  carga_combustible: Number(form.value.carga_combustible),
  material_construccion: Number(
    form.value.material_construccion,
  ),
  ocupacion: Number(form.value.ocupacion),
  nivel_proteccion: Number(form.value.nivel_proteccion),
})

/*
|--------------------------------------------------------------------------
| CREAR
|--------------------------------------------------------------------------
*/
const openCreateForm = () => {
  resetForm()
  showForm.value = true
}

/*
|--------------------------------------------------------------------------
| EDITAR
|--------------------------------------------------------------------------
*/
const openEditForm = (predio: any) => {
  editingId.value = String(predio.id_predio)

  form.value = {
    id_zona: predio.id_zona ?? '',
    id_motordet: predio.id_motordet ?? '',

    tipo_predio: predio.tipo_predio ?? 'VIVIENDA',
    nombre: predio.nombre ?? '',
    direccion: predio.direccion ?? '',

    latitud: predio.latitud ?? '',
    longitud: predio.longitud ?? '',

    contrasena_mqtt: predio.contrasena_mqtt ?? '',

    fecha_evaluacion:
      predio.fecha_evaluacion ??
      new Date().toISOString().slice(0, 10),

    estado_electrico: predio.estado_electrico ?? 1,
    estado_gas: predio.estado_gas ?? 1,
    fuentes_calor: predio.fuentes_calor ?? 1,
    carga_combustible: predio.carga_combustible ?? 1,
    material_construccion:
      predio.material_construccion ?? 1,
    ocupacion: predio.ocupacion ?? 1,
    nivel_proteccion: predio.nivel_proteccion ?? 1,
  }

  showForm.value = true
}

/*
|--------------------------------------------------------------------------
| DETALLE
|--------------------------------------------------------------------------
*/
const openDetail = (predio: any) => {
  selectedPredio.value = predio
}

const closeDetail = () => {
  selectedPredio.value = null
}

/*
|--------------------------------------------------------------------------
| GUARDAR
|--------------------------------------------------------------------------
*/
const submit = async () => {
  try {
    validateForm()

    const payload = normalizePayload()

    if (editingId.value) {
      await predioStore.updatePredio(
        editingId.value,
        payload,
      )

      showToast({
        type: 'success',
        title: 'Predio actualizado',
        description:
          'Los cambios se sincronizaron con el backend.',
      })
    } else {
      await predioStore.createPredio(payload)

      showToast({
        type: 'success',
        title: 'Predio creado',
        description:
          'Se registró el nuevo predio correctamente.',
      })
    }

    await predioStore.fetchPredios()

    showForm.value = false
    resetForm()
  } catch (error) {
    showToast({
      type: 'error',
      title: 'No se pudo guardar el predio',
      description:
        error instanceof Error
          ? error.message
          : 'Revisa los datos e intenta nuevamente.',
    })
  }
}

/*
|--------------------------------------------------------------------------
| ELIMINAR
|--------------------------------------------------------------------------
*/
const handleDelete = async (id: string) => {
  const confirmed = window.confirm(
    '¿Deseas eliminar este predio?',
  )

  if (!confirmed) {
    return
  }

  try {
    await predioStore.deletePredio(id)

    await predioStore.fetchPredios()

    showToast({
      type: 'info',
      title: 'Predio eliminado',
      description:
        'Se eliminó el registro del backend.',
    })
  } catch (error) {
    showToast({
      type: 'error',
      title: 'No se pudo eliminar el predio',
      description:
        error instanceof Error
          ? error.message
          : 'La eliminación falló.',
    })
  }
}

/*
|--------------------------------------------------------------------------
| LISTADO
|--------------------------------------------------------------------------
*/
const loadedPredios = computed(
  () => predioStore.prediosDetail,
)

/*
|--------------------------------------------------------------------------
| CARGA INICIAL
|--------------------------------------------------------------------------
*/
onMounted(async () => {
  const [locations, motors] =
    await Promise.all([
      locationService.getLocations(),
      motorService.getMotors(),
    ])

  zoneOptions.value = locations
  motorOptions.value = motors

  await predioStore.fetchPredios()
})
</script>

<template>
  <div class="space-y-5 p-6">
    <!-- ======================================================
         CABECERA
    ======================================================= -->
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-500"
        >
          Administración
        </p>

        <h1
          class="mt-2 text-3xl font-bold text-slate-900"
        >
          Predios
        </h1>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-[#f24a23] px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#e24016]"
        @click="openCreateForm"
      >
        <Plus class="h-4 w-4" />

        <span>Crear predio</span>
      </button>
    </div>

    <!-- ======================================================
         FORMULARIO CREAR / EDITAR
    ======================================================= -->
    <div
      v-if="showForm"
      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div
        class="mb-4 flex items-center justify-between"
      >
        <h2
          class="text-xl font-bold text-slate-900"
        >
          {{
            editingId
              ? 'Editar predio'
              : 'Crear predio'
          }}
        </h2>

        <button
          type="button"
          class="text-sm font-medium text-slate-500 hover:text-slate-700"
          @click="showForm = false"
        >
          Cerrar
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <!-- ZONA -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Zona
          </span>

          <select
            v-model="form.id_zona"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
          >
            <option value="">
              Seleccione una zona
            </option>

            <option
              v-for="zone in zoneOptions"
              :key="zone.id_zona"
              :value="zone.id_zona"
            >
              {{ zone.nombre }}
            </option>
          </select>
        </label>

        <!-- MOTOR -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Motor de detección
          </span>

          <select
            v-model="form.id_motordet"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
          >
            <option value="">
              Seleccione un motor
            </option>

            <option
              v-for="motor in motorOptions"
              :key="motor.id_motordet"
              :value="motor.id_motordet"
            >
              Motor #{{ motor.id_motordet }}
            </option>
          </select>

          <p
            v-if="motorOptions.length === 0"
            class="mt-1 text-xs text-slate-500"
          >
            No hay motores de detección disponibles.
          </p>
        </label>

        <!-- TIPO -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Tipo de predio
          </span>

          <input
            v-model="form.tipo_predio"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
            placeholder="VIVIENDA"
          />
        </label>

        <!-- NOMBRE -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Nombre
          </span>

          <input
            v-model="form.nombre"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
            placeholder="Ej: Vivienda Familiar Obrajes"
          />
        </label>

        <!-- DIRECCIÓN -->
        <label class="block md:col-span-2">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Dirección
          </span>

          <input
            v-model="form.direccion"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
            placeholder="Calle 21 #123"
          />
        </label>

        <!-- LATITUD -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Latitud
          </span>

          <input
            v-model.number="form.latitud"
            type="number"
            step="0.0001"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
            placeholder="-16.541"
          />
        </label>

        <!-- LONGITUD -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Longitud
          </span>

          <input
            v-model.number="form.longitud"
            type="number"
            step="0.0001"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
            placeholder="-68.123"
          />
        </label>

        <!-- MQTT -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Contraseña MQTT
          </span>

          <input
            v-model="form.contrasena_mqtt"
            type="password"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
            placeholder="Ingrese la contraseña MQTT"
          />
        </label>

        <!-- FECHA -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Fecha de evaluación
          </span>

          <input
            v-model="form.fecha_evaluacion"
            type="date"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
          />
        </label>

        <!-- ESTADO ELÉCTRICO -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Estado eléctrico
          </span>

          <select
            v-model.number="form.estado_electrico"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
          >
            <option
              v-for="value in [1, 2, 3, 4, 5]"
              :key="value"
              :value="value"
            >
              {{ value }}
            </option>
          </select>
        </label>

        <!-- GAS -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Estado gas
          </span>

          <select
            v-model.number="form.estado_gas"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
          >
            <option
              v-for="value in [1, 2, 3, 4, 5]"
              :key="value"
              :value="value"
            >
              {{ value }}
            </option>
          </select>
        </label>

        <!-- FUENTES CALOR -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Fuentes de calor
          </span>

          <select
            v-model.number="form.fuentes_calor"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
          >
            <option
              v-for="value in [1, 2, 3, 4, 5]"
              :key="value"
              :value="value"
            >
              {{ value }}
            </option>
          </select>
        </label>

        <!-- CARGA COMBUSTIBLE -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Carga combustible
          </span>

          <select
            v-model.number="form.carga_combustible"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
          >
            <option
              v-for="value in [1, 2, 3, 4, 5]"
              :key="value"
              :value="value"
            >
              {{ value }}
            </option>
          </select>
        </label>

        <!-- MATERIAL -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Material construcción
          </span>

          <select
            v-model.number="form.material_construccion"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
          >
            <option
              v-for="value in [1, 2, 3, 4, 5]"
              :key="value"
              :value="value"
            >
              {{ value }}
            </option>
          </select>
        </label>

        <!-- OCUPACIÓN -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Ocupación
          </span>

          <select
            v-model.number="form.ocupacion"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
          >
            <option
              v-for="value in [1, 2, 3, 4, 5]"
              :key="value"
              :value="value"
            >
              {{ value }}
            </option>
          </select>
        </label>

        <!-- PROTECCIÓN -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Nivel protección
          </span>

          <select
            v-model.number="form.nivel_proteccion"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
          >
            <option
              v-for="value in [1, 2, 3, 4, 5]"
              :key="value"
              :value="value"
            >
              {{ value }}
            </option>
          </select>
        </label>
      </div>

      <!-- BOTONES FORMULARIO -->
      <div
        class="mt-5 flex justify-end gap-3"
      >
        <button
          type="button"
          class="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
          @click="showForm = false"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="rounded-xl bg-[#f24a23] px-4 py-2.5 font-semibold text-white transition hover:bg-[#e24016]"
          @click="submit"
        >
          Guardar
        </button>
      </div>
    </div>

    <!-- ======================================================
         LOADING
    ======================================================= -->
    <div
      v-if="predioStore.loading"
      class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <LoadingSpinner />
    </div>

    <!-- ======================================================
         ERROR
    ======================================================= -->
    <div
      v-else-if="predioStore.error"
      class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm"
    >
      {{ predioStore.error }}
    </div>

    <!-- ======================================================
         TABLA
    ======================================================= -->
    <div
      v-else
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div class="overflow-x-auto">
        <table
          class="min-w-full text-left text-sm text-slate-700"
        >
          <thead
            class="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500"
          >
            <tr>
              <th class="px-4 py-3">
                Nombre
              </th>

              <th class="px-4 py-3">
                Tipo
              </th>

              <th class="px-4 py-3">
                Dirección
              </th>

              <th class="px-4 py-3">
                Zona
              </th>

              <th class="px-4 py-3">
                Detalle
              </th>

              <th
                class="px-4 py-3 text-right"
              >
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="predio in loadedPredios"
              :key="String(predio.id_predio)"
              class="border-t border-slate-200 align-middle"
            >
              <!-- NOMBRE -->
              <td class="px-4 py-3">
                <div
                  class="flex items-center gap-3"
                >
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"
                  >
                    <MapPin class="h-4 w-4" />
                  </div>

                  <div>
                    <div
                      class="font-semibold text-slate-900"
                    >
                      {{ predio.nombre }}
                    </div>

                    <div
                      class="text-xs text-slate-500"
                    >
                      {{ predio.id_predio }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- TIPO -->
              <td class="px-4 py-3">
                {{ predio.tipo_predio }}
              </td>

              <!-- DIRECCIÓN -->
              <td class="px-4 py-3">
                {{ predio.direccion || '—' }}
              </td>

              <!-- ZONA -->
              <td class="px-4 py-3">
                {{ zoneLabel(predio.id_zona) }}
              </td>

              <!-- DETALLE -->
              <td class="px-4 py-3">
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                  @click="openDetail(predio)"
                >
                  Ver detalle
                </button>
              </td>

              <!-- ACCIONES -->
              <td class="px-4 py-3">
                <div
                  class="flex justify-end gap-2"
                >
                  <button
                    type="button"
                    class="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                    aria-label="Editar predio"
                    @click="openEditForm(predio)"
                  >
                    <Pencil
                      class="h-4 w-4"
                    />
                  </button>

                  <button
                    type="button"
                    class="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    aria-label="Eliminar predio"
                    @click="
                      handleDelete(
                        String(predio.id_predio),
                      )
                    "
                  >
                    <Trash2
                      class="h-4 w-4"
                    />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- SIN DATOS -->
      <div
        v-if="loadedPredios.length === 0"
        class="px-4 py-8 text-center text-sm text-slate-500"
      >
        No hay predios registrados.
      </div>
    </div>

    <!-- ======================================================
         MODAL DETALLE DEL PREDIO
    ======================================================= -->
    <div
      v-if="selectedPredio"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="closeDetail"
    >
      <div
        class="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <!-- CABECERA MODAL -->
        <div
          class="flex items-start justify-between border-b border-slate-200 px-6 py-5"
        >
          <div>
            <p
              class="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-500"
            >
              Detalle del predio
            </p>

            <h2
              class="mt-1 text-2xl font-bold text-slate-900"
            >
              {{ selectedPredio.nombre }}
            </h2>

            <p
              class="mt-1 text-sm text-slate-500"
            >
              ID {{ selectedPredio.id_predio }}
            </p>
          </div>

          <button
            type="button"
            class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar detalle"
            @click="closeDetail"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- CONTENIDO -->
        <div
          class="max-h-[75vh] overflow-y-auto p-6"
        >
          <!-- DATOS GENERALES -->
          <div
            class="grid gap-4 sm:grid-cols-2"
          >
            <div
              class="rounded-xl bg-slate-50 p-4"
            >
              <p
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Tipo
              </p>

              <p
                class="mt-1 font-medium text-slate-900"
              >
                {{
                  selectedPredio.tipo_predio ||
                  '—'
                }}
              </p>
            </div>

            <div
              class="rounded-xl bg-slate-50 p-4"
            >
              <p
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Zona
              </p>

              <p
                class="mt-1 font-medium text-slate-900"
              >
                {{
                  zoneLabel(
                    selectedPredio.id_zona,
                  )
                }}
              </p>
            </div>

            <div
              class="rounded-xl bg-slate-50 p-4 sm:col-span-2"
            >
              <p
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Dirección
              </p>

              <p
                class="mt-1 font-medium text-slate-900"
              >
                {{
                  selectedPredio.direccion ||
                  '—'
                }}
              </p>
            </div>

            <div
              class="rounded-xl bg-slate-50 p-4"
            >
              <p
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Fecha de evaluación
              </p>

              <p
                class="mt-1 font-medium text-slate-900"
              >
                {{
                  selectedPredio.fecha_evaluacion ||
                  '—'
                }}
              </p>
            </div>

            <div
              class="rounded-xl bg-slate-50 p-4"
            >
              <p
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Motor de detección
              </p>

              <p
                class="mt-1 font-medium text-slate-900"
              >
                {{
                  selectedPredio.id_motordet ??
                  '—'
                }}
              </p>
            </div>

            <div
              class="rounded-xl bg-slate-50 p-4"
            >
              <p
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Latitud
              </p>

              <p
                class="mt-1 font-medium text-slate-900"
              >
                {{
                  selectedPredio.latitud ??
                  '—'
                }}
              </p>
            </div>

            <div
              class="rounded-xl bg-slate-50 p-4"
            >
              <p
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Longitud
              </p>

              <p
                class="mt-1 font-medium text-slate-900"
              >
                {{
                  selectedPredio.longitud ??
                  '—'
                }}
              </p>
            </div>
          </div>

          <!-- EVALUACIÓN -->
          <div class="mt-6">
            <div class="mb-3">
              <p
                class="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-500"
              >
                Evaluación
              </p>

              <h3
                class="mt-1 text-lg font-bold text-slate-900"
              >
                Condiciones del predio
              </h3>

              <p
                class="mt-1 text-sm text-slate-500"
              >
                Valores registrados en una escala
                del 1 al 5.
              </p>
            </div>

            <div
              class="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200"
            >
              <div
                class="flex items-center justify-between px-4 py-3"
              >
                <span
                  class="text-sm text-slate-600"
                >
                  Estado eléctrico
                </span>

                <span
                  class="font-semibold text-slate-900"
                >
                  {{
                    selectedPredio.estado_electrico ??
                    '—'
                  }}
                  / 5
                </span>
              </div>

              <div
                class="flex items-center justify-between px-4 py-3"
              >
                <span
                  class="text-sm text-slate-600"
                >
                  Estado del gas
                </span>

                <span
                  class="font-semibold text-slate-900"
                >
                  {{
                    selectedPredio.estado_gas ??
                    '—'
                  }}
                  / 5
                </span>
              </div>

              <div
                class="flex items-center justify-between px-4 py-3"
              >
                <span
                  class="text-sm text-slate-600"
                >
                  Fuentes de calor
                </span>

                <span
                  class="font-semibold text-slate-900"
                >
                  {{
                    selectedPredio.fuentes_calor ??
                    '—'
                  }}
                  / 5
                </span>
              </div>

              <div
                class="flex items-center justify-between px-4 py-3"
              >
                <span
                  class="text-sm text-slate-600"
                >
                  Carga combustible
                </span>

                <span
                  class="font-semibold text-slate-900"
                >
                  {{
                    selectedPredio.carga_combustible ??
                    '—'
                  }}
                  / 5
                </span>
              </div>

              <div
                class="flex items-center justify-between px-4 py-3"
              >
                <span
                  class="text-sm text-slate-600"
                >
                  Material de construcción
                </span>

                <span
                  class="font-semibold text-slate-900"
                >
                  {{
                    selectedPredio.material_construccion ??
                    '—'
                  }}
                  / 5
                </span>
              </div>

              <div
                class="flex items-center justify-between px-4 py-3"
              >
                <span
                  class="text-sm text-slate-600"
                >
                  Ocupación
                </span>

                <span
                  class="font-semibold text-slate-900"
                >
                  {{
                    selectedPredio.ocupacion ??
                    '—'
                  }}
                  / 5
                </span>
              </div>

              <div
                class="flex items-center justify-between px-4 py-3"
              >
                <span
                  class="text-sm text-slate-600"
                >
                  Nivel de protección
                </span>

                <span
                  class="font-semibold text-slate-900"
                >
                  {{
                    selectedPredio.nivel_proteccion ??
                    '—'
                  }}
                  / 5
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- PIE DEL MODAL -->
        <div
          class="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4"
        >
          <button
            type="button"
            class="rounded-xl bg-[#f24a23] px-5 py-2.5 font-semibold text-white transition hover:bg-[#e24016]"
            @click="closeDetail"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>