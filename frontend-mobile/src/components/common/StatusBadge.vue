<script setup lang="ts">
import { IonBadge } from '@ionic/vue'

withDefaults(
  defineProps<{
    state: string
    tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  }>(),
  {
    tone: 'neutral',
  },
)

const toneClasses: Record<string, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
}
</script>

<template>
  <ion-badge :class="['status-badge', toneClasses[tone]]">{{ state }}</ion-badge>
</template>

<style scoped>
.status-badge {
  font-size: 10px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 700;
}
.badge-success {
  background: #e3f0e8;
  color: #356b53;
}
.badge-warning {
  background: #fff7da;
  color: #806300;
}
.badge-danger {
  background: #fce8e6;
  color: #b92d2d;
}
.badge-info {
  background: #e8effb;
  color: #355ca0;
}
.badge-neutral {
  background: #eef1ef;
  color: #596773;
}
</style>
