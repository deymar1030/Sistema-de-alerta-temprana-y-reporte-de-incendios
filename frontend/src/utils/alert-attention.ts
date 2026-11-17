import type { AttendingInstitution } from '../services/backend-alerts.service'

// "En atención" = alguna institución ya asignó operativos (mismo criterio que el aviso al ciudadano).
export function enAtencion(alert: { en_atencion?: boolean; atendida_por?: AttendingInstitution[] }): boolean {
  return Boolean(alert.en_atencion ?? alert.atendida_por?.length)
}

// "Bomberos La Paz (2 operativos), FELCC (1 operativo)"
export function describirAtencion(atendidaPor: AttendingInstitution[] = []): string {
  return atendidaPor
    .map(item => `${item.nombre ?? `Institución #${item.id_institucion}`} (${item.operativos} ${item.operativos === 1 ? 'operativo' : 'operativos'})`)
    .join(', ')
}
