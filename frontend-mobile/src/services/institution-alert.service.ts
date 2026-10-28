import type { AlertItem, AlertStatus, IncidentStatus, RiskLevel } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'https://alertaincendios.duckdns.org/api'

// Obtenemos dinámicamente el ID usando la cookie de sesión
const getInstitutionId = async () => {
  const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' })
  const json = await res.json()
  return json.data?.id_institucion || 1
}

const mapStatus = (estadoBackend: string): AlertStatus => {
  if (estadoBackend === 'CONFIRMADA') return 'NUEVA'
  if (estadoBackend === 'RECIBIDA') return 'RECIBIDA'
  if (estadoBackend === 'ATENDIDA' || estadoBackend === 'EN_CURSO') return 'EN_CAMINO'
  if (estadoBackend === 'CERRADA' || estadoBackend === 'FINALIZADA') return 'FINALIZADA'
  return 'NUEVA'
}

export const institutionAlertService = {
  getInitialAlerts(): AlertItem[] {
    return []
  },

  async getAlerts(): Promise<AlertItem[]> {
    try {
      const response = await fetch(`${API_URL}/alertas`, {
        method: 'GET',
        credentials: 'include' // <- Esto envía la cookie automáticamente
      })

      if (!response.ok) return []

      const json = await response.json()
      if (!json.success) return []

      return json.data.map((item: any) => ({
        id: String(item.id_alerta),
        incidentId: String(item.id_alerta),
        type: item.clasificacion || 'INCENDIO',
        location: 'Ubicación de alerta',
        risk: (item.puntaje > 0.8 ? 'CRITICO' : 'ALTO') as RiskLevel,
        status: mapStatus(item.estado),
        createdAt: item.fecha_confirmacion || new Date().toISOString(),
        description: `Alerta detectada con puntaje ${item.puntaje}`,
        institutionId: '1',
        distanceKm: 0,
        source: 'sensor'
      }))
    } catch (error) {
      console.error('Error en getAlerts:', error)
      return []
    }
  },

  async updateStatus(id: string, status: AlertStatus): Promise<AlertItem | undefined> {
    if (status === 'RECIBIDA') {
      const instId = await getInstitutionId()
      await fetch(`${API_URL}/alertas/${id}/instituciones/${instId}/recibir`, {
        method: 'PATCH',
        credentials: 'include'
      })
    }
    const alertas = await this.getAlerts()
    return alertas.find(a => a.id === id)
  },

  async updateByIncidentId(incidentId: string, status: IncidentStatus): Promise<AlertItem | undefined> {
    return this.updateStatus(incidentId, status as AlertStatus)
  },
}