import type { AuditLog } from '../types'

export const auditMock: AuditLog[] = [
  { id: 'AUD-001', usuario: 'Operador principal', accion: 'Validó alerta', fecha: '2026-09-13T14:06:00-04:00', incidenteId: 'INC-002', detalle: 'Reporte ciudadano validado para despacho manual.' },
  { id: 'AUD-002', usuario: 'Administradora Bomberos', accion: 'Agregó informe', fecha: '2026-09-13T14:45:00-04:00', incidenteId: 'INC-001', detalle: 'Informe de atención demo registrado.' },
]