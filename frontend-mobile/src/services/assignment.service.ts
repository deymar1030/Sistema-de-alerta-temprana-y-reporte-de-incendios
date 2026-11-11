import { API_URL } from './api'
import { sessionService } from './session.service'

export interface Assignment {
  id_alerta: string
  fecha_asignacion: string | null
}

export const assignmentService = {
  // Alertas asignadas al OPERATIVO autenticado (GET /notificaciones/asignaciones).
  // Nunca lanza: para otros roles o ante cualquier fallo devuelve [] y no frena otras cargas.
  async getAsignaciones(): Promise<Assignment[]> {
    try {
      if (!(await sessionService.isOperativo())) return []

      const response = await fetch(`${API_URL}/notificaciones/asignaciones`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) return []

      const json = await response.json()
      const lista = Array.isArray(json) ? json : json?.data
      if (!Array.isArray(lista)) return []

      return lista
        .filter((item: any) => item?.id_alerta != null)
        .map((item: any) => ({
          id_alerta: String(item.id_alerta),
          fecha_asignacion: item.fecha_asignacion ?? null,
        }))
    } catch (error) {
      console.error('Error al obtener las asignaciones', error)
      return []
    }
  },

  async getIdsAsignados(): Promise<Set<string>> {
    const asignaciones = await this.getAsignaciones()
    return new Set(asignaciones.map((item) => item.id_alerta))
  },
}
