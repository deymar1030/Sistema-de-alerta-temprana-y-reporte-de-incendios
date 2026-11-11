<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { personCircleOutline } from 'ionicons/icons'
</script>

<template>
  <span class="assigned-badge"><ion-icon :icon="personCircleOutline" aria-hidden="true" />Asignada a ti</span>
</template>

<style scoped>
.assigned-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  background: #d9382e;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
}
.assigned-badge ion-icon { font-size: 14px; }
</style>
