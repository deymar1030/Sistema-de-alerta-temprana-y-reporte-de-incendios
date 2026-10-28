import type { Incident, IncidentStatus, RiskLevel } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'https://alertaincendios.duckdns.org/api'

const getInstitutionId = async () => {
  const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' })
  const json = await res.json()
  return json.data?.id_institucion || 1
}

const mapStatus = (estadoBackend: string): IncidentStatus => {
  if (estadoBackend === 'CONFIRMADA') return 'NUEVA'
  if (estadoBackend === 'RECIBIDA') return 'RECIBIDA'
  if (estadoBackend === 'ATENDIDA') return 'EN_CAMINO'
  if (estadoBackend === 'CERRADA' || estadoBackend === 'FINALIZADA') return 'FINALIZADA'
  return 'NUEVA'
}

// Función que traduce coordenadas a calle. Tiene un try-catch para no romper nada si falla.
const obtenerDireccionReal = async (lat: number, lon: number): Promise<string> => {
  if (!lat || !lon) return 'Ubicación en mapa';
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'es' }
    });
    const data = await res.json();
    if (data && data.display_name) {
      // Cortamos para que no sea un texto gigante
      return data.display_name.split(',').slice(0, 3).join(', ');
    }
    return 'Ubicación en mapa';
  } catch (error) {
    return 'Ubicación en mapa';
  }
}

export const incidentService = {
  getInitialIncidents(): Incident[] {
    return []
  },

  async getIncidents(): Promise<Incident[]> {
    try {
      const response = await fetch(`${API_URL}/alertas/mapa`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) return []

      const json = await response.json()
      if (!json.success) return []

      const emergenciasMap = await Promise.all(json.data.map(async (item: any) => {
        const ubicacion = item.ubicaciones?.[0] || {}
        
        // CORRECCIÓN CLAVE: Forzar Number() para que el mapa Leaflet no explote
        const latitud = Number(ubicacion.latitud) || 0;
        const longitud = Number(ubicacion.longitud) || 0;
        
        let direccionFisica = ubicacion.nombre;
        if (!direccionFisica || direccionFisica.trim() === '') {
          direccionFisica = await obtenerDireccionReal(latitud, longitud);
        }

        return {
          id: String(item.id_alerta),
          title: item.clasificacion || 'Emergencia',
          status: mapStatus(item.estado),
          risk: 'ALTO' as RiskLevel,
          location: ubicacion.ubicacion_tipo || 'Punto de incendio',
          address: direccionFisica,
          description: 'Emergencia reportada y confirmada en el sistema.',
          institutionId: '1',
          institutionName: 'Mi Institución',
          createdAt: item.fecha && item.hora ? `${item.fecha}T${item.hora}` : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          distanceKm: 0,
          latitude: latitud,   // <--- Ahora siempre será un número válido para el mapa
          longitude: longitud, // <--- Ahora siempre será un número válido para el mapa
          timeline: []
        }
      }))

      return emergenciasMap;
    } catch (error) {
      console.error('Error en getIncidents:', error)
      return []
    }
  },

  async updateStatus(id: string, status: IncidentStatus): Promise<Incident | undefined> {
    try {
      const instId = await getInstitutionId()
      let endpoint = ''

      if (status === 'RECIBIDA') {
        endpoint = `${API_URL}/alertas/${id}/instituciones/${instId}/recibir`
      } else if (status === 'EN_CAMINO' || status === 'EN_SITIO' || status === 'CONTROLADA') {
        endpoint = `${API_URL}/alertas/${id}/instituciones/${instId}/atender`
      } else if (status === 'FINALIZADA') {
        endpoint = `${API_URL}/alertas/${id}/instituciones/${instId}/cerrar`
      }

      if (endpoint) {
        await fetch(endpoint, {
          method: 'PATCH',
          credentials: 'include'
        })
      }

      const emergencias = await this.getIncidents()
      return emergencias.find(e => e.id === id)

    } catch (error) {
      console.error('Error al actualizar el estado', error)
      return undefined
    }
  },
}