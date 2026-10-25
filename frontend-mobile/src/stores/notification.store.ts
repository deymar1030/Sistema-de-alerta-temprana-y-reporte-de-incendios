import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Notification } from '../types'
import { notificationService } from '../services/notification.service'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchNotifications() {
    loading.value = true
    error.value = null

    try {
      notifications.value = await notificationService.getNotifications()
      return notifications.value
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar las notificaciones.'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: string) {
    await notificationService.markAsRead(id)
    notifications.value = notifications.value.map((item) =>
      item.id === id ? { ...item, read: true } : item,
    )
  }

  async function markAllAsRead() {
    await notificationService.markAllAsRead()
    notifications.value = notifications.value.map((item) => ({ ...item, read: true }))
  }

  function clear() {
    notifications.value = []
    loading.value = false
    error.value = null
  }

  return {
    notifications,
    loading,
    error,
    clear,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
})
