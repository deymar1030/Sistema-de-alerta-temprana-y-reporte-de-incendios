import type { LocationEntry } from '../types'

export const locationsMock: LocationEntry[] = [
  {
    id_ubicacion: 'LOC-001',
    departamento: 'La Paz',
    municipio: 'La Paz',
    zona: 'Edificio de demostración',
    descripcion: 'Centro de operaciones del sistema de monitoreo.',
    sensores_instalados: 10,
    nivel_riesgo: 'normal',
  },
  {
    id_ubicacion: 'LOC-002',
    departamento: 'La Paz',
    municipio: 'La Paz',
    zona: 'Oficina 2',
    descripcion: 'Área administrativa con monitoreo de humo y temperatura.',
    sensores_instalados: 6,
    nivel_riesgo: 'warning',
  },
  {
    id_ubicacion: 'LOC-003',
    departamento: 'La Paz',
    municipio: 'La Paz',
    zona: 'Nave de almacenamiento',
    descripcion: 'Espacio de almacenamiento con detección de CO y gases.',
    sensores_instalados: 8,
    nivel_riesgo: 'high',
  },
  {
    id_ubicacion: 'LOC-004',
    departamento: 'La Paz',
    municipio: 'La Paz',
    zona: 'Panel eléctrico',
    descripcion: 'Zona crítica por riesgo térmico y servicio crítico.',
    sensores_instalados: 4,
    nivel_riesgo: 'critical',
  },
]
