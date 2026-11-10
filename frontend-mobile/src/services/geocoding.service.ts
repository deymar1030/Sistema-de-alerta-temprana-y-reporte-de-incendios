const cache = new Map<string, string>()

// Dirección aproximada a partir de coordenadas. Solo se consulta bajo demanda
// (popup abierto / detalle) y se cachea para respetar el límite de Nominatim.
export const geocodingService = {
  async resolveAddress(latitude: number, longitude: number): Promise<string> {
    const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`
    const known = cache.get(key)
    if (known !== undefined) return known

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' }, signal: AbortSignal.timeout(5000) },
      )
      if (!response.ok) return ''
      const data = await response.json()
      const address = data?.display_name ? String(data.display_name).split(',').slice(0, 3).join(', ') : ''
      cache.set(key, address)
      return address
    } catch {
      return ''
    }
  },
}
