import type { Dispatch } from '../types'

export const dispatchesMock: Dispatch[] = [
  { id: 'DSP-001', incidentId: 'INC-001', alertId: 'ALT-001', institutionId: 'INS-002', sentBy: 'USR-001', sentAt: '2026-09-13T12:48:00-04:00', updatedAt: '2026-09-13T12:48:00-04:00', status: 'ENVIADA' },
  { id: 'DSP-002', incidentId: 'INC-003', alertId: 'ALT-003', institutionId: 'INS-001', sentBy: 'USR-001', sentAt: '2026-09-13T11:41:00-04:00', updatedAt: '2026-09-13T11:56:00-04:00', status: 'EN_SITIO' },
  { id: 'DSP-003', incidentId: 'INC-004', alertId: 'ALT-004', institutionId: 'INS-001', sentBy: 'USR-001', sentAt: '2026-09-12T18:16:00-04:00', updatedAt: '2026-09-12T18:58:00-04:00', status: 'FINALIZADA' },
]
