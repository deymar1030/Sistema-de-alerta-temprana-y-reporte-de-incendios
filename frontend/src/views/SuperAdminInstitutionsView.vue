<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  AlertCircle, Building2, CheckCircle2, ChevronDown, MapPin, Pencil,
  Phone, Plus, RefreshCw, Search, X,
} from 'lucide-vue-next'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'
import LocationPicker from '../components/common/LocationPicker.vue'
import { useInstitutionStore } from '../stores/institution.store'
import {
  INSTITUTION_CATEGORIES,
  type InstitutionCategory,
  type InstitutionInput,
} from '../services/institution.service'
import type { Institution } from '../types'

interface InstitutionForm {
  nombre: string
  categoria: string
  direccion: string
  telefono_ins: string
  razon_social: string
  detalle: string
}

const store = useInstitutionStore()
const search = ref('')
const modalOpen = ref(false)
const showLocation = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')
const feedback = ref('')
const modalElement = ref<HTMLElement | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)
const form = reactive<InstitutionForm>({
  nombre: '', categoria: '', direccion: '', telefono_ins: '',
  razon_social: '', detalle: '',
})
const coordinates = reactive<{ latitud: number | null; longitud: number | null }>({
  latitud: null, longitud: null,
})

const filtered = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  if (!query) return store.institutions
  return store.institutions.filter((institution) =>
    [institution.nombre, institution.tipo, institution.direccion]
      .join(' ').toLocaleLowerCase().includes(query),
  )
})
const activeCount = computed(() =>
  store.institutions.filter((institution) => institution.estado === 'ACTIVA').length,
)

let previousOverflow = ''
let returnFocusElement: HTMLElement | null = null

function resetForm() {
  editingId.value = null
  form.nombre = ''
  form.categoria = ''
  form.direccion = ''
  form.telefono_ins = ''
  form.razon_social = ''
  form.detalle = ''
  coordinates.latitud = null
  coordinates.longitud = null
  showLocation.value = false
  formError.value = ''
}

function showModal() {
  returnFocusElement = document.activeElement instanceof HTMLElement
    ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  modalOpen.value = true
  void nextTick(() => nameInput.value?.focus())
}

function closeModal() {
  if (store.saving) return
  modalOpen.value = false
  document.body.style.overflow = previousOverflow
  void nextTick(() => returnFocusElement?.focus())
}

function create() {
  resetForm()
  feedback.value = ''
  showModal()
}

function edit(institution: Institution) {
  resetForm()
  feedback.value = ''
  editingId.value = institution.id
  form.nombre = institution.nombre
  form.categoria = institution.tipo === 'SIN_CATEGORIA' ? '' : institution.tipo
  form.direccion = institution.direccion === 'Sin dirección' ? '' : institution.direccion
  form.telefono_ins = institution.telefono ?? ''
  form.razon_social = institution.razonSocial ?? ''
  form.detalle = institution.detalle ?? ''
  coordinates.latitud = Number.isFinite(institution.latitud) ? institution.latitud : null
  coordinates.longitud = Number.isFinite(institution.longitud) ? institution.longitud : null
  showLocation.value = coordinates.latitud !== null && coordinates.longitud !== null
  showModal()
}

function onKeydown(event: KeyboardEvent) {
  if (!modalOpen.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    closeModal()
    return
  }
  if (event.key !== 'Tab') return
  const candidates = Array.from(modalElement.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
  ) ?? [])
  const focusable = candidates.filter((element) => element.getClientRects().length > 0)
  if (focusable.length === 0) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  void store.fetchInstitutions()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (modalOpen.value) document.body.style.overflow = previousOverflow
})

async function save() {
  formError.value = ''
  const nombre = form.nombre.trim()
  const categoria = form.categoria as InstitutionCategory
  if (!nombre) {
    formError.value = 'Ingresa el nombre de la institución.'
    return
  }
  if (!INSTITUTION_CATEGORIES.includes(categoria)) {
    formError.value = 'Elige una categoría de la lista.'
    return
  }

  const { latitud, longitud } = coordinates
  if ((latitud === null) !== (longitud === null)) {
    formError.value = 'La ubicación es opcional, pero si la agregas debes indicar latitud y longitud.'
    return
  }
  if (latitud !== null && longitud !== null && (
    !Number.isFinite(latitud) || latitud < -90 || latitud > 90 ||
    !Number.isFinite(longitud) || longitud < -180 || longitud > 180
  )) {
    formError.value = 'Las coordenadas no están dentro del rango permitido.'
    return
  }

  // Solo enviamos los campos opcionales cuando tienen valor.
  // Para una edición, dejar un campo vacío significa no modificarlo.
  const payload: InstitutionInput = { nombre, categoria }
  if (form.direccion.trim()) payload.direccion = form.direccion.trim()
  if (form.telefono_ins.trim()) payload.telefono_ins = form.telefono_ins.trim()
  if (form.razon_social.trim()) payload.razon_social = form.razon_social.trim()
  if (form.detalle.trim()) payload.detalle = form.detalle.trim()
  if (latitud !== null && longitud !== null) {
    payload.latitud = latitud
    payload.longitud = longitud
  }

  try {
    const wasEditing = editingId.value !== null
    await store.saveInstitution(payload, editingId.value ?? undefined)
    feedback.value = store.error
      ? 'La operación fue aceptada, pero falló la actualización del listado. Pulsa recargar para comprobarla.'
      : wasEditing ? 'Institución actualizada correctamente.' : 'Institución creada correctamente.'
    // No llamar closeModal(): saving puede seguir activo hasta que el store finalice.
    modalOpen.value = false
    document.body.style.overflow = previousOverflow
    void nextTick(() => returnFocusElement?.focus())
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'No se pudo guardar la institución.'
    void nextTick(() => modalElement.value?.querySelector('[role="alert"]')?.scrollIntoView({ block: 'nearest' }))
  }
}
</script>

<template>
  <div class="admin-page mx-auto max-w-[1600px] space-y-6 p-0 sm:p-2 lg:p-4">
    <header class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Gestión institucional</p>
        <h1 class="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Instituciones</h1>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Administra instituciones, información de contacto y ubicación. Los cambios se guardan en el backend.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        @click="create"
      >
        <Plus class="h-5 w-5" /> Crear institución
      </button>
    </header>

    <div v-if="feedback" role="status" class="flex min-w-0 items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0" />
      <span class="min-w-0 flex-1 break-words">{{ feedback }}</span>
      <button type="button" aria-label="Ocultar mensaje" class="min-h-11 min-w-11 shrink-0 rounded-lg" @click="feedback = ''">
        <X class="mx-auto h-4 w-4" />
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Building2 class="h-6 w-6" /></div>
        <div class="min-w-0">
          <div class="text-sm font-semibold text-slate-600">Instituciones registradas</div>
          <div class="text-2xl font-bold text-slate-900">{{ store.institutions.length }}</div>
        </div>
      </div>
      <div class="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 class="h-6 w-6" /></div>
        <div class="min-w-0">
          <div class="text-sm font-semibold text-slate-600">Instituciones activas</div>
          <div class="text-2xl font-bold text-slate-900">{{ activeCount }}</div>
        </div>
      </div>
    </div>

    <section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Listado de instituciones">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div class="min-w-0">
          <h2 class="text-lg font-bold text-slate-900">Directorio institucional</h2>
          <p class="mt-1 text-sm text-slate-500">{{ filtered.length }} resultados</p>
        </div>
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <label class="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
            <span class="sr-only">Buscar instituciones</span>
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              v-model="search" type="search" placeholder="Buscar nombre o categoría"
              class="min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </label>
          <button
            type="button" aria-label="Actualizar instituciones"
            class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            :disabled="store.loading" @click="store.fetchInstitutions()"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': store.loading }" />
          </button>
        </div>
      </div>

      <div v-if="store.loading" role="status" class="p-10 text-center text-sm text-slate-600">
        Cargando instituciones...
      </div>
      <div v-else-if="store.error" role="alert" class="m-4 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <span class="flex items-center gap-2"><AlertCircle class="h-5 w-5 shrink-0" />{{ store.error }}</span>
        <button type="button" class="min-h-11 rounded-lg bg-white px-4 py-2 font-semibold text-red-700" @click="store.fetchInstitutions()">Reintentar</button>
      </div>
      <div v-else-if="filtered.length === 0" class="px-5 py-12 text-center text-sm text-slate-600">
        {{ search ? 'No hay instituciones que coincidan con la búsqueda.' : 'Todavía no hay instituciones registradas. Puedes crear la primera.' }}
      </div>
      <div v-else class="grid min-w-0 grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="institution in filtered" :key="institution.id"
          class="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
        >
          <div class="flex min-w-0 flex-wrap items-start justify-between gap-2">
            <span class="min-w-0 break-words rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{{ institution.tipo }}</span>
            <span
              class="rounded-full px-2.5 py-1 text-xs font-bold"
              :class="institution.estado === 'ACTIVA' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'"
            >{{ institution.estado }}</span>
          </div>
          <h3 class="mt-4 min-w-0 break-words text-lg font-bold leading-snug text-slate-900">{{ institution.nombre }}</h3>
          <p class="mt-1 break-all text-xs text-slate-500">ID: {{ institution.id }}</p>
          <p class="mt-4 flex min-w-0 items-start gap-2 text-sm text-slate-700">
            <MapPin class="mt-0.5 h-4 w-4 shrink-0" />
            <span class="min-w-0 break-words">{{ institution.direccion }}</span>
          </p>
          <p class="mt-2 flex min-w-0 items-start gap-2 text-sm text-slate-700">
            <Phone class="mt-0.5 h-4 w-4 shrink-0" />
            <span class="min-w-0 break-all">{{ institution.telefono || 'Sin teléfono' }}</span>
          </p>
          <button
            type="button"
            class="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-orange-600"
            @click="edit(institution)"
          >
            <Pencil class="h-4 w-4" /> Editar institución
          </button>
        </article>
      </div>
    </section>

    <section class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Vista geográfica</p>
      <h2 class="mb-4 mt-1 text-lg font-bold text-slate-900">Ubicación de instituciones</h2>
      <MonitoringMap
        :show-sensors="false" :show-incidents="false" :show-institutions="true"
        :show-reports="false" height-class="h-[300px] sm:h-[400px]"
      />
    </section>
  </div>

  <!-- Teleport saca el modal del layout del dashboard y evita superposiciones. -->
  <Teleport to="body">
    <div
      v-if="modalOpen"
      class="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/65 p-0 sm:items-center sm:p-4"
      @click.self="closeModal"
    >
      <section
        ref="modalElement" role="dialog" aria-modal="true"
        aria-labelledby="institution-dialog-title" aria-describedby="institution-dialog-description"
        class="flex max-h-[100dvh] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
      >
        <header class="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-orange-600">Administración de instituciones</p>
            <h2 id="institution-dialog-title" class="mt-1 break-words text-xl font-extrabold text-slate-900">
              {{ editingId ? 'Editar institución' : 'Crear institución' }}
            </h2>
            <p id="institution-dialog-description" class="mt-1 text-sm text-slate-600">
              Solo el nombre y la categoría son obligatorios.
            </p>
          </div>
          <button
            type="button" aria-label="Cerrar formulario"
            class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
            :disabled="store.saving" @click="closeModal"
          >
            <X class="h-5 w-5" />
          </button>
        </header>

        <form
          id="institution-editor-form" class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
          @submit.prevent="save"
        >
          <div v-if="formError" role="alert" class="break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {{ formError }}
          </div>

          <div class="grid min-w-0 gap-4 sm:grid-cols-2">
            <label class="block min-w-0 text-sm font-semibold text-slate-700 sm:col-span-2">
              Nombre de la institución <span class="text-orange-600">*</span>
              <input
                ref="nameInput" v-model="form.nombre" type="text" autocomplete="organization"
                required maxlength="180" class="form-input mt-1.5"
                placeholder="Ej.: Cuerpo de Bomberos" :disabled="store.saving"
              />
            </label>
            <label class="block min-w-0 text-sm font-semibold text-slate-700 sm:col-span-2">
              Categoría <span class="text-orange-600">*</span>
              <select v-model="form.categoria" required class="form-input mt-1.5" :disabled="store.saving">
                <option value="" disabled>Selecciona una categoría</option>
                <option v-for="category in INSTITUTION_CATEGORIES" :key="category" :value="category">
                  {{ category.replaceAll('_', ' ') }}
                </option>
              </select>
            </label>
            <label class="block min-w-0 text-sm font-semibold text-slate-700">
              Teléfono <span class="font-normal text-slate-500">(opcional)</span>
              <input
                v-model="form.telefono_ins" type="tel" maxlength="40" class="form-input mt-1.5"
                placeholder="Número de contacto" :disabled="store.saving"
              />
            </label>
            <label class="block min-w-0 text-sm font-semibold text-slate-700">
              Dirección <span class="font-normal text-slate-500">(opcional)</span>
              <input
                v-model="form.direccion" type="text" maxlength="255" class="form-input mt-1.5"
                placeholder="Calle, zona o ciudad" :disabled="store.saving"
              />
            </label>
            <label class="block min-w-0 text-sm font-semibold text-slate-700">
              Razón social <span class="font-normal text-slate-500">(opcional)</span>
              <input
                v-model="form.razon_social" type="text" maxlength="180" class="form-input mt-1.5"
                placeholder="Nombre legal" :disabled="store.saving"
              />
            </label>
            <label class="block min-w-0 text-sm font-semibold text-slate-700">
              Detalle <span class="font-normal text-slate-500">(opcional)</span>
              <input
                v-model="form.detalle" type="text" maxlength="255" class="form-input mt-1.5"
                placeholder="Descripción breve" :disabled="store.saving"
              />
            </label>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <button
              type="button" :aria-expanded="showLocation" aria-controls="institution-location-panel"
              class="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 text-left text-sm font-semibold text-slate-800"
              :disabled="store.saving" @click="showLocation = !showLocation"
            >
              <span class="inline-flex min-w-0 items-center gap-2 break-words">
                <MapPin class="h-5 w-5 shrink-0 text-orange-600" />
                Ubicación en el mapa (opcional)
              </span>
              <ChevronDown class="h-5 w-5 shrink-0 transition-transform" :class="{ 'rotate-180': showLocation }" />
            </button>
            <div v-if="showLocation" id="institution-location-panel" class="mt-3 min-w-0">
              <LocationPicker v-model:latitud="coordinates.latitud" v-model:longitud="coordinates.longitud" />
            </div>
          </div>
          <p v-if="editingId" class="text-sm leading-relaxed text-slate-600">
            Al editar, dejar un campo opcional en blanco no elimina su valor anterior: el backend aplica actualizaciones parciales.
          </p>
        </form>

        <footer class="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            class="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
            :disabled="store.saving" @click="closeModal"
          >Cancelar</button>
          <button
            type="submit" form="institution-editor-form"
            class="min-h-11 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60"
            :disabled="store.saving"
          >
            {{ store.saving ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Crear institución') }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>