<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AlertTriangle, ArrowRight, BrainCircuit, Gauge, ShieldCheck } from 'lucide-vue-next'
import { useDetectionStore } from '../stores/detection.store'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const detectionStore = useDetectionStore()
const temperatura = ref(26)
const humo = ref(0.35)
const co = ref(6)
const result = ref<{ riesgo: number; nivel: string; descripcion: string } | null>(null)

const riskLevelLabel = computed(() => {
  if (!result.value) return 'Sin análisis'
  return result.value.nivel === 'critical' ? 'CRÍTICO' : result.value.nivel === 'high' ? 'ALTO' : result.value.nivel === 'warning' ? 'ADVERTENCIA' : 'NORMAL'
})

const runAnalysis = async () => {
  await detectionStore.analyzeRisk(temperatura.value, humo.value, co.value)
  result.value = detectionStore.riskResult
}

onMounted(async () => {
  await detectionStore.fetchEngine()
})
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Motor de detección</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">Fire Detection Engine</h2>
        </div>
        <div class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-emerald-300">Activo</div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-4">
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div class="text-[10px] uppercase tracking-[0.2em] text-slate-400">Versión</div>
          <div class="mt-2 text-xl font-semibold text-white">{{ detectionStore.engine?.version || '1.0.0' }}</div>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div class="text-[10px] uppercase tracking-[0.2em] text-slate-400">Estado</div>
          <div class="mt-2 text-xl font-semibold text-white">{{ detectionStore.engine?.estado || 'Activo' }}</div>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div class="text-[10px] uppercase tracking-[0.2em] text-slate-400">Tipo</div>
          <div class="mt-2 text-xl font-semibold text-white">{{ detectionStore.engine?.tipo_analisis || 'Basado en reglas' }}</div>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div class="text-[10px] uppercase tracking-[0.2em] text-slate-400">Sensibilidad</div>
          <div class="mt-2 text-xl font-semibold text-white">{{ detectionStore.engine?.sensibilidad || 'Alta' }}</div>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div class="grid gap-4 md:grid-cols-5 md:items-center">
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div class="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><Gauge class="h-4 w-4" /> Temperatura</div>
          <input v-model.number="temperatura" type="range" min="15" max="80" step="1" class="w-full accent-sky-500" />
          <div class="mt-2 text-lg font-semibold text-white">{{ temperatura }}°C</div>
        </div>
        <div class="flex justify-center text-slate-500"><ArrowRight class="h-5 w-5" /></div>
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div class="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><AlertTriangle class="h-4 w-4" /> Humo</div>
          <input v-model.number="humo" type="range" min="0" max="2" step="0.05" class="w-full accent-amber-500" />
          <div class="mt-2 text-lg font-semibold text-white">{{ humo.toFixed(2) }}</div>
        </div>
        <div class="flex justify-center text-slate-500"><ArrowRight class="h-5 w-5" /></div>
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div class="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><ShieldCheck class="h-4 w-4" /> CO</div>
          <input v-model.number="co" type="range" min="0" max="30" step="1" class="w-full accent-orange-500" />
          <div class="mt-2 text-lg font-semibold text-white">{{ co }} ppm</div>
        </div>
      </div>

      <div class="mt-6 flex justify-center">
        <button @click="runAnalysis" class="rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">Ejecutar análisis</button>
      </div>
    </section>

    <section v-if="detectionStore.loading" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <LoadingSpinner />
    </section>

    <section v-else-if="result || detectionStore.riskResult" class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Resultado</p>
        <h3 class="mt-3 text-3xl font-semibold text-white">{{ result?.riesgo ?? detectionStore.riskResult?.riesgo ?? 0 }}%</h3>
        <div class="mt-3 flex items-center gap-2">
          <span :class="[
            'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
            (result?.nivel ?? detectionStore.riskResult?.nivel) === 'critical' ? 'border-red-500/30 bg-red-500/10 text-red-300' :
            (result?.nivel ?? detectionStore.riskResult?.nivel) === 'high' ? 'border-orange-500/30 bg-orange-500/10 text-orange-300' :
            (result?.nivel ?? detectionStore.riskResult?.nivel) === 'warning' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          ]">{{ riskLevelLabel }}</span>
        </div>
        <p class="mt-4 text-sm text-slate-300">El nivel de riesgo fue calculado a partir de las variables recibidas.</p>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div class="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><BrainCircuit class="h-4 w-4" /> Flujo del motor</div>
        <div class="space-y-3">
          <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">Sensor</div>
          <div class="text-center text-slate-500">↓</div>
          <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">Lectura</div>
          <div class="text-center text-slate-500">↓</div>
          <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">Motor de detección</div>
          <div class="text-center text-slate-500">↓</div>
          <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">Evaluación de riesgo</div>
          <div class="text-center text-slate-500">↓</div>
          <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">Alerta</div>
        </div>
      </div>
    </section>
  </div>
</template>
