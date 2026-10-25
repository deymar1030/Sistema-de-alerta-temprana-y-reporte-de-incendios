import type { Institution } from '../types'
import { apiFetch } from './http'

// Catálogo confirmado por el backend. No incluir SALUD ni otros valores no documentados.
export const INSTITUTION_CATEGORIES = [
  'BOMBEROS',
  'POLICIA',
  'DEFENSA_CIVIL',
  'RESCATE',
  'OTRA',
] as const

export type InstitutionCategory = (typeof INSTITUTION_CATEGORIES)[number]

// Nombre y categoría son obligatorios. Los demás campos son opcionales.
export interface InstitutionInput {
  nombre: string
  categoria: InstitutionCategory
  direccion?: string
  telefono_ins?: string
  razon_social?: string
  detalle?: string
  latitud?: number
  longitud?: number
}

interface ApiInstitution {
  id_institucion: string | number
  categoria?: string | null
  detalle?: string | null
  nombre: string
  razon_social?: string | null
  direccion?: string | null
  telefono_ins?: string | null
  latitud?: number | string | null
  longitud?: number | string | null
  estado?: boolean | number | string | null
  disponibilidad_operativa?: string | null
}

const mapAvailability = (value: string | null | undefined): Institution['disponibilidad'] => {
  if (value === 'DISPONIBLE') return 'DISPONIBLE'
  if (value === 'OCUPADA' || value === 'ATENDIENDO') return 'ATENDIENDO'
  return 'NO_DISPONIBLE'
}

const isActive = (value: ApiInstitution['estado']): boolean =>
  value !== false && value !== 0 && value !== 'false' && value !== 'INACTIVA'

function mapInstitution(item: ApiInstitution): Institution {
  if (!item || item.id_institucion == null || typeof item.nombre !== 'string') {
    throw new Error('El backend devolvió una institución sin identificador o nombre válido.')
  }
  return {
    id: String(item.id_institucion),
    nombre: item.nombre,
    tipo: item.categoria ?? 'SIN_CATEGORIA',
    direccion: item.direccion || 'Sin dirección',
    latitud: item.latitud == null ? NaN : Number(item.latitud),
    longitud: item.longitud == null ? NaN : Number(item.longitud),
    telefono: item.telefono_ins ?? '',
    estado: isActive(item.estado) ? 'ACTIVA' : 'INACTIVA',
    disponibilidad: mapAvailability(item.disponibilidad_operativa),
    distanciaDemo: 0, // Propiedad de compatibilidad; no representa distancia real.
    razonSocial: item.razon_social ?? '',
    detalle: item.detalle ?? '',
  }
}

function ensureList(data: unknown): ApiInstitution[] {
  if (!Array.isArray(data)) {
    throw new Error('El backend no devolvió un arreglo de instituciones.')
  }
  return data as ApiInstitution[]
}

// Evita enviar cadenas vacías o coordenadas incompletas al backend.
function buildPayload(input: InstitutionInput): InstitutionInput {
  const nombre = input.nombre.trim()
  if (!nombre) throw new Error('Ingresa el nombre de la institución.')
  if (!INSTITUTION_CATEGORIES.includes(input.categoria)) {
    throw new Error('Selecciona una categoría válida.')
  }

  const payload: InstitutionInput = { nombre, categoria: input.categoria }
  const optionalFields = ['direccion', 'telefono_ins', 'razon_social', 'detalle'] as const
  for (const field of optionalFields) {
    const value = input[field]?.trim()
    if (value) payload[field] = value
  }

  const hasLat = input.latitud !== undefined
  const hasLng = input.longitud !== undefined
  if (hasLat !== hasLng) {
    throw new Error('Debes ingresar latitud y longitud juntas, o dejar ambas vacías.')
  }
  if (hasLat && hasLng) {
    const latitud = input.latitud!
    const longitud = input.longitud!
    if (!Number.isFinite(latitud) || latitud < -90 || latitud > 90 ||
        !Number.isFinite(longitud) || longitud < -180 || longitud > 180) {
      throw new Error('Las coordenadas están fuera del rango permitido.')
    }
    payload.latitud = latitud
    payload.longitud = longitud
  }
  return payload
}

export const institutionService = {
  async getInstitutions(): Promise<Institution[]> {
    const data = await apiFetch<unknown>('/instituciones')
    return ensureList(data).map(mapInstitution)
  },

  async getNearby(): Promise<Institution[]> {
    // Compatibilidad: esto NO es un cálculo de cercanía geográfica.
    const institutions = await this.getInstitutions()
    return institutions.filter((institution) => institution.estado === 'ACTIVA')
  },

  async createInstitution(input: InstitutionInput): Promise<void> {
    await apiFetch('/instituciones', {
      method: 'POST',
      body: JSON.stringify(buildPayload(input)),
    })
  },

  async updateInstitution(id: string, input: InstitutionInput): Promise<void> {
    if (!id.trim()) throw new Error('No se encontró el identificador de la institución.')
    await apiFetch(`/instituciones/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(buildPayload(input)),
    })
  },
}