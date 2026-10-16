const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export interface NotificationItem {
  id?: string
  id_notificacion?: string
  titulo?: string
  mensaje?: string
  leida?: boolean
  fecha?: string
  fecha_hora?: string
  [key: string]: unknown
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  code?: string
}

const request = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  })

  if (response.status === 401) {
    throw new Error(
      'La sesión ha expirado. Inicia sesión nuevamente.',
    )
  }

  const result: ApiResponse<T> = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(
      result.error ?? 'No fue posible procesar la solicitud.',
    )
  }

  return result.data
}

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    return request<NotificationItem[]>(
      `${API_URL}/notificaciones`,
    )
  },

  async getUnreadCount(): Promise<number> {
    const data = await request<{ total: number }>(
      `${API_URL}/notificaciones/no-leidas/conteo`,
    )

    return data.total
  },

  async markAllAsRead(): Promise<void> {
    await request(
      `${API_URL}/notificaciones/leer-todas`,
      {
        method: 'PATCH',
      },
    )
  },

  async markAsRead(
    id: string,
  ): Promise<void> {
    await request(
      `${API_URL}/notificaciones/${id}/leer`,
      {
        method: 'PATCH',
      },
    )
  },
}