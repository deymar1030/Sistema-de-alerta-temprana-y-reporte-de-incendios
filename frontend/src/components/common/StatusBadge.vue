<script setup lang="ts">
withDefaults(
  defineProps<{
    state: string
    tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
  }>(),
  {
    tone: 'neutral',
  },
)

const toneMap = {
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/10 text-red-300 border-red-500/30',
  neutral: 'bg-slate-500/10 text-slate-200 border-slate-500/20',
  info: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
}
</script>

<template>
  <span :class="['inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', toneMap[tone]]">
    <slot />
  </span>
</template>
