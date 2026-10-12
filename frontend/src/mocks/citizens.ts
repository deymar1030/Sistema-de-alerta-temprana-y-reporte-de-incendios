export interface CitizenMock {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  role: 'CITIZEN'
  status: 'ACTIVE'
  createdAt: string
}

export const citizensMock: CitizenMock[] = [
  {
    id: 'CIT-001',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@email.com',
    phone: '76543210',
    city: 'La Paz',
    role: 'CITIZEN',
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'CIT-002',
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana@email.com',
    phone: '71234567',
    city: 'Santa Cruz',
    role: 'CITIZEN',
    status: 'ACTIVE',
    createdAt: '2026-10-02T09:30:00.000Z',
  },
  {
    id: 'CIT-003',
    firstName: 'Marco',
    lastName: 'López',
    email: 'marco@email.com',
    phone: '79876543',
    city: 'Cochabamba',
    role: 'CITIZEN',
    status: 'ACTIVE',
    createdAt: '2026-10-03T11:15:00.000Z',
  },
]
