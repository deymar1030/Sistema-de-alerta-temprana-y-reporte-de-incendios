import type { User, UserRole } from '../types'

export const usersMock: User[] = [
  { id: 'USR-001', nombre: 'Operador principal', email: 'operador@alerta.bo', rol: 'CENTRAL_OPERATOR', institucionId: null },
  { id: 'USR-002', nombre: 'Administradora Bomberos', email: 'admin.bomberos@alerta.bo', rol: 'INSTITUTION_ADMIN', institucionId: 'INS-001' },
  { id: 'USR-003', nombre: 'Personal operativo', email: 'operativo@alerta.bo', rol: 'INSTITUTION_USER', institucionId: 'INS-001' },
  { id: 'USR-004', nombre: 'Ciudadano demo', email: 'ciudadano@alerta.bo', rol: 'CITIZEN', institucionId: null },
]

export const roleLabels: Record<UserRole, string> = {
  CENTRAL_OPERATOR: 'Operador Central',
  INSTITUTION_ADMIN: 'Admin Institución',
  INSTITUTION_USER: 'Usuario Institución',
  CITIZEN: 'Ciudadano',
}