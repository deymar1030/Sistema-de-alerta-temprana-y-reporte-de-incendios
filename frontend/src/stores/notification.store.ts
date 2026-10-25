import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  notificationService,
  type NotificationItem,
} from '../services/notification.service'

export const useNotificationStore = defineStore(
  'notification',
  () => {
    const notifications = ref<NotificationItem[]>([])
    const unreadCount = ref(0)

    const loading = ref(false)
    const error = ref<string | null>(null)

    const hasUnread = computed(
      () => unreadCount.value > 0,
    )

    const fetchNotifications = async () => {
      loading.value = true
      error.value = null

      try {
        notifications.value =
          await notificationService.getNotifications()

        unreadCount.value =
          await notificationService.getUnreadCount()
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : 'No fue posible obtener las notificaciones.'
      } finally {
        loading.value = false
      }
    }

    const refreshUnreadCount = async () => {
      try {
        unreadCount.value =
          await notificationService.getUnreadCount()
      } catch {
        // Evitamos romper el layout si falla solo el contador.
      }
    }

    // Las notificaciones devueltas por el backend ya están acotadas a la sesión.
    const getMyNotifications = async (_userId?: string) => {
      await fetchNotifications()
      return notifications.value
    }

    const markAllAsRead = async () => {
      await notificationService.markAllAsRead()

      unreadCount.value = 0

      await fetchNotifications()
    }

    const markAsRead = async (id: string) => {
      await notificationService.markAsRead(id)

      await fetchNotifications()
    }

    return {
      notifications,
      unreadCount,
      hasUnread,
      loading,
      error,

      getMyNotifications,
      fetchNotifications,
      refreshUnreadCount,
      markAllAsRead,
      markAsRead,
    }
  },
)