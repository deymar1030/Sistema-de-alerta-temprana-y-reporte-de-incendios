export const API_URL = import.meta.env.VITE_API_URL || 'https://alertaincendios.duckdns.org/api'

// El backend responde { success: false, error: '<mensaje>' }; algunos errores usan `message`.
export const readBackendError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const json = await response.json()
    const message = json?.error ?? json?.message
    if (typeof message === 'string' && message.trim()) return message
  } catch {
    // cuerpo vacío o no JSON: se usa el mensaje por defecto
  }
  return fallback
}
