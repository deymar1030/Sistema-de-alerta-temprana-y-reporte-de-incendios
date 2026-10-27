import { apiFetch } from './http'
import type { Notification } from '../types'

function normalizeNotification(payload: any): Notification {
  const id = payload?.id_notificacion ?? payload?.id
  if (id == null || id === '') throw new Error('Notificación recibida sin id_notificacion.')
  return {
    id: String(id),
    userId: payload?.id_usuario ?? payload?.userId,
    type: (payload?.tipo ?? payload?.type ?? 'SISTEMA') as Notification['type'],
    title: payload?.titulo ?? payload?.title ?? 'Notificación',
    message: payload?.mensaje ?? payload?.message ?? '',
    createdAt: payload?.fecha_hora ?? payload?.createdAt ?? '',
    read: payload?.leida === true || payload?.read === true,
    relatedEntityId: payload?.id_alerta == null ? payload?.relatedEntityId : String(payload.id_alerta),
  }
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const payload = await apiFetch<any>('/notificaciones')
    const items = Array.isArray(payload) ? payload : payload?.data ?? payload?.notificaciones ?? []
    return items.map(normalizeNotification)
  },

  async markAsRead(id: string): Promise<void> {
    await apiFetch(`/notificaciones/${id}/leer`, { method: 'PATCH' })
  },

  async markAllAsRead(): Promise<void> {
    await apiFetch('/notificaciones/leer-todas', { method: 'PATCH' })
  },
}
