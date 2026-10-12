import type { Institution } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

interface ApiInstitution {
  id_institucion: string
  categoria: string
  detalle: string | null
  nombre: string
  razon_social: string | null
  direccion: string
  telefono_ins: string
  latitud: number
  longitud: number
  estado: boolean
  disponibilidad_operativa: string
}

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('alerta_token')
}

const mapAvailability = (value: string): Institution['disponibilidad'] => {
  switch (value) {
    case 'DISPONIBLE':
      return 'DISPONIBLE'
    case 'OCUPADA':
    case 'ATENDIENDO':
      return 'ATENDIENDO'
    default:
      return 'NO_DISPONIBLE'
  }
}

const mapInstitution = (institution: ApiInstitution): Institution => ({
  id: institution.id_institucion,
  nombre: institution.nombre,
  tipo: institution.categoria,
  direccion: institution.direccion,
  latitud: Number(institution.latitud),
  longitud: Number(institution.longitud),
  telefono: institution.telefono_ins,
  estado: institution.estado ? 'ACTIVA' : 'INACTIVA',
  disponibilidad: mapAvailability(institution.disponibilidad_operativa),
  distanciaDemo: 0,
})

const requestInstitutions = async (): Promise<Institution[]> => {
  const token = getStoredToken()
  const response = await fetch(`${API_URL}/instituciones`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (response.status === 401) {
    throw new Error('La sesión ha expirado. Inicia sesión nuevamente.')
  }

  const result: { success?: boolean; data?: ApiInstitution[]; error?: string } = await response.json().catch(() => ({}))

  if (!response.ok || result.success === false) {
    throw new Error(result.error ?? 'No se pudieron obtener las instituciones.')
  }

  const institutions = Array.isArray(result.data) ? result.data : []
  return institutions.map(mapInstitution)
}

export const institutionService = {
  async getInstitutions(): Promise<Institution[]> {
    return requestInstitutions()
  },

  async getNearby(): Promise<Institution[]> {
    const institutions = await requestInstitutions()
    return institutions.filter((institution) => institution.estado === 'ACTIVA')
  },
}