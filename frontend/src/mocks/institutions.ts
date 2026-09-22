import type { Institution } from '../types'

export const institutionsMock: Institution[] = [
  { id: 'INS-001', nombre: 'Bomberos de la Policía Boliviana', tipo: 'Bomberos', direccion: 'Av. Camacho, La Paz', latitud: -16.499, longitud: -68.130, telefono: '119', estado: 'ACTIVA', disponibilidad: 'DISPONIBLE', distanciaDemo: 1.2 },
  { id: 'INS-002', nombre: 'Policía Boliviana', tipo: 'Policía', direccion: 'Calle Colombia, La Paz', latitud: -16.503, longitud: -68.126, telefono: '110', estado: 'ACTIVA', disponibilidad: 'DISPONIBLE', distanciaDemo: 1.8 },
  { id: 'INS-003', nombre: 'Defensa Civil', tipo: 'Defensa Civil', direccion: 'Av. Arce, La Paz', latitud: -16.510, longitud: -68.121, telefono: '119', estado: 'ACTIVA', disponibilidad: 'ATENDIENDO', distanciaDemo: 3.1 },
  { id: 'INS-004', nombre: 'SAR-FAB', tipo: 'Rescate', direccion: 'Zona Miraflores, La Paz', latitud: -16.511, longitud: -68.112, telefono: '118', estado: 'ACTIVA', disponibilidad: 'DISPONIBLE', distanciaDemo: 4.4 },
]

// Las distancias y disponibilidades son datos simulados para demostración.