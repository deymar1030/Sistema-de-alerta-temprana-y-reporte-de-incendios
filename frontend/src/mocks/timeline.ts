import type { IncidentTimelineEvent } from '../types'

export const timelineMock: IncidentTimelineEvent[] = [
  { id: 'EVT-001', incidentId: 'INC-003', estado: 'NUEVA', titulo: 'Detección recibida', detalle: 'El motor registró condiciones críticas.', createdAt: '2026-09-13T11:38:00-04:00', actor: 'Motor de detección' },
  { id: 'EVT-002', incidentId: 'INC-003', estado: 'VALIDADA', titulo: 'Alerta validada', detalle: 'El operador confirmó la emergencia.', createdAt: '2026-09-13T11:40:00-04:00', actor: 'Operador Central' },
  { id: 'EVT-003', incidentId: 'INC-003', dispatchId: 'DSP-002', institutionId: 'INS-001', estado: 'ENVIADA', titulo: 'Despacho enviado', detalle: 'Alerta enviada a Bomberos de la Policía Boliviana.', createdAt: '2026-09-13T11:41:00-04:00', actor: 'Operador Central' },
  { id: 'EVT-004', incidentId: 'INC-003', dispatchId: 'DSP-002', institutionId: 'INS-001', estado: 'ACEPTADA', titulo: 'Recepción confirmada', detalle: 'La institución aceptó el despacho.', createdAt: '2026-09-13T11:43:00-04:00', actor: 'Personal operativo' },
  { id: 'EVT-005', incidentId: 'INC-003', dispatchId: 'DSP-002', institutionId: 'INS-001', estado: 'EN_CAMINO', titulo: 'Unidad en camino', detalle: 'La unidad salió hacia el incidente.', createdAt: '2026-09-13T11:46:00-04:00', actor: 'Personal operativo' },
  { id: 'EVT-006', incidentId: 'INC-003', dispatchId: 'DSP-002', institutionId: 'INS-001', estado: 'EN_SITIO', titulo: 'Llegada al lugar', detalle: 'La unidad confirmó llegada.', createdAt: '2026-09-13T11:56:00-04:00', actor: 'Personal operativo' },
  { id: 'EVT-007', incidentId: 'INC-004', estado: 'CERRADA', titulo: 'Incidente cerrado', detalle: 'Atención completada y revisada.', createdAt: '2026-09-12T19:04:00-04:00', actor: 'Operador Central' },
]
