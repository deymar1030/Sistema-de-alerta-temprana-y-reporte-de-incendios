
import { apiFetch } from './http'

export type InformeEstado = 'BORRADOR' | 'COMPLETADO'

export const INFORME_ESTADOS: readonly InformeEstado[] = [
  'BORRADOR',
  'COMPLETADO',
]

export interface InformeAtencion {
  id_informe_atencion: string
  id_alerta: string
  id_institucion: string
  id_usuario: string
  estado: string
  fecha_incidente: string | null
  hora_recepcion: string | null
  hora_salida: string | null
  hora_llegada: string | null
  hora_control: string | null
  hora_finalizacion: string | null
  personal: number | null
  vehiculos: number | null
  personas_afectadas: number | null
  personas_evacuadas: number | null
  heridos: number | null
  fallecidos: number | null
  danos_materiales: string | null
  causa: string | null
  acciones: string | null
  observaciones: string | null
  recomendaciones: string | null
  fecha_envio: string | null
}

export interface InformeCampos {
  estado?: InformeEstado
  fecha_incidente?: string
  hora_recepcion?: string
  hora_salida?: string
  hora_llegada?: string
  hora_control?: string
  hora_finalizacion?: string
  personal?: number
  vehiculos?: number
  personas_afectadas?: number
  personas_evacuadas?: number
  heridos?: number
  fallecidos?: number
  danos_materiales?: string
  causa?: string
  acciones?: string
  observaciones?: string
  recomendaciones?: string
}

export type CreateAttentionReportInput = {
  id_alerta: string
  id_institucion: string
  id_usuario: string
} & InformeCampos

export type UpdateAttentionReportInput = InformeCampos

function asRecord(value: unknown): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new Error(
      'La API devolvió un informe con formato inesperado.'
    )
  }

  return value as Record<string, unknown>
}

function requiredId(value: unknown, label: string): string {
  const id = String(value ?? '').trim()

  if (!id) {
    throw new Error(`El informe no incluye ${label}.`)
  }

  return id
}

function textOrNull(value: unknown): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  if (
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    throw new Error(
      'La API devolvió un campo de texto inválido.'
    )
  }

  return String(value)
}

function numberOrNull(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  if (
    (typeof value !== 'number' &&
      typeof value !== 'string') ||
    !Number.isFinite(Number(value))
  ) {
    throw new Error(
      'La API devolvió un valor numérico inválido.'
    )
  }

  return Number(value)
}

function mapReport(value: unknown): InformeAtencion {
  const r = asRecord(value)

  return {
    id_informe_atencion: requiredId(
      r.id_informe_atencion,
      'id_informe_atencion'
    ),

    id_alerta: requiredId(r.id_alerta, 'id_alerta'),

    id_institucion: requiredId(
      r.id_institucion,
      'id_institucion'
    ),

    id_usuario: requiredId(r.id_usuario, 'id_usuario'),

    // Conservar estados reales, incluso si son desconocidos.
    estado: String(r.estado ?? 'SIN_ESTADO'),

    fecha_incidente: textOrNull(r.fecha_incidente),
    hora_recepcion: textOrNull(r.hora_recepcion),
    hora_salida: textOrNull(r.hora_salida),
    hora_llegada: textOrNull(r.hora_llegada),
    hora_control: textOrNull(r.hora_control),
    hora_finalizacion: textOrNull(r.hora_finalizacion),

    personal: numberOrNull(r.personal),
    vehiculos: numberOrNull(r.vehiculos),
    personas_afectadas: numberOrNull(r.personas_afectadas),
    personas_evacuadas: numberOrNull(r.personas_evacuadas),
    heridos: numberOrNull(r.heridos),
    fallecidos: numberOrNull(r.fallecidos),

    danos_materiales: textOrNull(r.danos_materiales),
    causa: textOrNull(r.causa),
    acciones: textOrNull(r.acciones),
    observaciones: textOrNull(r.observaciones),
    recomendaciones: textOrNull(r.recomendaciones),

    fecha_envio: textOrNull(r.fecha_envio),
  }
}

export const reportService = {
  async getReports(): Promise<InformeAtencion[]> {
    const value = await apiFetch<unknown>(
      '/informes-atencion'
    )

    const rows = Array.isArray(value)
      ? value
      : (
          value && typeof value === 'object'
            ? (value as { items?: unknown }).items
            : undefined
        )

    if (!Array.isArray(rows)) {
      throw new Error(
        'El listado de informes no tiene el formato esperado.'
      )
    }

    return rows.map(mapReport)
  },

  async getReportById(
    id: string
  ): Promise<InformeAtencion> {
    const value = await apiFetch<unknown>(
      `/informes-atencion/${encodeURIComponent(id)}`
    )

    return mapReport(value)
  },

  async createReport(
    input: CreateAttentionReportInput
  ): Promise<string | null> {
    const value = await apiFetch<unknown>(
      '/informes-atencion',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    )

    if (value == null) {
      return null
    }

    const record = asRecord(value)
    const id = record.id_informe_atencion

    return id == null || String(id).trim() === ''
      ? null
      : String(id)
  },

  async updateReport(
    id: string,
    input: UpdateAttentionReportInput
  ): Promise<void> {
    await apiFetch(
      `/informes-atencion/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      }
    )
  },
}
