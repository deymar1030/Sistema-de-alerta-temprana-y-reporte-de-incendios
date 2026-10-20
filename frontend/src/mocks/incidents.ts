import type { Incident } from '../types'

export const incidentsMock: Incident[] = [
  {
    id: 'INC-001', alertId: 'ALT-001', origen: 'SENSOR', status: 'DESPACHADA', riesgo: 'high',
    ubicacion: 'Zona Sur, La Paz', latitud: -16.545, longitud: -68.087,
    descripcion: 'Lectura combinada de humo y temperatura elevada.',
    createdAt: '2026-09-13T12:42:00-04:00', updatedAt: '2026-09-13T12:48:00-04:00',
  },
  {
    id: 'INC-002', alertId: null, origen: 'CIUDADANO', status: 'EN_VALIDACION', riesgo: 'warning',
    ubicacion: 'Av. Busch, Miraflores, La Paz', latitud: -16.508, longitud: -68.121,
    descripcion: 'Reporte ciudadano de humo visible cerca de un inmueble.',
    createdAt: '2026-09-13T13:05:00-04:00', updatedAt: '2026-09-13T13:05:00-04:00', citizenReportId: 'REP-001',
  },
  {
    id: 'INC-003', alertId: 'ALT-003', origen: 'SENSOR', status: 'EN_SITIO', riesgo: 'critical',
    ubicacion: 'Zona Miraflores, La Paz', latitud: -16.511, longitud: -68.112,
    descripcion: 'Incremento crítico de temperatura y humo en panel eléctrico.',
    createdAt: '2026-09-13T11:38:00-04:00', updatedAt: '2026-09-13T11:56:00-04:00',
  },
  {
    id: 'INC-004', alertId: 'ALT-004', origen: 'SENSOR', status: 'CERRADA', riesgo: 'high',
    ubicacion: 'Sopocachi, La Paz', latitud: -16.5105, longitud: -68.1345,
    descripcion: 'Incidente controlado y cerrado luego de inspección institucional.',
    createdAt: '2026-09-12T18:12:00-04:00', updatedAt: '2026-09-12T19:04:00-04:00',
  },
]
