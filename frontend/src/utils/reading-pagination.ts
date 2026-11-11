export interface ReadingFilters {
  id_predio?: string
  id_sensor?: string
  tipo_variable?: string
  estado_lectura?: string
}

export function readingQuery(page: number, pageSize: number, filters: ReadingFilters = {}) {
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new Error('La página y su tamaño deben ser números enteros positivos.')
  }
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  for (const key of ['id_predio', 'id_sensor', 'tipo_variable', 'estado_lectura'] as const) {
    const value = filters[key]?.trim()
    if (value) query.set(key, value)
  }
  return query
}

export function readingPagination(data: { total: unknown; page: unknown; pageSize: unknown }, itemCount: number) {
  const number = (value: unknown) => typeof value === 'number' || (typeof value === 'string' && value.trim()) ? Number(value) : NaN
  const total = number(data.total)
  const page = number(data.page)
  const pageSize = number(data.pageSize)
  if (!Number.isSafeInteger(total) || total < 0 || !Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || itemCount > pageSize || itemCount > total) {
    throw new Error('El servidor devolvió datos de paginación inválidos. Vuelve a consultar las lecturas.')
  }
  return { total, page, pageSize }
}
