import { apiFetch } from './http'

export interface InstitutionOperative {
  id_usuario: string
  id_institucion: string | null
  nombre: string
  telefono: string | null
  correo: string | null
  estado: boolean
  disponible: boolean
  id_alerta_asignada: string | null
}

interface OperativeResponse {
  id_usuario: number | string
  id_institucion?: number | string | null
  nombre?: string | null
  telefono?: string | null
  correo?: string | null
  estado?: boolean
  disponible?: boolean
  id_alerta_asignada?: number | string | null
}

/** El backend filtra los OPERATIVO activos segun la sesion del JEFE_INSTITUCION. */
export const operativeAssignmentService = {
  async getOperatives(): Promise<InstitutionOperative[]> {
    const value = await apiFetch<unknown>('/usuarios/operativos')
    if (!Array.isArray(value)) throw new Error('El backend no devolvio una lista de operativos.')
    return value.map((row: OperativeResponse) => {
      if (!row || row.id_usuario == null) throw new Error('El backend devolvio un operativo sin ID.')
      return {
        id_usuario: String(row.id_usuario),
        id_institucion: row.id_institucion == null ? null : String(row.id_institucion),
        nombre: String(row.nombre ?? `Usuario #${row.id_usuario}`),
        telefono: row.telefono ?? null,
        correo: row.correo ?? null,
        estado: row.estado === true,
        // Si la API no confirma disponibilidad, no permitir asignacion a ciegas.
        disponible: row.disponible === true,
        id_alerta_asignada: row.id_alerta_asignada == null ? null : String(row.id_alerta_asignada),
      }
    })
  },

  async assign(alertId: string, operativeIds: string[]): Promise<void> {
    const id = Number(alertId)
    const ids = [...new Set(operativeIds.map(Number))]
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('ID de alerta invalido.')
    if (!ids.length || ids.some(value => !Number.isSafeInteger(value) || value <= 0)) {
      throw new Error('Selecciona operativos validos para asignar.')
    }
    await apiFetch('/notificaciones/asignaciones', {
      method: 'POST',
      body: JSON.stringify({ id_alerta: id, id_usuarios: ids }),
    })
  },
}
