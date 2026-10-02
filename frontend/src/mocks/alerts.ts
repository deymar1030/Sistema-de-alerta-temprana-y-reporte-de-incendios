import type { AlertEntry } from '../types'

export const alertsMock: AlertEntry[] = [
  {
    id_alerta: 'ALR-00124',
    fecha: '2026-09-08',
    hora: '09:10',
    nivel: 'CRÍTICO',
    estado: 'ACTIVA',
    id_sensor: 'S-004',
    sensor: 'Sensor de temperatura D4',
    ubicacion: 'Panel eléctrico',
    descripcion: 'Temperatura elevada + humo detectado en área crítica.',
    lectura_referencia: 'L-012',
    instituciones_notificadas: [
      { nombre: 'Bomberos de la Policía Boliviana', fecha_envio: '2026-09-08', hora_envio: '09:10', estado_envio: 'RECIBIDA' },
      { nombre: 'Policía Boliviana', fecha_envio: '2026-09-08', hora_envio: '09:10', estado_envio: 'ENVIADA' },
      { nombre: 'Defensa Civil', fecha_envio: '2026-09-08', hora_envio: '09:11', estado_envio: 'EN_PROCESO' },
    ],
  },
  {
    id_alerta: 'ALR-00118',
    fecha: '2026-09-08',
    hora: '08:50',
    nivel: 'ALTO',
    estado: 'EN REVISIÓN',
    id_sensor: 'S-003',
    sensor: 'Sensor de CO C3',
    ubicacion: 'Nave de almacenamiento',
    descripcion: 'Concentración de CO por encima del umbral de monitoreo.',
    lectura_referencia: 'L-009',
    instituciones_notificadas: [
      { nombre: 'Bomberos de la Policía Boliviana', fecha_envio: '2026-09-08', hora_envio: '08:50', estado_envio: 'RECIBIDA' },
      { nombre: 'Gobierno Autónomo Municipal de La Paz', fecha_envio: '2026-09-08', hora_envio: '08:51', estado_envio: 'ENVIADA' },
    ],
  },
  {
    id_alerta: 'ALR-00109',
    fecha: '2026-09-07',
    hora: '21:30',
    nivel: 'MEDIO',
    estado: 'RESUELTA',
    id_sensor: 'S-002',
    sensor: 'Sensor de humo B2',
    ubicacion: 'Oficina 2',
    descripcion: 'Nivel de humo elevado durante mantenimiento de equipo.',
    lectura_referencia: 'L-006',
    instituciones_notificadas: [
      { nombre: 'SAR-FAB', fecha_envio: '2026-09-07', hora_envio: '21:30', estado_envio: 'RECIBIDA' },
      { nombre: 'Guardia Municipal', fecha_envio: '2026-09-07', hora_envio: '21:31', estado_envio: 'ENVIADA' },
    ],
  },
]
