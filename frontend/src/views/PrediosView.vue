
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  AlertCircle, Building2, CheckCircle2, ChevronDown,
  Eye, MapPin, Pencil, Plus, RefreshCw, Search, Trash2, X,
} from 'lucide-vue-next'
import LocationPicker from '../components/common/LocationPicker.vue'
import { usePredioStore } from '../stores/predio.store'
import { locationService, type GeographicZone } from '../services/location.service'
import { predioService, type CreatePredioInput, type PredioDetail } from '../services/predio.service'

type ScoreKey =
  | 'estado_electrico' | 'estado_gas' | 'fuentes_calor'
  | 'carga_combustible' | 'material_construccion'
  | 'ocupacion' | 'nivel_proteccion'

type PredioForm = {
  id_zona: string
  nombre: string
  tipo_predio: string
  direccion: string
  fecha_evaluacion: string
  contrasena_mqtt: string
  latitud: number | null
  longitud: number | null
} & Record<ScoreKey, string>

const tiposPredio = [
  'VIVIENDA', 'CASA', 'DEPARTAMENTO', 'EDIFICIO', 'GARAJE',
  'ESTACIONAMIENTO', 'TALLER', 'ALMACEN', 'DEPOSITO', 'BODEGA',
  'MERCADO', 'TIENDA', 'LOCAL_COMERCIAL', 'OFICINA', 'RESTAURANTE',
  'HOTEL', 'HOSPITAL', 'CENTRO_DE_SALUD', 'ESCUELA', 'UNIVERSIDAD',
  'FABRICA', 'GALPON', 'OTRO',
]

const scoreFields: Array<{ key: ScoreKey; label: string }> = [
  { key: 'estado_electrico', label: 'Estado eléctrico' },
  { key: 'estado_gas', label: 'Estado del gas' },
  { key: 'fuentes_calor', label: 'Fuentes de calor' },
  { key: 'carga_combustible', label: 'Carga combustible' },
  { key: 'material_construccion', label: 'Material de construcción' },
  { key: 'ocupacion', label: 'Ocupación' },
  { key: 'nivel_proteccion', label: 'Nivel de protección' },
]

function emptyForm(): PredioForm {
  return {
    id_zona: '', nombre: '', tipo_predio: 'VIVIENDA', direccion: '',
    fecha_evaluacion: '', contrasena_mqtt: '', latitud: null, longitud: null,
    estado_electrico: '', estado_gas: '', fuentes_calor: '',
    carga_combustible: '', material_construccion: '', ocupacion: '',
    nivel_proteccion: '',
  }
}

const store = usePredioStore()
const form = reactive<PredioForm>(emptyForm())
const zones = ref<GeographicZone[]>([])
const zonesError = ref('')
const loadingZones = ref(false)
const search = ref('')
const formOpen = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const originalDetail = ref<PredioDetail | null>(null)
const formError = ref('')
const pageMessage = ref('')
const pageError = ref(false)
const showMap = ref(false)
const showScores = ref(false)
const selected = ref<PredioDetail | null>(null)
const loadingDetail = ref(false)
const formDialog = ref<HTMLElement | null>(null)
const detailDialog = ref<HTMLElement | null>(null)
const firstInput = ref<HTMLInputElement | null>(null)
let savedOverflow = ''
let priorFocus: HTMLElement | null = null

function zoneName(id: string): string {
  const match = zones.value.find(zone => String(zone.id_zona) === String(id))
  return match?.nombre || (id ? `Zona #${id}` : 'Sin zona')
}

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return store.prediosDetail
  return store.prediosDetail.filter(item => [
    item.nombre, item.tipo_predio, item.direccion,
    item.id_predio, zoneName(item.id_zona),
  ].some(part => String(part ?? '').toLowerCase().includes(query)))
})

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

function showValue(value: unknown): string {
  return value === null || value === undefined || value === '' ? 'Sin dato' : String(value)
}

function openOverlay() {
  priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  savedOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function closeOverlay() {
  document.body.style.overflow = savedOverflow
  void nextTick(() => priorFocus?.focus())
}

function resetForm() {
  Object.assign(form, emptyForm())
  editingId.value = null
  originalDetail.value = null
  formError.value = ''
  showMap.value = false
  showScores.value = false
}

function openCreateForm() {
  resetForm()
  pageMessage.value = ''
  pageError.value = false
  void loadZones()
  openOverlay()
  formOpen.value = true
  void nextTick(() => firstInput.value?.focus())
}

async function openEditForm(id: string) {
  pageMessage.value = ''
  loadingDetail.value = true

  try {
    const detail = await predioService.getPredioById(id)
    resetForm()
    originalDetail.value = detail
    editingId.value = detail.id_predio
    form.id_zona = detail.id_zona
    form.nombre = detail.nombre
    form.tipo_predio = detail.tipo_predio
    form.direccion = detail.direccion
    form.fecha_evaluacion = detail.fecha_evaluacion?.slice(0, 10) || ''
    form.latitud = detail.latitud
    form.longitud = detail.longitud
    form.contrasena_mqtt = ''

    for (const field of scoreFields) {
      form[field.key] = detail[field.key] === null ? '' : String(detail[field.key])
    }

    showMap.value = detail.latitud !== null && detail.longitud !== null
    showScores.value = scoreFields.some(field => detail[field.key] !== null)

    void loadZones()
    openOverlay()
    formOpen.value = true
    void nextTick(() => firstInput.value?.focus())
  } catch (error) {
    pageMessage.value = errorText(error)
    pageError.value = true
  } finally {
    loadingDetail.value = false
  }
}

async function openDetail(id: string) {
  pageMessage.value = ''
  loadingDetail.value = true

  try {
    selected.value = await predioService.getPredioById(id)
    openOverlay()
  } catch (error) {
    pageMessage.value = errorText(error)
    pageError.value = true
  } finally {
    loadingDetail.value = false
  }
}

function closeForm() {
  if (saving.value) return
  formOpen.value = false
  closeOverlay()
}

function closeDetail() {
  selected.value = null
  closeOverlay()
}

function validId(value: unknown): number {
  const text = String(value ?? '').trim()
  const number = Number(text)

  if (!/^\d+$/.test(text) || !Number.isSafeInteger(number) || number < 1) {
    throw new Error('Selecciona una zona geográfica válida.')
  }

  return number
}

function makePayload(): CreatePredioInput {
  const name = form.nombre.trim()

  if (!name) {
    throw new Error('Debes escribir el nombre del predio.')
  }

  if (!zones.value.some(zone => String(zone.id_zona) === String(form.id_zona))) {
    throw new Error('Selecciona una zona existente de la lista.')
  }

  // El backend gestiona el motor de detección.
  const payload = { id_zona: validId(form.id_zona), nombre: name } as CreatePredioInput

  const type = form.tipo_predio.trim()
  const address = form.direccion.trim()
  const date = form.fecha_evaluacion.trim()

  if (originalDetail.value) {
    const old = originalDetail.value

    if (!type && old.tipo_predio) {
      throw new Error('No se ha confirmado cómo borrar el tipo de predio.')
    }

    if (!address && old.direccion) {
      throw new Error('No se ha confirmado cómo borrar la dirección guardada.')
    }

    if (!date && old.fecha_evaluacion) {
      throw new Error('No se ha confirmado cómo borrar la fecha de evaluación.')
    }
  }

  if (type) payload.tipo_predio = type
  if (address) payload.direccion = address
  if (date) payload.fecha_evaluacion = date

  if (form.contrasena_mqtt.trim()) {
    payload.contrasena_mqtt = form.contrasena_mqtt.trim()
  }

  const { latitud, longitud } = form

  if ((latitud === null) !== (longitud === null)) {
    throw new Error('Debes indicar latitud y longitud juntas.')
  }

  if (originalDetail.value?.latitud != null && latitud === null) {
    throw new Error('Para modificar la ubicación, selecciona otro punto.')
  }

  if (latitud !== null && longitud !== null) {
    if (
      !Number.isFinite(latitud) || latitud < -90 || latitud > 90 ||
      !Number.isFinite(longitud) || longitud < -180 || longitud > 180
    ) {
      throw new Error('Las coordenadas están fuera del rango permitido.')
    }

    payload.latitud = latitud
    payload.longitud = longitud
  }

  for (const field of scoreFields) {
    const raw = String(form[field.key] ?? '').trim()

    if (!raw) {
      if (originalDetail.value?.[field.key] != null) {
        throw new Error(`No se ha confirmado cómo quitar el valor de ${field.label}.`)
      }
      continue
    }

    const number = Number(raw)

    if (!Number.isFinite(number)) {
      throw new Error(`Revisa el valor de ${field.label}.`)
    }

    payload[field.key] = number
  }

  return payload
}

async function save() {
  if (saving.value) return

  formError.value = ''
  let payload: CreatePredioInput

  try {
    payload = makePayload()
  } catch (error) {
    formError.value = errorText(error)
    return
  }

  saving.value = true

  try {
    const updating = editingId.value !== null

    if (updating) {
      await store.updatePredio(editingId.value!, payload)
    } else {
      await store.createPredio(payload)
    }

    formOpen.value = false
    closeOverlay()
    await store.fetchPredios()

    pageError.value = Boolean(store.error)
    pageMessage.value = store.error
      ? 'El servidor guardó el predio, pero no se pudo actualizar el listado. Pulsa Actualizar.'
      : updating ? 'Predio actualizado correctamente.' : 'Predio creado correctamente.'
  } catch (error) {
    formError.value = errorText(error)
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  if (!window.confirm('¿Eliminar este predio? Esta acción puede ser irreversible.')) return

  try {
    await store.deletePredio(id)
    await store.fetchPredios()

    pageError.value = Boolean(store.error)
    pageMessage.value = store.error
      ? 'Se eliminó el predio, pero no se pudo recargar el listado.'
      : 'Predio eliminado correctamente.'
  } catch (error) {
    pageMessage.value = errorText(error)
    pageError.value = true
  }
}

async function loadZones() {
  loadingZones.value = true
  zonesError.value = ''

  try {
    zones.value = await locationService.getLocations()
  } catch (error) {
    zones.value = []
    zonesError.value = errorText(error)
  } finally {
    loadingZones.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  const active = formOpen.value ? formDialog.value : selected.value ? detailDialog.value : null
  if (!active) return

  if (event.key === 'Escape') {
    event.preventDefault()
    if (formOpen.value) closeForm()
    else closeDetail()
    return
  }

  if (event.key !== 'Tab') return

  const items = Array.from(active.querySelectorAll<HTMLElement>(
    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]'
  )).filter(element => element.getClientRects().length > 0)

  if (!items.length) return

  if (event.shiftKey && document.activeElement === items[0]) {
    event.preventDefault()
    items[items.length - 1]?.focus()
  } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
    event.preventDefault()
    items[0]?.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  void store.fetchPredios()
  void loadZones()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (formOpen.value || selected.value) {
    document.body.style.overflow = savedOverflow
  }
})
</script>

<template>
  <main class="admin-page mx-auto w-full max-w-[1500px] space-y-5 p-0 sm:p-2 lg:p-4">
    <header class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-widest text-orange-600">Administración</p>
        <h1 class="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Predios</h1>
        <p class="mt-2 max-w-2xl text-sm text-slate-600">
          Registra y administra los predios. El motor de detección es gestionado por el backend.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700"
        @click="openCreateForm"
      >
        <Plus class="h-5 w-5" aria-hidden="true" />
        Crear predio
      </button>
    </header>

    <div
      v-if="pageMessage"
      role="status"
      class="flex items-center gap-3 rounded-xl border p-4 text-sm"
      :class="pageError ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'"
    >
      <AlertCircle v-if="pageError" class="h-5 w-5 shrink-0" aria-hidden="true" />
      <CheckCircle2 v-else class="h-5 w-5 shrink-0" aria-hidden="true" />
      <span class="min-w-0 flex-1 break-words">{{ pageMessage }}</span>
      <button
        type="button"
        aria-label="Ocultar mensaje"
        class="min-h-11 min-w-11 rounded-lg"
        @click="pageMessage = ''"
      >
        <X class="mx-auto h-4 w-4" />
      </button>
    </div>

    <section
      aria-label="Directorio de predios"
      class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div class="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 class="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Building2 class="h-5 w-5 text-orange-600" aria-hidden="true" />
            Directorio
          </h2>
          <p class="mt-1 text-sm text-slate-600">
            {{ store.prediosDetail.length }} predios
          </p>
        </div>

        <div class="flex min-w-0 flex-wrap gap-2">
          <label class="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
            <span class="sr-only">Buscar predios</span>
            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              v-model="search"
              type="search"
              placeholder="Buscar predio, zona o tipo"
              class="form-input pl-10"
            />
          </label>

          <button
            type="button"
            class="min-h-11 min-w-11 rounded-xl border border-slate-200 text-slate-700"
            aria-label="Actualizar predios"
            :disabled="store.loading"
            @click="store.fetchPredios()"
          >
            <RefreshCw
              class="mx-auto h-4 w-4"
              :class="{ 'animate-spin': store.loading }"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div
        v-if="store.loading"
        role="status"
        class="p-10 text-center text-sm text-slate-600"
      >
        Cargando predios...
      </div>

      <div
        v-else-if="store.error"
        role="alert"
        class="m-4 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      >
        <p class="break-words">{{ store.error }}</p>
        <button
          type="button"
          class="mt-3 min-h-11 rounded-xl border border-red-300 bg-white px-4 font-semibold"
          @click="store.fetchPredios()"
        >
          Reintentar
        </button>
      </div>

      <div
        v-else-if="filtered.length === 0"
        class="p-10 text-center text-sm text-slate-600"
      >
        {{ search ? 'No se encontraron coincidencias.' : 'Aún no hay predios registrados.' }}
      </div>

      <template v-else>
        <div class="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:hidden">
          <article
            v-for="item in filtered"
            :key="item.id_predio"
            class="min-w-0 space-y-3 rounded-xl border border-slate-200 p-4"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="break-words font-bold text-slate-900">
                  {{ item.nombre || `Predio #${item.id_predio}` }}
                </h3>
                <p class="break-words text-sm text-slate-600">
                  {{ item.tipo_predio || 'Sin tipo' }}
                </p>
              </div>
              <span class="shrink-0 rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-700">
                #{{ item.id_predio }}
              </span>
            </div>

            <p class="break-words text-sm text-slate-700">
              {{ item.direccion || 'Sin dirección' }}
            </p>
            <p class="break-words text-sm text-slate-600">
              {{ zoneName(item.id_zona) }}
            </p>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="min-h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-700"
                @click="openDetail(item.id_predio)"
              >
                Ver
              </button>
              <button
                type="button"
                class="min-h-11 rounded-lg border border-slate-200 px-3 text-sm text-orange-700"
                @click="openEditForm(item.id_predio)"
              >
                Editar
              </button>
              <button
                type="button"
                class="min-h-11 rounded-lg border border-red-200 px-3 text-sm text-red-700"
                @click="remove(item.id_predio)"
              >
                Eliminar
              </button>
            </div>
          </article>
        </div>

        <div class="hidden overflow-x-auto lg:block">
          <table class="w-full min-w-[760px] text-left text-sm text-slate-700">
            <thead class="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th scope="col" class="px-4 py-3">Nombre</th>
                <th scope="col" class="px-4 py-3">Tipo</th>
                <th scope="col" class="px-4 py-3">Dirección</th>
                <th scope="col" class="px-4 py-3">Zona</th>
                <th scope="col" class="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in filtered"
                :key="item.id_predio"
                class="border-t border-slate-100 hover:bg-slate-50"
              >
                <td class="max-w-56 break-words px-4 py-4 font-semibold text-slate-900">
                  {{ item.nombre || `Predio #${item.id_predio}` }}
                </td>
                <td class="max-w-40 break-words px-4 py-4">
                  {{ item.tipo_predio || 'Sin tipo' }}
                </td>
                <td class="max-w-56 break-words px-4 py-4">
                  {{ item.direccion || 'Sin dirección' }}
                </td>
                <td class="max-w-40 break-words px-4 py-4">
                  {{ zoneName(item.id_zona) }}
                </td>
                <td class="px-4 py-4">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="min-h-11 min-w-11 rounded-xl border border-slate-200 text-slate-700"
                      aria-label="Ver detalle"
                      title="Ver detalle"
                      @click="openDetail(item.id_predio)"
                    >
                      <Eye class="mx-auto h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="min-h-11 min-w-11 rounded-xl border border-slate-200 text-orange-700"
                      aria-label="Editar predio"
                      title="Editar predio"
                      @click="openEditForm(item.id_predio)"
                    >
                      <Pencil class="mx-auto h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="min-h-11 min-w-11 rounded-xl border border-red-200 text-red-700"
                      aria-label="Eliminar predio"
                      title="Eliminar predio"
                      @click="remove(item.id_predio)"
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

    <p
      v-if="loadingDetail"
      role="status"
      class="text-sm text-slate-600"
    >
      Consultando detalle...
    </p>

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
          aria-labelledby="predio-form-title"
          class="flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]"
        >
          <header class="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-widest text-orange-600">
                Predios
              </p>
              <h2
                id="predio-form-title"
                class="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl"
              >
                {{ editingId ? 'Editar predio' : 'Crear predio' }}
              </h2>
              <p class="mt-1 text-sm text-slate-600">
                La zona es obligatoria. El backend gestiona el motor de detección.
              </p>
            </div>

            <button
              type="button"
              class="min-h-11 min-w-11 shrink-0 rounded-xl border border-slate-200 text-slate-700"
              aria-label="Cerrar formulario"
              :disabled="saving"
              @click="closeForm"
            >
              <X class="mx-auto h-5 w-5" />
            </button>
          </header>

          <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="save">
            <div class="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
              <div
                v-if="formError"
                role="alert"
                class="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {{ formError }}
              </div>

              <div
                v-if="zonesError"
                role="alert"
                class="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              >
                <p class="break-words">
                  No se pudieron cargar las zonas: {{ zonesError }}
                </p>
                <button
                  type="button"
                  class="min-h-11 rounded-xl border border-amber-300 bg-white px-4 font-semibold"
                  :disabled="loadingZones"
                  @click="loadZones"
                >
                  Reintentar
                </button>
              </div>

              <div class="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                <div class="min-w-0">
                  <label
                    for="predio-zona"
                    class="mb-1 block text-sm font-semibold text-slate-700"
                  >
                    Zona geográfica <span class="text-orange-600">*</span>
                  </label>

                  <select
                    id="predio-zona"
                    v-model="form.id_zona"
                    required
                    class="form-input"
                    :disabled="loadingZones || !!zonesError || zones.length === 0"
                  >
                    <option value="" disabled>
                      {{ loadingZones ? 'Cargando zonas...' : 'Selecciona una zona' }}
                    </option>
                    <option
                      v-for="zone in zones"
                      :key="zone.id_zona"
                      :value="String(zone.id_zona)"
                    >
                      {{ zone.nombre }}
                    </option>
                  </select>

                  <p
                    v-if="!loadingZones && !zonesError && zones.length === 0"
                    class="mt-1 text-sm text-amber-800"
                  >
                    No hay zonas registradas. Primero crea una en el módulo Zonas.
                  </p>
                </div>

                <label class="min-w-0 text-sm font-semibold text-slate-700">
                  Nombre del predio <span class="text-orange-600">*</span>
                  <input
                    ref="firstInput"
                    v-model="form.nombre"
                    type="text"
                    required
                    maxlength="200"
                    placeholder="Ej. Mercado Rodríguez"
                    class="form-input mt-1 font-normal"
                  />
                </label>

                <label class="min-w-0 text-sm font-semibold text-slate-700">
                  Tipo de predio
                  <input
                    v-model="form.tipo_predio"
                    type="text"
                    list="tipos-predio"
                    maxlength="100"
                    autocomplete="off"
                    placeholder="Elige o escribe otro tipo"
                    class="form-input mt-1 font-normal"
                  />
                  <datalist id="tipos-predio">
                    <option
                      v-for="tipo in tiposPredio"
                      :key="tipo"
                      :value="tipo"
                    />
                  </datalist>
                  <span class="mt-1 block text-xs font-normal text-slate-500">
                    Puedes escribir un tipo personalizado.
                  </span>
                </label>

                <label class="min-w-0 text-sm font-semibold text-slate-700">
                  Fecha de evaluación
                  <input
                    v-model="form.fecha_evaluacion"
                    type="date"
                    class="form-input mt-1 font-normal"
                  />
                </label>

                <label class="min-w-0 text-sm font-semibold text-slate-700 md:col-span-2">
                  Dirección
                  <input
                    v-model="form.direccion"
                    type="text"
                    maxlength="255"
                    placeholder="Calle, número y zona"
                    class="form-input mt-1 font-normal"
                  />
                </label>

                <label class="min-w-0 text-sm font-semibold text-slate-700 md:col-span-2">
                  {{ editingId ? 'Nueva contraseña MQTT (opcional)' : 'Contraseña MQTT (si aplica)' }}
                  <input
                    v-model="form.contrasena_mqtt"
                    type="password"
                    autocomplete="new-password"
                    placeholder="No se mostrará la contraseña guardada"
                    class="form-input mt-1 font-normal"
                  />
                </label>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                <button
                  type="button"
                  class="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-bold text-slate-800"
                  :aria-expanded="showMap"
                  @click="showMap = !showMap"
                >
                  <span class="flex items-center gap-2">
                    <MapPin class="h-5 w-5 text-orange-600" aria-hidden="true" />
                    Ubicación en el mapa
                  </span>
                  <ChevronDown
                    class="h-4 w-4 shrink-0"
                    :class="{ 'rotate-180': showMap }"
                  />
                </button>

                <p class="mb-2 text-sm text-slate-600">
                  La ubicación es opcional. El centro del mapa no se guarda hasta que selecciones un punto.
                </p>

                <LocationPicker
                  v-if="showMap"
                  v-model:latitud="form.latitud"
                  v-model:longitud="form.longitud"
                />

                <p
                  v-else-if="form.latitud !== null && form.longitud !== null"
                  class="break-words text-sm text-emerald-700"
                >
                  Ubicación seleccionada: {{ form.latitud }}, {{ form.longitud }}
                </p>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                <button
                  type="button"
                  class="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-bold text-slate-800"
                  :aria-expanded="showScores"
                  @click="showScores = !showScores"
                >
                  <span>Condiciones y evaluación</span>
                  <ChevronDown
                    class="h-4 w-4 shrink-0"
                    :class="{ 'rotate-180': showScores }"
                  />
                </button>

                <p class="mb-2 text-sm text-slate-600">
                  Campos opcionales; deja en blanco si no fueron evaluados. El valor 0 es válido.
                </p>

                <div
                  v-if="showScores"
                  class="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  <label
                    v-for="field in scoreFields"
                    :key="field.key"
                    class="min-w-0 text-sm font-semibold text-slate-700"
                  >
                    {{ field.label }}
                    <input
                      v-model="form[field.key]"
                      type="number"
                      step="any"
                      inputmode="decimal"
                      placeholder="Sin evaluar"
                      class="form-input mt-1 font-normal"
                    />
                  </label>
                </div>
              </div>
            </div>

            <footer class="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
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
                :disabled="saving || loadingZones || !!zonesError || zones.length === 0"
              >
                {{ saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear predio' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="selected"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/65 p-2 sm:p-5"
        @click.self="closeDetail"
      >
        <div
          ref="detailDialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="predio-detail-title"
          class="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <header class="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-widest text-orange-600">
                Detalle del predio
              </p>
              <h2
                id="predio-detail-title"
                class="mt-1 break-words text-xl font-extrabold text-slate-900"
              >
                {{ selected.nombre || `Predio #${selected.id_predio}` }}
              </h2>
            </div>
            <button
              type="button"
              class="min-h-11 min-w-11 shrink-0 rounded-xl border border-slate-200"
              aria-label="Cerrar detalle"
              @click="closeDetail"
            >
              <X class="mx-auto h-5 w-5" />
            </button>
          </header>

          <div class="min-h-0 space-y-4 overflow-y-auto p-4 text-sm sm:p-5">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                v-for="entry in [
                  { label: 'ID', value: selected.id_predio },
                  { label: 'Tipo', value: selected.tipo_predio },
                  { label: 'Zona', value: zoneName(selected.id_zona) },
                  { label: 'Motor interno', value: selected.id_motordet },
                  { label: 'Dirección', value: selected.direccion },
                  { label: 'Fecha de evaluación', value: selected.fecha_evaluacion },
                  { label: 'Latitud', value: selected.latitud },
                  { label: 'Longitud', value: selected.longitud },
                  { label: 'IRP del backend', value: selected.irp },
                  { label: 'Sensores vinculados', value: selected.sensores.length },
                ]"
                :key="entry.label"
                class="min-w-0 rounded-xl bg-slate-50 p-3"
              >
                <p class="text-xs font-bold uppercase text-slate-600">
                  {{ entry.label }}
                </p>
                <p class="mt-1 break-words font-semibold text-slate-900">
                  {{ showValue(entry.value) }}
                </p>
              </div>
            </div>

            <h3 class="font-bold text-slate-900">Evaluación</h3>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                v-for="field in scoreFields"
                :key="field.key"
                class="rounded-xl border border-slate-200 p-3"
              >
                <p class="text-sm text-slate-600">{{ field.label }}</p>
                <p class="mt-1 font-bold text-slate-900">
                  {{ showValue(selected[field.key]) }}
                </p>
              </div>
            </div>
          </div>

          <footer class="shrink-0 border-t border-slate-200 bg-slate-50 p-4 text-right">
            <button
              type="button"
              class="min-h-11 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white"
              @click="closeDetail"
            >
              Cerrar
            </button>
          </footer>
        </div>
      </div>
    </Teleport>
  </main>
</template>
