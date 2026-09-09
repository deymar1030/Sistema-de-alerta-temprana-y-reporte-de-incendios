<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    message?: string
  }>(),
  {
    title: 'Sin datos disponibles',
    message: 'No hay información para mostrar en este momento.',
  },
)
</script>

<template>
  <div class="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-10 text-center">
    <p class="text-base font-semibold text-slate-100">{{ title }}</p>
    <p class="mt-2 text-sm text-slate-400">{{ message }}</p>
  </div>
</template>
