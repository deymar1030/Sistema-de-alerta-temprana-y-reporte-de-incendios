<script setup lang="ts">
withDefaults(defineProps<{ state: string; tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }>(), { tone: 'neutral' })
const toneMap = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  info: 'bg-orange-50 text-orange-700 border-orange-200',
}
</script>

<template>
  <span :class="['inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', toneMap[tone]]">
    <slot>{{ state }}</slot>
  </span>
</template>
