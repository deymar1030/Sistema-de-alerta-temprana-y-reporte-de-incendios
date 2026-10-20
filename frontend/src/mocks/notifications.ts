export type NotificationType = 'ALERTA' | 'ESTADO' | 'RECOMENDACION' | 'SISTEMA'

export interface NotificationMock {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: string
}

export const notificationsMock: NotificationMock[] = [
  {
    id: 'NT-001',
    userId: 'CIT-001',
    title: 'Alerta cercana',
    message: 'Hay una alerta activa en tu zona. Mantente atento.',
    type: 'ALERTA',
    read: false,
    createdAt: '2026-10-10T08:30:00.000Z',
  },
  {
    id: 'NT-002',
    userId: 'CIT-001',
    title: 'Cambio de estado',
    message: 'Tu reporte REP-001 ha pasado a revisión.',
    type: 'ESTADO',
    read: false,
    createdAt: '2026-10-10T09:00:00.000Z',
  },
  {
    id: 'NT-003',
    userId: 'CIT-001',
    title: 'Recomendación',
    message: 'Mantén una distancia segura de la zona afectada.',
    type: 'RECOMENDACION',
    read: true,
    createdAt: '2026-10-09T17:10:00.000Z',
  },
]
