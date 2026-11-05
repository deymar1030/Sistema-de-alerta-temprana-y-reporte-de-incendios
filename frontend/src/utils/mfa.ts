export type MfaState = 'CONFIGURACION_REQUERIDA' | 'VERIFICACION_REQUERIDA'
export interface MfaEnrollment { secreto: string; uri: string }

export function readMfaState(payload: unknown): MfaState | null {
  if (!payload || typeof payload !== 'object') throw new Error('Respuesta de autenticación inválida.')
  const envelope = payload as { success?: boolean; mfa?: { estado?: unknown } | null }
  if (envelope.mfa == null) return null
  if (envelope.success !== true) throw new Error('No se pudo iniciar la verificación de la cuenta.')
  const state = envelope.mfa.estado
  if (state !== 'CONFIGURACION_REQUERIDA' && state !== 'VERIFICACION_REQUERIDA') {
    throw new Error('El servidor devolvió un estado MFA no reconocido. Inicia sesión nuevamente.')
  }
  return state
}

export function readMfaEnrollment(data: unknown): MfaEnrollment {
  if (!data || typeof data !== 'object') throw new Error('No se pudo obtener la configuración del autenticador.')
  const { secreto, uri } = data as Partial<MfaEnrollment>
  if (typeof secreto !== 'string' || !/^[A-Z2-7]+=*$/i.test(secreto) || typeof uri !== 'string') {
    throw new Error('La configuración del autenticador no es válida.')
  }
  let parsed: URL
  try { parsed = new URL(uri) } catch { throw new Error('La configuración del autenticador no es válida.') }
  if (parsed.protocol !== 'otpauth:' || parsed.hostname !== 'totp' || parsed.searchParams.get('secret') !== secreto) {
    throw new Error('La configuración del autenticador no coincide con la clave recibida.')
  }
  return { secreto, uri }
}

export function isMfaCode(code: string) { return /^\d{6}$/.test(code) }
