<script setup lang="ts">
import { IonCard, IonCardContent } from '@ionic/vue'
import { IonIcon } from '@ionic/vue'
import { checkmarkCircleOutline, notificationsOutline, warningOutline } from 'ionicons/icons'
import type { NotificationItem } from '../../types'

const props = defineProps<{ item: NotificationItem }>()

const iconMap = {
  info: notificationsOutline,
  warning: warningOutline,
  success: checkmarkCircleOutline,
}
</script>

<template>
  <ion-card class="notification-card">
    <ion-card-content>
      <div class="header">
        <div class="icon-box" :class="props.item.type">
          <ion-icon :icon="iconMap[props.item.type]" class="icon" aria-hidden="true" />
        </div>
        <div>
          <h4>{{ props.item.title }}</h4>
          <p>{{ props.item.date }} · {{ props.item.time }}</p>
        </div>
      </div>
      <p class="description">{{ props.item.description }}</p>
    </ion-card-content>
  </ion-card>
</template>

<style scoped>
.notification-card {
  margin: 0 0 12px;
}
.header {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
}
.header > div:last-child { min-width: 0; }
.icon-box {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-box.info { background: #e8effb; color: #355ca0; }
.icon-box.warning { background: #fff7da; color: #8f6f00; }
.icon-box.success { background: #e3f0e8; color: #47836b; }
.icon {
  font-size: 20px;
}
h4 {
  margin: 0;
  font-size: 16px;
  color: #17212b;
  overflow-wrap: anywhere;
}
p {
  margin: 0.2rem 0 0;
  font-size: 12px;
  color: #596773;
}
.description {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.5;
}
</style>
