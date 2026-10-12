<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Building2,
  MapPin,
  Phone,
  Search,
} from 'lucide-vue-next'

import StatusBadge from '../components/common/StatusBadge.vue'
import MonitoringMap from '../components/dashboard/MonitoringMap.vue'
import { useInstitutionStore } from '../stores/institution.store'

const institutionStore = useInstitutionStore()

const search = ref('')
const availability = ref('TODAS')
const loading = ref(false)
const error = ref('')

const filtered = computed(() => {
  return institutionStore.institutions
    .filter((item) => {
      const text =
        `${item.nombre} ${item.tipo} ${item.direccion}`.toLowerCase()

      const matchesSearch = text.includes(
        search.value.trim().toLowerCase(),
      )

      const matchesAvailability =
        availability.value === 'TODAS' ||
        item.disponibilidad === availability.value

      return matchesSearch && matchesAvailability
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
})

const tone = (value: string) => {
  if (value === 'DISPONIBLE') {
    return 'success' as const
  }

  if (value === 'ATENDIENDO') {
    return 'warning' as const
  }

  return 'neutral' as const
}

const loadInstitutions = async () => {
  loading.value = true
  error.value = ''

  try {
    await institutionStore.fetchInstitutions()
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : 'No se pudieron cargar las instituciones.'
  } finally {
    loading.value = false
  }
}

onMounted(loadInstitutions)
</script>

<template>
  <div class="space-y-6">
    <section>
      <p
        class="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500"
      >
        Centro de Monitoreo · Directorio operativo
      </p>

      <h2 class="mt-2 text-2xl font-semibold text-slate-900">
        Instituciones de respuesta
      </h2>

      <p class="mt-2 max-w-3xl text-sm text-slate-600">
        Consulta la ubicación, disponibilidad y datos de contacto de las
        instituciones registradas en ALERTA.
      </p>
    </section>

    <MonitoringMap
      :show-sensors="false"
      :show-incidents="true"
      :show-institutions="true"
      :show-reports="false"
      height-class="h-[360px]"
    />

    <section
      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div class="grid gap-3 md:grid-cols-[1fr_220px]">
        <label class="relative">
          <Search
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />

          <input
            v-model="search"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-300"
            placeholder="Buscar institución"
          />
        </label>

        <select
          v-model="availability"
          class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
        >
          <option value="TODAS">
            Todas las disponibilidades
          </option>

          <option value="DISPONIBLE">
            Disponibles
          </option>

          <option value="ATENDIENDO">
            Atendiendo
          </option>

          <option value="NO_DISPONIBLE">
            No disponibles
          </option>
        </select>
      </div>

      <!-- Cargando -->
      <div
        v-if="loading"
        class="py-12 text-center text-sm text-slate-500"
      >
        Cargando instituciones...
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <!-- Sin resultados -->
      <div
        v-else-if="filtered.length === 0"
        class="py-12 text-center text-sm text-slate-500"
      >
        No se encontraron instituciones.
      </div>

      <!-- Instituciones -->
      <div
        v-else
        class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <article
          v-for="institution in filtered"
          :key="institution.id"
          class="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
        >
          <div class="flex items-start justify-between gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-800 shadow-sm"
            >
              <Building2 class="h-5 w-5" />
            </div>

            <StatusBadge
              :state="institution.disponibilidad"
              :tone="tone(institution.disponibilidad)"
            >
              {{
                institution.disponibilidad.replaceAll('_', ' ')
              }}
            </StatusBadge>
          </div>

          <h3 class="mt-4 font-semibold text-slate-900">
            {{ institution.nombre }}
          </h3>

          <p
            class="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
          >
            {{ institution.tipo.replaceAll('_', ' ') }}
          </p>

          <div class="mt-4 space-y-2 text-sm text-slate-600">
            <p class="flex gap-2">
              <MapPin
                class="mt-0.5 h-4 w-4 shrink-0 text-orange-500"
              />

              {{ institution.direccion }}
            </p>

            <p class="flex gap-2">
              <Phone
                class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
              />

              {{ institution.telefono }}
            </p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>