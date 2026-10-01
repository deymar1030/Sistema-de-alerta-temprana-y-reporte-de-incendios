<script setup lang="ts">
import { IonBadge } from '@ionic/vue'

withDefaults(
  defineProps<{
    level: string
    tone?: 'success' | 'warning' | 'danger' | 'info'
  }>(),
  {
    tone: 'warning',
  },
)
</script>

<template>
  <ion-badge class="risk-badge" :class="`risk-${tone}`">
    {{ level }}
  </ion-badge>
</template>

<style scoped>
.risk-badge {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
.risk-success { background: #e3f0e8; color: #356b53; }
.risk-warning { background: #fff7da; color: #806300; }
.risk-danger { background: #fce8e6; color: #b92d2d; }
.risk-info { background: #e8effb; color: #355ca0; }
</style>
