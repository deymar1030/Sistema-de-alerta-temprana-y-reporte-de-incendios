<script setup lang="ts">
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-vue-next'
import { useToast } from '../../composables/useToast'

const { toasts, removeToast } = useToast()

const toneClasses = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
} as const

const IconMap = {
  success: CheckCircle2,
  warning: TriangleAlert,
  error: TriangleAlert,
  info: Info,
} as const
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-3 px-4">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-sm', toneClasses[toast.type]]"
      >
        <div class="mt-0.5 rounded-full bg-white/60 p-1.5">
          <component :is="IconMap[toast.type]" class="h-4 w-4" />
        </div>

        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold">{{ toast.title }}</p>
          <p v-if="toast.description" class="mt-1 text-xs opacity-80">{{ toast.description }}</p>
        </div>

        <button
          type="button"
          class="rounded-full p-1 text-current/80 transition hover:bg-white/40"
          @click="removeToast(toast.id)"
          aria-label="Cerrar notificación"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
