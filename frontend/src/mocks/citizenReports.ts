import type { CitizenReport } from '../types'

export const citizenReportsMock: CitizenReport[] = [
  {
    id: 'REP-001',
    descripcion: 'Se observa humo cerca de la avenida.',
    ubicacion: 'Av. Busch, La Paz',
    latitud: -16.508,
    longitud: -68.121,
    status: 'PENDIENTE_DE_VALIDACION',
    createdAt: '2026-09-13T14:05:00-04:00',
    factores: ['humo visible'],
    address: 'Av. Busch, La Paz',
    reference: 'Frente a la estación de servicio',
    photo: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'REP-002',
    descripcion: 'Maleza seca comenzó a arder cerca del barrio.',
    ubicacion: 'Calle 10, Cochabamba',
    latitud: -17.38,
    longitud: -66.17,
    status: 'EN_REVISION',
    createdAt: '2026-09-15T10:05:00-04:00',
    factores: ['humo visible', 'temperatura elevada'],
    address: 'Calle 10, Cochabamba',
    reference: 'A unos metros del parque',
  },
]