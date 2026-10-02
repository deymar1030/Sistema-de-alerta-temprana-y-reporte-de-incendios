import type { NotificationItem } from '../types'

export const notificationsMock: NotificationItem[] = [
  {
    id: 'NT-001',
    title: 'Incendio reportado cerca de tu zona',
    description: 'Se activó una alerta en la zona de Av. Arce y se encuentra en revisión.',
    type: 'warning',
    date: '29/09/2026',
    time: '14:42',
  },
  {
    id: 'NT-002',
    title: 'Evita circular por Av. Arce',
    description: 'Se recomienda evitar el sector debido a condiciones de humo.',
    type: 'info',
    date: '29/09/2026',
    time: '14:30',
  },
  {
    id: 'NT-003',
    title: 'Emergencia controlada',
    description: 'La intervención fue finalizada y el riesgo fue estabilizado.',
    type: 'success',
    date: '28/09/2026',
    time: '18:10',
  },
]
