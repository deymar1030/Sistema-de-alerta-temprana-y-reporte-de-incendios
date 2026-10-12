import { normalizeRole, normalizeStatus, type User } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'
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
  id_institucion?: string | number | null
  institucionId?: string | number | null
  institutionId?: string | number | null
  estado?: boolean | number | string | null
  activo?: boolean | number | string | null
  status?: string | null
}

interface ApiEnvelope<T> {
  success?: boolean
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
      role: 'SUPER_ADMIN',
      rol: 'SUPER_ADMIN',
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
      role: 'CENTRAL_OPERATOR',
      rol: 'CENTRAL_OPERATOR',
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
      role: 'INSTITUTION_ADMIN',
      rol: 'INSTITUTION_ADMIN',
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
      role: 'INSTITUTION_USER',
      rol: 'INSTITUTION_USER',
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
      role: 'CITIZEN',
      rol: 'CITIZEN',
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

  const roleValue = payload.id_rol ?? payload.rol ?? payload.role
  if (roleValue === undefined || roleValue === null || roleValue === '') {
    throw new Error('El backend no devolvió un id_rol válido para este usuario.')
  }

  const role = normalizeRole(roleValue)
  const institutionId = payload.id_institucion ?? payload.institucionId ?? payload.institutionId ?? null
  const status = normalizeStatus(payload.status ?? payload.estado ?? payload.activo ?? 'ACTIVE')
  const firstName = String(payload.nombre ?? '').trim()
  const lastName = [payload.primer_apellido, payload.segundo_apellido].filter(Boolean).join(' ').trim()
  const nombre = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Usuario'
  const email = String(payload.correo ?? payload.email ?? '')

  return {
    id: String(payload.id_usuario ?? payload.id ?? 'user-id'),
    nombre,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
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

export const authService = {
  async login(correo: string, contrasena: string): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ correo, contrasena }),
      })

      const payload = (await response.json().catch(() => null)) as ApiEnvelope<ApiUser> | null

      if (!response.ok || payload?.success !== true || !payload?.data) {
        const message = payload?.message ?? payload?.error ?? 'No se pudo iniciar sesión.'
        throw new Error(message)
      }

      const user = readBackendUser(payload)
      if (!user) {
        throw new Error('El backend no devolvió un usuario válido.')
      }

      return user
    } catch (error) {
      if (!USE_MOCKS) {
        throw error instanceof Error ? error : new Error('No se pudo iniciar sesión.')
      }

      const match = demoUsers.find((entry) => entry.email.toLowerCase() === correo.trim().toLowerCase() && entry.password === contrasena)
      if (!match) {
        throw new Error('Credenciales inválidas.')
      }

      return match.user
    }
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
      nombre: `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim(),
      primer_apellido: payload.lastName.trim(),
      correo: payload.email.trim().toLowerCase(),
      telefono: payload.phone.trim(),
      ciudad: payload.city.trim(),
      contrasena: payload.password,
      confirmPassword: payload.confirmPassword,
      role: 'CITIZEN',
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
      if (!response.ok || result?.success !== true || !result?.data) {
        const message = result?.message ?? result?.error ?? 'No se pudo crear la cuenta.'
        throw new Error(message)
      }

      const user = readBackendUser(result)
      if (!user) {
        throw new Error('El backend no devolvió un usuario válido.')
      }

      return user
    } catch (error) {
      if (!USE_MOCKS) {
        throw error instanceof Error ? error : new Error('El backend no expone un endpoint público de registro ciudadano.')
      }

      const nextUser: User = {
        id: `MOB-CIT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        nombre: `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim(),
        email: payload.email.trim().toLowerCase(),
        role: 'CITIZEN',
        rol: 'CITIZEN',
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