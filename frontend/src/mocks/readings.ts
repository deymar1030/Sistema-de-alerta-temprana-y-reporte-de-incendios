import type { Reading } from '../types'

export const readingsMock: Reading[] = [
  { id_lectura: 'L-001', id_sensor: 'S-001', sensor: 'Sensor de temperatura A1', variable: 'temperatura', valor: 24.1, unidad: '°C', fecha_hora: '2026-09-08T09:00:00', estado: 'Normal', riesgo: 'normal' },
  { id_lectura: 'L-002', id_sensor: 'S-001', sensor: 'Sensor de temperatura A1', variable: 'temperatura', valor: 24.6, unidad: '°C', fecha_hora: '2026-09-08T09:05:00', estado: 'Normal', riesgo: 'normal' },
  { id_lectura: 'L-003', id_sensor: 'S-001', sensor: 'Sensor de temperatura A1', variable: 'temperatura', valor: 25.1, unidad: '°C', fecha_hora: '2026-09-08T09:10:00', estado: 'Normal', riesgo: 'normal' },
  { id_lectura: 'L-004', id_sensor: 'S-002', sensor: 'Sensor de humo B2', variable: 'humo', valor: 0.14, unidad: 'ppm', fecha_hora: '2026-09-08T09:00:00', estado: 'Normal', riesgo: 'normal' },
  { id_lectura: 'L-005', id_sensor: 'S-002', sensor: 'Sensor de humo B2', variable: 'humo', valor: 0.21, unidad: 'ppm', fecha_hora: '2026-09-08T09:05:00', estado: 'Advertencia', riesgo: 'warning' },
  { id_lectura: 'L-006', id_sensor: 'S-002', sensor: 'Sensor de humo B2', variable: 'humo', valor: 0.31, unidad: 'ppm', fecha_hora: '2026-09-08T09:10:00', estado: 'Advertencia', riesgo: 'warning' },
  { id_lectura: 'L-007', id_sensor: 'S-003', sensor: 'Sensor de CO C3', variable: 'co', valor: 5.3, unidad: 'ppm', fecha_hora: '2026-09-08T09:00:00', estado: 'Normal', riesgo: 'normal' },
  { id_lectura: 'L-008', id_sensor: 'S-003', sensor: 'Sensor de CO C3', variable: 'co', valor: 6.8, unidad: 'ppm', fecha_hora: '2026-09-08T09:05:00', estado: 'Advertencia', riesgo: 'warning' },
  { id_lectura: 'L-009', id_sensor: 'S-003', sensor: 'Sensor de CO C3', variable: 'co', valor: 8.2, unidad: 'ppm', fecha_hora: '2026-09-08T09:10:00', estado: 'Alerta', riesgo: 'high' },
  { id_lectura: 'L-010', id_sensor: 'S-004', sensor: 'Sensor de temperatura D4', variable: 'temperatura', valor: 36.2, unidad: '°C', fecha_hora: '2026-09-08T09:00:00', estado: 'Alerta', riesgo: 'high' },
  { id_lectura: 'L-011', id_sensor: 'S-004', sensor: 'Sensor de temperatura D4', variable: 'temperatura', valor: 39.5, unidad: '°C', fecha_hora: '2026-09-08T09:05:00', estado: 'Crítico', riesgo: 'critical' },
  { id_lectura: 'L-012', id_sensor: 'S-004', sensor: 'Sensor de temperatura D4', variable: 'temperatura', valor: 42.8, unidad: '°C', fecha_hora: '2026-09-08T09:10:00', estado: 'Crítico', riesgo: 'critical' },
]
