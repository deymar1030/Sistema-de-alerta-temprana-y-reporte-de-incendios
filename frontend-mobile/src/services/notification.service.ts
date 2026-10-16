import { notificationsMock } from '../mocks/notifications'
import type { NotificationItem } from '../types'

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    return Promise.resolve(notificationsMock)
  },

  async markAsRead(): Promise<void> {
    return Promise.resolve()
  },
}
