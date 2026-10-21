export interface ImageDetectionResult {
  label: 'FIRE' | 'NO_FIRE'
  detected: boolean
  fire_probability: number
  no_fire_probability: number
  threshold: number
  warning: string | null
  filename?: string
}

const apiUrl = import.meta.env.VITE_IMAGE_DETECTION_API_URL ?? 'http://127.0.0.1:3000/api'

export const imageDetectionService = {
  async analyze(image: File): Promise<ImageDetectionResult> {
    const form = new FormData()
    form.append('image', image)

    let response: Response
    try {
      response = await fetch(`${apiUrl}/detections/image`, {
        method: 'POST',
        body: form,
      })
    } catch {
      throw new Error('No se pudo conectar con el servicio de detección.')
    }

    const payload: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const message =
        payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : 'No se pudo analizar la imagen.'
      throw new Error(message)
    }

    return payload as ImageDetectionResult
  },
}
