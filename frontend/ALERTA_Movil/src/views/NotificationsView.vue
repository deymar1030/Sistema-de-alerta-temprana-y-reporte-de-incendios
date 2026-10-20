<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/ciudadano/inicio" />
        </ion-buttons>
        <ion-title>Notificaciones</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="markAllAsRead">Marcar todo</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list v-if="notificationStore.notifications.length">
        <ion-item v-for="notification in notificationStore.notifications" :key="notification.id" lines="full">
          <ion-icon :icon="notification.read ? checkmarkDoneOutline : alertCircleOutline" slot="start" />
          <ion-label>
            <h3>{{ notification.title }}</h3>
            <p>{{ notification.message }}</p>
            <small>{{ formatDate(notification.createdAt) }}</small>
          </ion-label>
          <ion-button fill="clear" v-if="!notification.read" @click="markOne(notification.id)">Leer</ion-button>
        </ion-item>
      </ion-list>

      <div v-else class="empty-state">
        <p>No tienes notificaciones pendientes.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { alertCircleOutline, checkmarkDoneOutline } from 'ionicons/icons'
import { useNotificationStore } from '../stores/notification.store'

const notificationStore = useNotificationStore()

onMounted(async () => {
  await notificationStore.fetchNotifications()
})

async function markOne(id: string) {
  await notificationStore.markAsRead(id)
}

async function markAllAsRead() {
  await notificationStore.markAllAsRead()
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<style scoped>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #64748b;
}
</style>
