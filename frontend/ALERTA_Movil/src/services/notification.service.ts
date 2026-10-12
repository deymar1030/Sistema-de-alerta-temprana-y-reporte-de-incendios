import { apiFetch } from './http'
import type { Notification } from '../types'

function normalizeNotification(payload: any): Notification {
  return {
    id: String(payload?.id ?? payload?.notificacion_id ?? crypto.randomUUID()),
    userId: payload?.userId ?? payload?.id_usuario ?? payload?.usuario_id,
    type: (payload?.type ?? payload?.tipo ?? 'SISTEMA') as Notification['type'],
    title: payload?.title ?? payload?.titulo ?? 'Notificación',
    message: payload?.message ?? payload?.mensaje ?? 'Hay una actualización importante.',
    createdAt: payload?.createdAt ?? payload?.created_at ?? new Date().toISOString(),
    read: Boolean(payload?.read ?? payload?.leida ?? false),
    relatedEntityId: payload?.relatedEntityId ?? payload?.entidad_relacionada_id,
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
