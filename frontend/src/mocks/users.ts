import type { User } from '../types'
export { getRoleLabel } from '../types'

export const usersMock: User[] = [
  { id: 'USR-SA-001', nombre: 'Santiago Mejía', email: 'superadmin@alerta.bo', rol: 'SUPER_ADMIN', role: 'SUPER_ADMIN', institucionId: null, institutionId: null, activo: true, status: 'ACTIVE', createdAt: '2026-10-01T08:00:00.000Z' },
  { id: 'USR-SA-002', nombre: 'Carlos Pérez', email: 'carlos@alerta.com', rol: 'SUPER_ADMIN', role: 'SUPER_ADMIN', institucionId: null, institutionId: null, activo: true, status: 'ACTIVE', createdAt: '2026-10-02T09:00:00.000Z' },
  { id: 'USR-001', nombre: 'Operador principal', email: 'operador@alerta.bo', rol: 'CENTRAL_OPERATOR', role: 'CENTRAL_OPERATOR', institucionId: null, institutionId: null, activo: true, status: 'ACTIVE', createdAt: '2026-10-03T10:00:00.000Z' },
  { id: 'USR-002', nombre: 'Administradora Bomberos', email: 'admin.bomberos@alerta.bo', rol: 'INSTITUTION_ADMIN', role: 'INSTITUTION_ADMIN', institucionId: 'INS-001', institutionId: 'INS-001', activo: true, status: 'ACTIVE', createdAt: '2026-10-04T11:00:00.000Z' },
  { id: 'USR-003', nombre: 'Personal operativo', email: 'operativo@alerta.bo', rol: 'INSTITUTION_USER', role: 'INSTITUTION_USER', institucionId: 'INS-001', institutionId: 'INS-001', activo: true, status: 'ACTIVE', createdAt: '2026-10-05T12:00:00.000Z' },
  { id: 'USR-004', nombre: 'Ciudadano demo', email: 'ciudadano@alerta.bo', rol: 'CITIZEN', role: 'CITIZEN', institucionId: null, institutionId: null, activo: true, status: 'ACTIVE', createdAt: '2026-10-06T14:00:00.000Z' },
]

