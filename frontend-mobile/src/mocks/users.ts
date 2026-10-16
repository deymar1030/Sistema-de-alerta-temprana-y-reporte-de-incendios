import type { User } from '../types'

export const demoUsers: User[] = [
  {
    id: 'inst-user-1',
    name: 'María Rojas',
    role: 'INSTITUTION_USER',
    institutionName: 'Bomberos La Paz',
    roleLabel: 'Usuario de Institución',
  },
  {
    id: 'citizen-1',
    name: 'Ana Quispe',
    role: 'CITIZEN',
    roleLabel: 'Ciudadano',
  },
]

export const institutionDemoUser = demoUsers[0]
export const citizenDemoUser = demoUsers[1]
