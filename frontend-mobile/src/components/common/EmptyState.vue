<script setup lang="ts">
import { IonIcon, IonLabel } from '@ionic/vue'
import { notificationsOutline } from 'ionicons/icons'

defineProps<{ title: string; message: string }>()
</script>

<template>
  <div class="empty-state">
    <div class="icon-wrap"><ion-icon :icon="notificationsOutline" aria-hidden="true" /></div>
    <ion-label>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
    </ion-label>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  text-align: center;
  padding: 2.5rem 1rem;
  color: #596773;
}
.icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9e8d8;
  color: #f4a259;
  font-size: 26px;
}
h3 {
  color: #17212b;
  margin: 0;
}
p {
  margin: 0.35rem 0 0;
  line-height: 1.5;
}
</style>
