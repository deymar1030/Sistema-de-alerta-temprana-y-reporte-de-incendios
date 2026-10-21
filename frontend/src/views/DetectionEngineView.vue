<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { AlertTriangle, ArrowRight, BrainCircuit, Gauge, ImageUp, LoaderCircle, ShieldCheck } from 'lucide-vue-next'
import { useDetectionStore } from '../stores/detection.store'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'
import { imageDetectionService, type ImageDetectionResult } from '../services/image-detection.service'

const detectionStore = useDetectionStore()
const temperatura = ref(26)
const humo = ref(0.35)
const co = ref(6)
const result = ref<{ riesgo: number; nivel: string; descripcion: string } | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const selectedImage = ref<File | null>(null)
const selectedImageUrl = ref('')
const imageResult = ref<ImageDetectionResult | null>(null)
const imageError = ref('')
const isAnalyzingImage = ref(false)

const riskLevelLabel = computed(() => {
  if (!result.value) return 'Sin análisis'
  return result.value.nivel === 'critical' ? 'CRÍTICO' : result.value.nivel === 'high' ? 'ALTO' : result.value.nivel === 'warning' ? 'ADVERTENCIA' : 'NORMAL'
})

const runAnalysis = async () => {
  await detectionStore.analyzeRisk(temperatura.value, humo.value, co.value)
  result.value = detectionStore.riskResult
}

const openImagePicker = () => imageInput.value?.click()

const onImageSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const image = input.files?.[0]
  input.value = ''
  if (!image) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
    imageError.value = 'Selecciona una imagen JPG, PNG o WEBP.'
    return
  }
  if (image.size > 10 * 1024 * 1024) {
    imageError.value = 'La imagen no puede superar 10 MB.'
    return
  }

  if (selectedImageUrl.value) URL.revokeObjectURL(selectedImageUrl.value)
  selectedImage.value = image
  selectedImageUrl.value = URL.createObjectURL(image)
  imageResult.value = null
  imageError.value = ''
  isAnalyzingImage.value = true

  try {
    imageResult.value = await imageDetectionService.analyze(image)
  } catch (error) {
    imageError.value = error instanceof Error ? error.message : 'No se pudo analizar la imagen.'
  } finally {
    isAnalyzingImage.value = false
  }
}

onBeforeUnmount(() => {
  if (selectedImageUrl.value) URL.revokeObjectURL(selectedImageUrl.value)
})

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
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-[10px] uppercase tracking-[0.22em] text-slate-400">Visión artificial</p>
          <h3 class="mt-2 text-xl font-semibold text-white">Analizar una imagen de incendio</h3>
          <p class="mt-2 max-w-2xl text-sm text-slate-400">Selecciona una evidencia JPG, PNG o WEBP. El modelo ResNet18 calculará la probabilidad de incendio.</p>
        </div>
        <input ref="imageInput" class="hidden" type="file" accept="image/jpeg,image/png,image/webp" @change="onImageSelected" />
        <button type="button" class="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-400" :disabled="isAnalyzingImage" @click="openImagePicker">
          <ImageUp class="h-4 w-4" />
          {{ selectedImage ? 'Cambiar imagen' : 'Seleccionar imagen' }}
        </button>
      </div>

      <div v-if="selectedImage" class="mt-5 grid gap-5 md:grid-cols-[minmax(0,220px)_1fr]">
        <img :src="selectedImageUrl" :alt="`Vista previa de ${selectedImage.name}`" class="h-52 w-full rounded-xl border border-slate-700 object-cover" />

        <div v-if="isAnalyzingImage" class="flex min-h-32 items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">
          <LoaderCircle class="h-5 w-5 animate-spin text-orange-400" />
          Analizando la imagen con el modelo...
        </div>
        <div v-else-if="imageResult" :class="['rounded-xl border p-4', imageResult.detected ? 'border-red-500/40 bg-red-500/10' : 'border-emerald-500/40 bg-emerald-500/10']">
          <p :class="['text-sm font-semibold', imageResult.detected ? 'text-red-200' : 'text-emerald-200']">{{ imageResult.detected ? 'Posible incendio detectado' : 'No se detectó incendio' }}</p>
          <p class="mt-3 text-3xl font-semibold text-white">{{ (imageResult.fire_probability * 100).toFixed(1) }}%</p>
          <p class="mt-1 text-sm text-slate-300">Probabilidad de incendio · umbral: {{ (imageResult.threshold * 100).toFixed(0) }}%</p>
          <p v-if="imageResult.warning" class="mt-3 text-sm text-amber-200">{{ imageResult.warning }}</p>
        </div>
        <div v-else-if="imageError" class="flex min-h-32 items-center rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {{ imageError }}
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div class="grid gap-4 md:grid-cols-5 md:items-center">
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div class="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400"><Gauge class="h-4 w-4" /> Temperatura</div>
          <input v-model.number="temperatura" type="range" min="15" max="80" step="1" class="w-full accent-orange-500" />
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
        <button @click="runAnalysis" class="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">Ejecutar análisis</button>
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
