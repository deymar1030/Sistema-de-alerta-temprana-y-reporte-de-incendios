<script setup lang="ts">
import { onMounted } from 'vue'
import {
  Building2,
  MapPinned,
  Users,
} from 'lucide-vue-next'

import { useLocationStore } from '../stores/location.store'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const locationStore = useLocationStore()

onMounted(async () => {
  await locationStore.fetchLocations()
})

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
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <section>
      <p
        class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500"
      >
        Centro de Monitoreo · Cobertura
      </p>

      <h2
        class="mt-2 text-2xl font-semibold text-slate-900"
      >
        Zonas geográficas
      </h2>

      <p
        class="mt-2 max-w-3xl text-sm text-slate-600"
      >
        Zonas registradas para la organización
        territorial del sistema de prevención
        y monitoreo de incendios.
      </p>
    </section>

    <!-- Cargando -->
    <section
      v-if="locationStore.loading"
      class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <LoadingSpinner />
    </section>

    <!-- Error -->
    <section
      v-else-if="locationStore.error"
      class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
    >
      {{ locationStore.error }}
    </section>

    <!-- Sin datos -->
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
    </section>

    <!-- Zonas -->
    <section
      v-else
      class="grid gap-4 xl:grid-cols-2"
    >
      <article
        v-for="location in locationStore.locations"
        :key="location.id_zona"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <!-- Cabecera -->
        <div
          class="flex items-start justify-between gap-4"
        >
          <div>
            <p
              class="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400"
            >
              {{
                location.departamento
              }}
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

        <!-- Información -->
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
              <Users
                class="h-4 w-4"
              />

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

        <!-- Descripción -->
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
      </article>
    </section>
  </div>
</template>