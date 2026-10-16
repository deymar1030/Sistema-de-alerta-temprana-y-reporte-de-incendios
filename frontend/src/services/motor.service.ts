const API_URL =
  import.meta.env.VITE_API_URL ?? '/api'

export interface MotorParametroVariable {
  id_parametro_variable: number
  tipo_variable: string
  umbral_critico: number
}

export interface MotorDeteccion {
  id_motordet: number
  ventana_base_min: number
  umbral_z: number
  cusum_h: number
  umbral_confirmacion: number
  umbral_descarte: number
  tiempo_max_evaluacion_min: number
  radio_vecindad_m: number
  parametro_variable: MotorParametroVariable[]
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  code?: string
}

const request = async <T>(
  url: string,
): Promise<T> => {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error(
      'La sesión ha expirado. Inicia sesión nuevamente.',
    )
  }

  const result =
    (await response.json()) as ApiResponse<T>

  if (!response.ok || !result.success) {
    throw new Error(
      result.error ??
        'No fue posible obtener los motores de detección.',
    )
  }

  return result.data
}

export const motorService = {
  async getMotors(): Promise<
    MotorDeteccion[]
  > {
    return request<MotorDeteccion[]>(
      `${API_URL}/motores-deteccion`,
    )
  },

  async getMotorById(
    id: string | number,
  ): Promise<MotorDeteccion> {
    return request<MotorDeteccion>(
      `${API_URL}/motores-deteccion/${id}`,
    )
  },
}