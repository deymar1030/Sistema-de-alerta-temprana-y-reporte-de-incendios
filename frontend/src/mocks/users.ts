import type { User } from '../types'
export { getRoleLabel } from '../types'

export const usersMock: User[] = [
  { id: 'USR-SA-001', nombre: 'Santiago Mejía', email: 'superadmin@alerta.bo', rol: 'ADMIN', role: 'ADMIN', institucionId: null, institutionId: null, activo: true, status: 'ACTIVE', createdAt: '2026-10-01T08:00:00.000Z' },
  { id: 'USR-SA-002', nombre: 'Carlos Pérez', email: 'carlos@alerta.com', rol: 'ADMIN', role: 'ADMIN', institucionId: null, institutionId: null, activo: true, status: 'ACTIVE', createdAt: '2026-10-02T09:00:00.000Z' },
  { id: 'USR-001', nombre: 'Operador principal', email: 'operador@alerta.bo', rol: 'OPERATIVO', role: 'OPERATIVO', institucionId: null, institutionId: null, activo: true, status: 'ACTIVE', createdAt: '2026-10-03T10:00:00.000Z' },
  { id: 'USR-002', nombre: 'Administradora Bomberos', email: 'admin.bomberos@alerta.bo', rol: 'JEFE_INSTITUCION', role: 'JEFE_INSTITUCION', institucionId: 'INS-001', institutionId: 'INS-001', activo: true, status: 'ACTIVE', createdAt: '2026-10-04T11:00:00.000Z' },
  { id: 'USR-003', nombre: 'Personal operativo', email: 'operativo@alerta.bo', rol: 'OPERATIVO', role: 'OPERATIVO', institucionId: 'INS-001', institutionId: 'INS-001', activo: true, status: 'ACTIVE', createdAt: '2026-10-05T12:00:00.000Z' },
  { id: 'USR-004', nombre: 'Ciudadano demo', email: 'ciudadano@alerta.bo', rol: 'CIUDADANO', role: 'CIUDADANO', institucionId: null, institutionId: null, activo: true, status: 'ACTIVE', createdAt: '2026-10-06T14:00:00.000Z' },
]

