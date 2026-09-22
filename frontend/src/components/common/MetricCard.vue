<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    value: string
    detail: string
    trend?: string
    tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
    icon: Component
  }>(),
  { trend: '', tone: 'neutral' },
)

const toneMap = {
  success: 'border-emerald-200 bg-[#e7f1eb]',
  warning: 'border-amber-200 bg-[#f7f3e8]',
  danger: 'border-red-200 bg-[#f9ece9]',
  neutral: 'border-slate-200 bg-white',
  info: 'border-orange-200 bg-[#f6efe7]',
}
const indicatorMap = {
  success: 'text-emerald-700',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  neutral: 'text-slate-600',
  info: 'text-orange-500',
}
</script>

<template>
  <div :class="['rounded-2xl border p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5', toneMap[props.tone]]">
    <div class="mb-5 flex items-start justify-between gap-3">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{{ props.title }}</p>
        <p class="mt-3 text-3xl font-semibold text-slate-900">{{ props.value }}</p>
      </div>
      <div :class="['flex h-11 w-11 items-center justify-center rounded-xl border border-white/70 bg-white/75 shadow-sm', indicatorMap[props.tone]]">
        <component :is="props.icon" class="h-5 w-5" />
      </div>
    </div>
    <div class="flex items-center justify-between gap-2 text-xs text-slate-600">
      <span>{{ props.detail }}</span>
      <span v-if="props.trend" :class="['font-semibold', indicatorMap[props.tone]]">{{ props.trend }}</span>
    </div>
  </div>
</template>
