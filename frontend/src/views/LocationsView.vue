<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  Building2,
  MapPinned,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-vue-next'

import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import { useToast } from '../composables/useToast'
import type { GeographicZone } from '../services/location.service'
import { useLocationStore } from '../stores/location.store'

const locationStore = useLocationStore()
const { showToast } = useToast()

type ZoneForm = {
  nombre: string
  departamento: string
  municipio: string
  descripcion: string
  densidad_poblacional: string | number
  estado: boolean
}

const showForm = ref(false)
const editingId = ref<string | null>(null)

const createEmptyForm = (): ZoneForm => ({
  nombre: '',
  departamento: '',
  municipio: '',
  descripcion: '',
  densidad_poblacional: '',
  estado: true,
})

const form = ref<ZoneForm>(createEmptyForm())

const resetForm = () => {
  form.value = createEmptyForm()
  editingId.value = null
}

const openCreateForm = () => {
  resetForm()
  showForm.value = true
}

const openEditForm = (
  location: GeographicZone,
) => {
  editingId.value = location.id_zona

  form.value = {
    nombre: location.nombre,
    departamento: location.departamento,
    municipio: location.municipio,
    descripcion: location.descripcion ?? '',
    densidad_poblacional:
      location.densidad_poblacional,
    estado: location.estado,
  }

  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  resetForm()
}

const validateForm = () => {
  if (!form.value.nombre.trim()) {
    throw new Error(
      'Debe ingresar el nombre de la zona.',
    )
  }

  if (!form.value.departamento.trim()) {
    throw new Error(
      'Debe ingresar el departamento.',
    )
  }

  if (!form.value.municipio.trim()) {
    throw new Error(
      'Debe ingresar el municipio.',
    )
  }

  const density = Number(
    form.value.densidad_poblacional,
  )

  if (
    !Number.isFinite(density) ||
    density < 0
  ) {
    throw new Error(
      'La densidad poblacional debe ser un número válido.',
    )
  }
}

const submit = async () => {
  try {
    validateForm()

    const payload = {
      nombre: form.value.nombre.trim(),
      departamento:
        form.value.departamento.trim(),
      municipio: form.value.municipio.trim(),
      descripcion:
        form.value.descripcion.trim(),
      densidad_poblacional: Number(
        form.value.densidad_poblacional,
      ),
    }

    if (editingId.value) {
      await locationStore.updateLocation(
        editingId.value,
        {
          ...payload,
          estado: form.value.estado,
        },
      )

      showToast({
        type: 'success',
        title: 'Zona actualizada',
        description:
          'Los cambios se guardaron correctamente.',
      })
    } else {
      await locationStore.createLocation(
        payload,
      )

      showToast({
        type: 'success',
        title: 'Zona creada',
        description:
          'La zona geográfica fue registrada correctamente.',
      })
    }

    closeForm()
  } catch (error) {
    showToast({
      type: 'error',
      title: 'No se pudo guardar la zona',
      description:
        error instanceof Error
          ? error.message
          : 'Revisa los datos e intenta nuevamente.',
    })
  }
}

const handleDelete = async (
  location: GeographicZone,
) => {
  const confirmed = window.confirm(
    `¿Deseas desactivar la zona "${location.nombre}"?`,
  )

  if (!confirmed) {
    return
  }

  try {
    await locationStore.deleteLocation(
      location.id_zona,
    )

    showToast({
      type: 'info',
      title: 'Zona desactivada',
      description:
        'La zona fue desactivada correctamente.',
})
  } catch (error) {
    showToast({
      type: 'error',
      title: 'No se pudo eliminar la zona',
      description:
        error instanceof Error
          ? error.message
          : 'La eliminación falló.',
    })
  }
}

const densityLabel = (
  density: number,
) => {
  if (density >= 100) {
    return 'Alta'
  }

  if (density >= 60) {
    return 'Media'
  }

  return 'Baja'
}

const densityTone = (
  density: number,
) => {
  if (density >= 100) {
    return 'border-orange-200 bg-orange-50 text-orange-700'
  }

  if (density >= 60) {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

onMounted(async () => {
  await locationStore.fetchLocations()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- CABECERA -->
    <section
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500"
        >
          Administración
        </p>

        <h2
          class="mt-2 text-3xl font-bold text-slate-900"
        >
          Zonas geográficas
        </h2>

        <p
          class="mt-2 max-w-3xl text-sm text-slate-600"
        >
          Administración de las zonas
          geográficas utilizadas por los
          predios del sistema.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-[#f24a23] px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#e24016]"
        @click="openCreateForm"
      >
        <Plus class="h-4 w-4" />
        Crear zona
      </button>
    </section>

    <!-- FORMULARIO -->
    <section
      v-if="showForm"
      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div
        class="mb-5 flex items-center justify-between"
      >
        <div>
          <p
            class="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-500"
          >
            Zona geográfica
          </p>

          <h3
            class="mt-1 text-xl font-bold text-slate-900"
          >
            {{
              editingId
                ? 'Editar zona'
                : 'Crear zona'
            }}
          </h3>
        </div>

        <button
          type="button"
          class="text-sm font-medium text-slate-500 hover:text-slate-700"
          @click="closeForm"
        >
          Cerrar
        </button>
      </div>

      <div
        class="grid gap-4 md:grid-cols-2"
      >
        <!-- NOMBRE -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Nombre
          </span>

          <input
            v-model="form.nombre"
            type="text"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
            placeholder="Ej: La Paz Centro"
          />
        </label>

        <!-- DEPARTAMENTO -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Departamento
          </span>

          <input
            v-model="form.departamento"
            type="text"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
            placeholder="Ej: La Paz"
          />
        </label>

        <!-- MUNICIPIO -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Municipio
          </span>

          <input
            v-model="form.municipio"
            type="text"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
            placeholder="Ej: La Paz"
          />
        </label>

        <!-- DENSIDAD -->
        <label class="block">
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Densidad poblacional
          </span>

          <input
            v-model.number="
              form.densidad_poblacional
            "
            type="number"
            min="0"
            step="0.1"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
            placeholder="Ej: 120.5"
          />
        </label>

        <!-- DESCRIPCIÓN -->
        <label
          class="block md:col-span-2"
        >
          <span
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Descripción
          </span>

          <textarea
            v-model="form.descripcion"
            rows="3"
            class="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-300"
            placeholder="Descripción de la zona"
          ></textarea>
        </label>

        <!-- ESTADO SOLO AL EDITAR -->
        <label
          v-if="editingId"
          class="flex items-center gap-3 md:col-span-2"
        >
          <input
            v-model="form.estado"
            type="checkbox"
            class="h-4 w-4 accent-orange-500"
          />

          <span
            class="text-sm font-medium text-slate-700"
          >
            Zona activa
          </span>
        </label>
      </div>

      <div
        class="mt-5 flex justify-end gap-3"
      >
        <button
          type="button"
          class="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
          @click="closeForm"
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
    </section>

    <!-- CARGANDO -->
    <section
      v-if="locationStore.loading"
      class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <LoadingSpinner />
    </section>

    <!-- ERROR -->
    <section
      v-else-if="locationStore.error"
      class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
    >
      {{ locationStore.error }}
    </section>

    <!-- SIN DATOS -->
    <section
      v-else-if="
        locationStore.locations.length === 0
      "
      class="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"
    >
      <MapPinned
        class="mx-auto h-8 w-8 text-slate-300"
      />

      <p
        class="mt-3 text-sm font-medium text-slate-700"
      >
        No hay zonas geográficas registradas.
      </p>

      <button
        type="button"
        class="mt-4 rounded-xl bg-[#f24a23] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e24016]"
        @click="openCreateForm"
      >
        Crear primera zona
      </button>
    </section>

    <!-- LISTADO -->
    <section
      v-else
      class="grid gap-4 xl:grid-cols-2"
    >
      <article
        v-for="location in locationStore.locations"
        :key="location.id_zona"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <!-- CABECERA -->
        <div
          class="flex items-start justify-between gap-4"
        >
          <div>
            <p
              class="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400"
            >
              {{ location.departamento }}
              · Zona #{{ location.id_zona }}
            </p>

            <h3
              class="mt-2 text-lg font-semibold text-slate-900"
            >
              {{ location.nombre }}
            </h3>
          </div>

          <span
            :class="[
              'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]',
              location.estado
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-100 text-slate-500',
            ]"
          >
            {{
              location.estado
                ? 'Activa'
                : 'Inactiva'
            }}
          </span>
        </div>

        <!-- INFORMACIÓN -->
        <div
          class="mt-5 grid gap-3 sm:grid-cols-2"
        >
          <div
            class="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <div
              class="flex items-center gap-2 text-xs font-medium text-slate-500"
            >
              <Building2
                class="h-4 w-4"
              />
              Municipio
            </div>

            <p
              class="mt-2 text-sm font-semibold text-slate-900"
            >
              {{ location.municipio }}
            </p>
          </div>

          <div
            class="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <div
              class="flex items-center gap-2 text-xs font-medium text-slate-500"
            >
              <Users class="h-4 w-4" />
              Densidad poblacional
            </div>

            <div
              class="mt-2 flex items-center justify-between gap-3"
            >
              <p
                class="text-sm font-semibold text-slate-900"
              >
                {{
                  location.densidad_poblacional
                }}
              </p>

              <span
                :class="[
                  'rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]',
                  densityTone(
                    location.densidad_poblacional,
                  ),
                ]"
              >
                {{
                  densityLabel(
                    location.densidad_poblacional,
                  )
                }}
              </span>
            </div>
          </div>
        </div>

        <!-- DESCRIPCIÓN -->
        <div
          class="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
        >
          <p
            class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"
          >
            Descripción
          </p>

          <p
            class="mt-2 text-sm leading-6 text-slate-600"
          >
            {{
              location.descripcion ||
              'Sin descripción registrada.'
            }}
          </p>
        </div>

        <!-- ACCIONES -->
        <div
          class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4"
        >
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
            @click="openEditForm(location)"
          >
            <Pencil class="h-4 w-4" />
            Editar
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            @click="handleDelete(location)"
          >
            <Trash2 class="h-4 w-4" />
            Eliminar
          </button>
        </div>
      </article>
    </section>
  </div>
</template>