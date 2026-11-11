import { normalizeRole, normalizeStatus, type User } from '../types'
import { isMfaCode, readMfaEnrollment, readMfaState, type MfaState } from '../utils/mfa'

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

interface ApiUser {
  id_usuario?: string | number
  id?: string | number
  nombre?: string
  nombre_completo?: string
  primer_apellido?: string | null
  segundo_apellido?: string | null
  correo?: string
  email?: string
  telefono?: string | null
  phone?: string | null
  rol?: string | number | null
  role?: string | number | null
  id_rol?: string | number | null
  nombre_rol?: string | null
  id_institucion?: string | number | null
  institucionId?: string | number | null
  institutionId?: string | number | null
  estado?: boolean | number | string | null
  activo?: boolean | number | string | null
  status?: string | null
}

interface ApiEnvelope<T> {
  success?: boolean
  code?: string
  data?: T
  user?: T
  usuario?: T
  message?: string
  error?: string
}

const demoUsers: Array<{ email: string; password: string; user: User }> = [
  {
    email: 'superadmin@alerta.bo',
    password: 'Admin123',
    user: {
      id: 'USR-SA-001',
      nombre: 'Santiago Mejía',
      email: 'superadmin@alerta.bo',
      role: 'ADMIN',
      rol: 'ADMIN',
      institutionId: null,
      institucionId: null,
      activo: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  },
  {
    email: 'operador@alerta.bo',
    password: 'Admin123',
    user: {
      id: 'USR-001',
      nombre: 'Operador principal',
      email: 'operador@alerta.bo',
      role: 'OPERATIVO',
      rol: 'OPERATIVO',
      institutionId: null,
      institucionId: null,
      activo: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  },
  {
    email: 'admin.bomberos@alerta.bo',
    password: 'Admin123',
    user: {
      id: 'USR-002',
      nombre: 'Administradora Bomberos',
      email: 'admin.bomberos@alerta.bo',
      role: 'JEFE_INSTITUCION',
      rol: 'JEFE_INSTITUCION',
      institutionId: 'INS-001',
      institucionId: 'INS-001',
      activo: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  },
  {
    email: 'operativo@alerta.bo',
    password: 'Admin123',
    user: {
      id: 'USR-003',
      nombre: 'Personal operativo',
      email: 'operativo@alerta.bo',
      role: 'OPERATIVO',
      rol: 'OPERATIVO',
      institutionId: 'INS-001',
      institucionId: 'INS-001',
      activo: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  },
  {
    email: 'ciudadano@alerta.bo',
    password: 'Ciudadano123',
    user: {
      id: 'USR-004',
      nombre: 'Ciudadano demo',
      email: 'ciudadano@alerta.bo',
      role: 'CIUDADANO',
      rol: 'CIUDADANO',
      institutionId: null,
      institucionId: null,
      activo: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  },
]

const mapApiUserToUser = (payload: ApiUser | null | undefined): User | null => {
  if (!payload || typeof payload !== 'object') return null

  // El servidor expone nombre_rol desde su catálogo; evitar depender de un ID local.
  const roleValue = payload.nombre_rol ?? payload.rol ?? payload.role ?? (String(payload.id_rol) === '1' ? 'ADMIN' : null)
  if (roleValue === undefined || roleValue === null || roleValue === '') {
    throw new Error('El backend no devolvió nombre_rol ni un rol reconocible para este usuario.')
  }

  const role = normalizeRole(roleValue)
  if (payload.id_usuario == null && payload.id == null) throw new Error('El backend no devolvió el identificador del usuario.')
  const institutionId = payload.id_institucion ?? payload.institucionId ?? payload.institutionId ?? null
  const status = normalizeStatus(payload.status ?? payload.estado ?? payload.activo ?? 'ACTIVE')
  const firstName = String(payload.nombre ?? '').trim()
  const lastName = [payload.primer_apellido, payload.segundo_apellido].filter(Boolean).join(' ').trim()
  const nombre = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Usuario'
  const email = String(payload.correo ?? payload.email ?? '')

  return {
    id: String(payload.id_usuario ?? payload.id),
    nombre,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    primerApellido: payload.primer_apellido ?? undefined,
    segundoApellido: payload.segundo_apellido ?? undefined,
    email,
    role,
    rol: role,
    institutionId: institutionId === null || institutionId === undefined || institutionId === '' ? null : String(institutionId),
    institucionId: institutionId === null || institutionId === undefined || institutionId === '' ? null : String(institutionId),
    phone: payload.telefono ?? payload.phone ?? undefined,
    activo: status === 'ACTIVE',
    status,
    createdAt: new Date().toISOString(),
  }
}

const readBackendUser = (payload: unknown): User | null => {
  if (!payload || typeof payload !== 'object') return null

  const envelope = payload as ApiEnvelope<ApiUser>
  const maybe = envelope.data ?? envelope.user ?? envelope.usuario ?? null

  if (maybe) {
    return mapApiUserToUser(maybe as ApiUser)
  }

  return null
}

export type LoginResult = { kind: 'authenticated'; user: User } | { kind: 'mfa'; state: MfaState }

export class AuthHttpError extends Error {
  status: number
  code: string
  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'AuthHttpError'
    this.status = status
    this.code = code
  }
}

async function authRequest(path: string, body: object, signal?: AbortSignal): Promise<ApiEnvelope<unknown>> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST', credentials: 'include', cache: 'no-store', signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null) as ApiEnvelope<unknown> | null
  if (!response.ok || payload?.success !== true) {
    const message = typeof payload?.error === 'string' ? payload.error : typeof payload?.message === 'string' ? payload.message : 'No se pudo completar la autenticación.'
    throw new AuthHttpError(message, response.status, payload?.code ?? '')
  }
  return payload
}

export const authService = {
  async login(correo: string, contrasena: string): Promise<LoginResult> {
    // El modo demo es explícito: nunca convertir un rechazo real de MFA en acceso demo.
    if (USE_MOCKS) {
      const match = demoUsers.find(entry => entry.email.toLowerCase() === correo.trim().toLowerCase() && entry.password === contrasena)
      if (!match) throw new Error('Credenciales inválidas.')
      return { kind: 'authenticated', user: match.user }
    }
    const payload = await authRequest('/auth/login', { correo, contrasena })
    const state = readMfaState(payload)
    if (state) return { kind: 'mfa', state }
    const user = readBackendUser(payload)
    if (!user) throw new Error('El backend no devolvió un usuario válido.')
    return { kind: 'authenticated', user }
  },

  async configureMfa(signal?: AbortSignal) {
    const payload = await authRequest('/auth/mfa/configurar', {}, signal)
    return readMfaEnrollment(payload.data)
  },

  async verifyMfa(codigo: string): Promise<User> {
    if (!isMfaCode(codigo)) throw new Error('Ingresa el código de 6 dígitos de tu autenticador.')
    const payload = await authRequest('/auth/mfa/verificar', { codigo })
    const user = readBackendUser(payload)
    if (!user) throw new Error('El servidor no confirmó el usuario verificado.')
    return user
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      })

      if (response.status === 401) {
        return null
      }

      const payload = (await response.json().catch(() => null)) as ApiEnvelope<ApiUser> | null
      if (!response.ok || payload?.success !== true || !payload?.data) {
        return null
      }

      return readBackendUser(payload)
    } catch {
      return null
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      })
    } catch {
      // La sesión vive en la cookie del navegador; si falla el cierre, la siguiente solicitud queda sin sesión.
    }
  },

  async registerCitizen(payload: {
    firstName: string
    lastName: string
    email: string
    phone: string
    city: string
    password: string
    confirmPassword: string
  }): Promise<User> {
    const body = {
      nombre: payload.firstName.trim(),
      primer_apellido: payload.lastName.trim(),
      correo: payload.email.trim().toLowerCase(),
      telefono: payload.phone.trim(),
      ciudad: payload.city.trim(),
      contrasena: payload.password,
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const result = (await response.json().catch(() => null)) as ApiEnvelope<ApiUser> | null
      if (!response.ok) {
        const message = result?.message ?? result?.error ?? 'No se pudo crear la cuenta.'
        if (result?.code === 'CORREO_YA_REGISTRADO' || /correo/i.test(message)) {
          throw new Error('Este correo electrónico ya está registrado.')
        }
        throw new Error(message)
      }

      return readBackendUser(result) ?? {
        id: `MOB-CIT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        nombre: `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim(),
        email: payload.email.trim().toLowerCase(),
        role: 'CIUDADANO',
        rol: 'CIUDADANO',
        phone: payload.phone.trim(),
        city: payload.city.trim(),
        activo: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }
    } catch (error) {
      if (!USE_MOCKS) {
        throw error instanceof Error ? error : new Error('El backend no expone un endpoint público de registro ciudadano.')
      }

      const nextUser: User = {
        id: `MOB-CIT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        nombre: `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim(),
        email: payload.email.trim().toLowerCase(),
        role: 'CIUDADANO',
        rol: 'CIUDADANO',
        phone: payload.phone.trim(),
        city: payload.city.trim(),
        activo: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }

      return nextUser
    }
  },
}