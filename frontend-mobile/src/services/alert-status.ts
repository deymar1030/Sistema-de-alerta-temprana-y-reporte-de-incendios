import type { AlertStatus, EnvioEstado, IncidentStatus } from '../types'

const ENVIO_ESTADOS: EnvioEstado[] = ['ENVIADA', 'RECIBIDA', 'ATENDIDA', 'CERRADA']

// `mi_envio.estado` es el estado de la institución del operativo (tabla `envia`).
// `alerta.estado` es el estado global y NO sirve para decidir qué acción corresponde.
export const parseEnvioEstado = (miEnvio: any): EnvioEstado | null => {
  const estado = String(miEnvio?.estado ?? '').trim().toUpperCase()
  return (ENVIO_ESTADOS as string[]).includes(estado) ? (estado as EnvioEstado) : null
}

const statusFromEnvio: Record<EnvioEstado, IncidentStatus> = {
  ENVIADA: 'NUEVA',
  RECIBIDA: 'RECIBIDA',
  ATENDIDA: 'EN_CAMINO',
  CERRADA: 'FINALIZADA',
}

// Solo se usa el estado global como respaldo cuando la alerta no trae `mi_envio`.
const statusFromGlobal = (estadoGlobal: string): IncidentStatus => {
  if (estadoGlobal === 'CERRADA' || estadoGlobal === 'FINALIZADA') return 'FINALIZADA'
  if (estadoGlobal === 'ATENDIDA') return 'EN_CAMINO'
  return 'NUEVA'
}

export const resolveStatus = (envio: EnvioEstado | null, estadoGlobal: string): IncidentStatus & AlertStatus =>
  envio ? statusFromEnvio[envio] : statusFromGlobal(estadoGlobal)

export const envioLabel = (envio: EnvioEstado | null | undefined, fallback: string): string => envio ?? fallback
