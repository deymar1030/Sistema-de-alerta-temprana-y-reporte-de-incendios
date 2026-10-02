<script setup lang="ts">
withDefaults(
  defineProps<{
    level: 'normal' | 'warning' | 'high' | 'critical'
  }>(),
  {
    level: 'normal',
  },
)

const levelMap = {
  normal: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  high: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  critical: 'bg-red-500/10 text-red-300 border-red-500/30',
}

const labels = {
  normal: 'BAJO',
  warning: 'ADVERTENCIA',
  high: 'ALTO',
  critical: 'CRÍTICO',
}
</script>

<template>
  <span :class="['inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]', levelMap[level]]">
    {{ labels[level] }}
  </span>
</template>
