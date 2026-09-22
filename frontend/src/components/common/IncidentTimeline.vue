<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, Circle, Clock3 } from 'lucide-vue-next'
import type { IncidentStatus, IncidentTimelineEvent } from '../../types'

const props = withDefaults(defineProps<{
  incidentId: string
  currentStatus?: IncidentStatus
  events?: IncidentTimelineEvent[]
}>(), {
  currentStatus: 'NUEVA',
  events: () => [],
})

const fallbackSteps: Array<{ status: IncidentStatus; label: string }> = [
  { status: 'NUEVA', label: 'Detección recibida' },
  { status: 'EN_VALIDACION', label: 'Validación' },
  { status: 'VALIDADA', label: 'Alerta validada' },
  { status: 'DESPACHADA', label: 'Despacho' },
  { status: 'ACEPTADA', label: 'Recepción confirmada' },
  { status: 'EN_CAMINO', label: 'Unidad en camino' },
  { status: 'EN_SITIO', label: 'Unidad en sitio' },
  { status: 'CONTROLADA', label: 'Incendio controlado' },
  { status: 'FINALIZADA', label: 'Intervención finalizada' },
]

const currentIndex = computed(() => fallbackSteps.findIndex((step) => step.status === props.currentStatus))
const sortedEvents = computed(() => [...props.events].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
const formatTime = (value: string) => new Intl.DateTimeFormat('es-BO', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Cronología del incidente</p>
        <p class="mt-1 text-sm font-medium text-slate-800">{{ incidentId }}</p>
      </div>
      <Clock3 class="h-5 w-5 text-orange-500" />
    </div>

    <div v-if="sortedEvents.length" class="mt-5 space-y-0">
      <div v-for="(event, index) in sortedEvents" :key="event.id" class="relative flex gap-3 pb-5 last:pb-0">
        <div v-if="index < sortedEvents.length - 1" class="absolute left-[9px] top-5 h-[calc(100%-10px)] w-px bg-slate-200"></div>
        <div class="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-white">
          <CheckCircle2 class="h-5 w-5 text-emerald-600" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="font-medium text-slate-900">{{ event.titulo }}</p>
            <span class="text-xs font-medium text-slate-500">{{ formatTime(event.createdAt) }}</span>
          </div>
          <p class="mt-1 text-sm text-slate-600">{{ event.detalle }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ event.actor }}</p>
        </div>
      </div>
    </div>

    <div v-else class="mt-5 space-y-4">
      <div v-for="(step, index) in fallbackSteps" :key="step.status" class="flex items-start gap-3">
        <CheckCircle2 v-if="index <= currentIndex" class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <Circle v-else class="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />
        <div>
          <p :class="index <= currentIndex ? 'font-medium text-slate-900' : 'text-slate-400'">{{ step.label }}</p>
          <p v-if="index <= currentIndex" class="text-xs text-slate-500">Estado registrado en la demostración.</p>
        </div>
      </div>
    </div>
  </div>
</template>
