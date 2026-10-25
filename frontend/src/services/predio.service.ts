
import { apiFetch } from './http'

/**
 * El backend administra id_motordet.
 * El frontend solo lo lee cuando existe;
 * nunca lo envía al crear o editar predios.
 */

export interface PredioMapEntry {
  id_predio: string
  nombre: string
  tipo_predio: string
  latitud: number
  longitud: number
  irp: number
}

export interface PredioDetail {
  id_predio: string
  id_zona: string
  id_motordet: string
  tipo_predio: string
  nombre: string
  direccion: string
  latitud: number | null
  longitud: number | null
  fecha_evaluacion: string | null
  irp: number | null
  estado_electrico: number | null
  estado_gas: number | null
  fuentes_calor: number | null
  carga_combustible: number | null
  material_construccion: number | null
  ocupacion: number | null
  nivel_proteccion: number | null
  activo: boolean | null
  sensores: unknown[]
}

export interface CreatePredioInput {
  id_zona: number
  nombre: string
  tipo_predio?: string
  direccion?: string
  latitud?: number
  longitud?: number
  contrasena_mqtt?: string
  fecha_evaluacion?: string
  estado_electrico?: number
  estado_gas?: number
  fuentes_calor?: number
  carga_combustible?: number
  material_construccion?: number
  ocupacion?: number
  nivel_proteccion?: number
}

export type UpdatePredioInput = Partial<CreatePredioInput>

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new Error(
      'El backend devolvio datos de predio invalidos.'
    )
  }

  return value as ApiRecord
}

function asText(value: unknown): string {
  return value === null || value === undefined
    ? ''
    : String(value)
}

function asNumberOrNull(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  const numeric = Number(value)

  return Number.isFinite(numeric) ? numeric : null
}

function mapPredio(value: unknown): PredioDetail {
  const raw = asRecord(value)
  const id = asText(raw.id_predio)

  if (!id) {
    throw new Error(
      'Un predio recibido no tiene id_predio.'
    )
  }

  return {
    id_predio: id,
    id_zona: asText(raw.id_zona),
    id_motordet: asText(raw.id_motordet),
    tipo_predio: asText(raw.tipo_predio),
    nombre: asText(raw.nombre),
    direccion: asText(raw.direccion),
    latitud: asNumberOrNull(raw.latitud),
    longitud: asNumberOrNull(raw.longitud),
    fecha_evaluacion:
      raw.fecha_evaluacion == null
        ? null
        : String(raw.fecha_evaluacion),
    irp: asNumberOrNull(raw.irp),
    estado_electrico: asNumberOrNull(raw.estado_electrico),
    estado_gas: asNumberOrNull(raw.estado_gas),
    fuentes_calor: asNumberOrNull(raw.fuentes_calor),
    carga_combustible: asNumberOrNull(
      raw.carga_combustible
    ),
    material_construccion: asNumberOrNull(
      raw.material_construccion
    ),
    ocupacion: asNumberOrNull(raw.ocupacion),
    nivel_proteccion: asNumberOrNull(
      raw.nivel_proteccion
    ),
    activo:
      typeof raw.activo === 'boolean'
        ? raw.activo
        : null,
    sensores: Array.isArray(raw.sensores)
      ? raw.sensores
      : [],
  }
}

function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }

  const raw = asRecord(value)

  if (Array.isArray(raw.items)) {
    return raw.items
  }

  throw new Error(
    'El backend no devolvio un listado valido de predios.'
  )
}

/**
 * Protección adicional:
 * nunca permitir el envío accidental de id_motordet.
 */
function withoutManagedFields(
  input: CreatePredioInput | UpdatePredioInput
): CreatePredioInput | UpdatePredioInput {
  const safe = { ...input } as Record<string, unknown>

  delete safe.id_motordet

  return safe as CreatePredioInput | UpdatePredioInput
}

export const predioService = {
  async getPredios(): Promise<PredioDetail[]> {
    const data = await apiFetch<unknown>('/predios')

    return asList(data).map(mapPredio)
  },

  async getPredioById(
    id: string
  ): Promise<PredioDetail> {
    const data = await apiFetch<unknown>(
      `/predios/${encodeURIComponent(id)}`
    )

    return mapPredio(data)
  },

  async getMapPredios(): Promise<PredioMapEntry[]> {
    const data = await apiFetch<unknown>('/predios/mapa')

    return asList(data)
      .map(mapPredio)
      .filter(
        (predio) =>
          predio.latitud !== null &&
          predio.longitud !== null &&
          predio.irp !== null
      )
      .map((predio) => ({
        id_predio: predio.id_predio,
        nombre: predio.nombre,
        tipo_predio: predio.tipo_predio,
        latitud: predio.latitud!,
        longitud: predio.longitud!,
        irp: predio.irp!,
      }))
  },

  async createPredio(
    input: CreatePredioInput
  ): Promise<PredioDetail> {
    const data = await apiFetch<unknown>('/predios', {
      method: 'POST',
      body: JSON.stringify(withoutManagedFields(input)),
    })

    return mapPredio(data)
  },

  async updatePredio(
    id: string,
    input: UpdatePredioInput
  ): Promise<PredioDetail> {
    const data = await apiFetch<unknown>(
      `/predios/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(withoutManagedFields(input)),
      }
    )

    // Si PUT confirma sin devolver el objeto completo,
    // consultamos el detalle actualizado.
    if (
      data &&
      typeof data === 'object' &&
      'id_predio' in data
    ) {
      return mapPredio(data)
    }

    return this.getPredioById(id)
  },

  async deletePredio(id: string): Promise<void> {
    await apiFetch(
      `/predios/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    )
  },
}
