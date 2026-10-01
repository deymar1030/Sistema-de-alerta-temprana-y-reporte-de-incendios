<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { onMounted } from 'vue'
import EmptyState from '../../components/common/EmptyState.vue'
import LoadingSpinner from '../../components/common/LoadingSpinner.vue'
import NotificationCard from '../../components/common/NotificationCard.vue'
import { useNotificationStore } from '../../stores/notification.store'

const notificationStore = useNotificationStore()

onMounted(async () => {
  await notificationStore.fetchNotifications()
})
</script>

<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <ion-title>Notificaciones</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="container">
        <div class="section-title">Avisos y alertas</div>
        <LoadingSpinner v-if="notificationStore.isLoading" />
        <EmptyState
          v-else-if="notificationStore.notifications.length === 0"
          title="No tienes notificaciones nuevas"
          message="Los avisos importantes aparecerán aquí."
        />
        <template v-else>
          <NotificationCard v-for="item in notificationStore.notifications" :key="item.id" :item="item" />
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.container {
  max-width: 520px;
  margin: 0 auto;
}
</style>
