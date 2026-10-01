import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationsMock } from '../mocks/notifications'
import { notificationService } from '../services/notification.service'
import type { NotificationItem } from '../types'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationItem[]>([...notificationsMock])
  const isLoading = ref(false)

  const fetchNotifications = async () => {
    isLoading.value = true
    try {
      notifications.value = await notificationService.getNotifications()
    } finally {
      isLoading.value = false
    }
  }

  const markAsRead = async () => {
    await notificationService.markAsRead()
  }

  return {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
  }
})
