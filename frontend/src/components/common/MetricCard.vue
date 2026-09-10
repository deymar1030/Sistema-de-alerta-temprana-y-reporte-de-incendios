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
  {
    trend: '',
    tone: 'neutral',
  },
)

const toneMap = {
  success: 'border-emerald-500/30 bg-emerald-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  danger: 'border-red-500/30 bg-red-500/5',
  neutral: 'border-slate-700 bg-slate-800/80',
  info: 'border-orange-500/30 bg-orange-500/5',
}

const indicatorMap = {
  success: 'text-emerald-300',
  warning: 'text-amber-300',
  danger: 'text-red-300',
  neutral: 'text-slate-200',
  info: 'text-orange-300',
}
</script>

<template>
  <div :class="['rounded-2xl border p-5 shadow-lg shadow-slate-950/20 transition-all duration-200 hover:border-slate-600', toneMap[props.tone]]">
    <div class="mb-5 flex items-start justify-between gap-3">
      <div>
        <p class="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">{{ props.title }}</p>
        <p class="mt-3 text-3xl font-semibold text-white">{{ props.value }}</p>
      </div>
      <div :class="['flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-950/60', indicatorMap[props.tone]]">
        <component :is="props.icon" class="h-5 w-5" />
      </div>
    </div>
    <div class="flex items-center justify-between gap-2 text-xs text-slate-300">
      <span>{{ props.detail }}</span>
      <span v-if="props.trend" :class="['font-medium', indicatorMap[props.tone]]">{{ props.trend }}</span>
    </div>
  </div>
</template>
