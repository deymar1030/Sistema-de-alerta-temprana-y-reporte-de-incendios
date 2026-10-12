import { normalizeRole, normalizeStatus, type User, type UserRole } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

interface ApiUser {
  id_usuario?: number | string
  id?: number | string
  nombre?: string
  primer_apellido?: string | null
  segundo_apellido?: string | null
  correo?: string
  email?: string
  telefono?: string | null
  phone?: string | null
  city?: string | null
  ciudad?: string | null
  id_rol?: number | string | null
  rol?: number | string | null
  role?: UserRole | string | null
  id_institucion?: number | string | null
  institutionId?: number | string | null
  institucionId?: number | string | null
  estado?: boolean | number | string | null
  activo?: boolean | number | string | null
  status?: 'ACTIVE' | 'INACTIVE' | string | null
  createdAt?: string
}

export interface CreateUserInput {
  id_rol?: number | string
  role?: UserRole
  id_institucion?: number | string | null
  institutionId?: number | string | null
  nombre?: string
  firstName?: string
  lastName?: string
  primer_apellido?: string
  segundo_apellido?: string
  correo?: string
  email?: string
  telefono?: string
  phone?: string
  contrasena?: string
  password?: string
  activo?: boolean
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface UpdateUserInput extends Partial<CreateUserInput> {}

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('alerta_token')
}

const formatFullName = (user: ApiUser) => {
  const parts = [user.nombre, user.primer_apellido, user.segundo_apellido].filter(Boolean)
  if (parts.length) return parts.join(' ').trim()
  if (user.email || user.correo) return user.email || user.correo || 'Usuario'
  return 'Usuario'
}

const toUser = (user: Partial<ApiUser> | null): User => {
  const id = String(user?.id_usuario ?? user?.id ?? crypto.randomUUID())
  const institutionId = user?.institutionId ?? user?.institucionId ?? user?.id_institucion ?? null
  const roleValue = user?.id_rol ?? user?.rol ?? user?.role
  const statusValue = user?.status ?? user?.estado ?? user?.activo ?? 'ACTIVE'
  const normalizedRole = normalizeRole(roleValue as number | string | UserRole | null | undefined)
  const normalizedStatus = normalizeStatus(statusValue)

  return {
    id,
    nombre: user?.nombre ?? formatFullName(user as ApiUser),
    firstName: user?.nombre?.split(' ')[0],
    lastName: user?.nombre?.split(' ').slice(1).join(' '),
    email: user?.email ?? user?.correo ?? 'sin-email@alerta.bo',
    phone: user?.phone ?? user?.telefono ?? undefined,
    city: user?.city ?? user?.ciudad ?? undefined,
    role: normalizedRole,
    rol: normalizedRole,
    institutionId: institutionId === null || institutionId === undefined || institutionId === '' ? null : String(institutionId),
    institucionId: institutionId === null || institutionId === undefined || institutionId === '' ? null : String(institutionId),
    activo: normalizedStatus === 'ACTIVE',
    status: normalizedStatus,
    createdAt: user?.createdAt ?? new Date().toISOString(),
  }
}

const readData = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const token = getStoredToken()

  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    ...init,
  })

  if (response.status === 401) {
    throw new Error('La sesión ha expirado. Inicia sesión nuevamente.')
  }

  const payload = await response.json().catch(() => null)
  const data = readData<T>(payload)

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'No se pudo completar la petición.'
    throw new Error(message)
  }

  if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
    throw new Error((payload as { error?: string }).error ?? 'La operación falló.')
  }

  return data
}

const roleToApiId = (role?: UserRole | string | number | null): number | string => {
  switch (normalizeRole(role)) {
    case 'ADMIN':
      return 1
    case 'JEFE_INSTITUCION':
      return 2
    case 'OPERATIVO':
      return 3
    case 'CIUDADANO':
      return 4
    default:
      throw new Error(`Rol desconocido: ${role}`)
  }
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await request<ApiUser[] | { usuarios?: ApiUser[] } | null>('/usuarios')
    const users = Array.isArray(response)
      ? response
      : Array.isArray((response as { usuarios?: ApiUser[] } | null)?.usuarios)
        ? (response as { usuarios?: ApiUser[] }).usuarios ?? []
        : []

    return users.map((user) => toUser(user))
  },

  async getUserById(id: string): Promise<User> {
    const response = await request<ApiUser | null>(`/usuarios/${id}`)
    return toUser(response)
  },

  async createUser(input: CreateUserInput): Promise<User> {
    const role = normalizeRole(input.role ?? input.id_rol ?? 'CIUDADANO')
    const institutionId = input.institutionId ?? input.id_institucion ?? null
    const payload = {
      id_rol: input.id_rol ?? roleToApiId(role),
      id_institucion: institutionId === undefined || institutionId === null || institutionId === '' ? null : institutionId,
      nombre: (input.nombre ?? `${input.firstName ?? ''} ${input.lastName ?? ''}`.trim()).trim(),
      primer_apellido: input.primer_apellido ?? '',
      segundo_apellido: input.segundo_apellido ?? '',
      correo: (input.correo ?? input.email ?? '').trim(),
      telefono: input.telefono ?? input.phone ?? '',
      contrasena: input.contrasena ?? input.password ?? 'Temp1234',
    }

    const response = await request<ApiUser>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return toUser(response)
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const payload: Record<string, unknown> = {
      ...(input.id_rol !== undefined ? { id_rol: input.id_rol ?? roleToApiId(input.role ?? 'CIUDADANO') } : {}),
      ...(input.id_institucion !== undefined && input.id_institucion !== null && input.id_institucion !== '' ? { id_institucion: input.id_institucion } : {}),
      ...(input.nombre !== undefined ? { nombre: input.nombre.trim() } : {}),
      ...(input.primer_apellido !== undefined ? { primer_apellido: input.primer_apellido.trim() } : {}),
      ...(input.segundo_apellido !== undefined ? { segundo_apellido: input.segundo_apellido.trim() } : {}),
      ...(input.correo !== undefined ? { correo: input.correo.trim() } : {}),
      ...(input.telefono !== undefined ? { telefono: input.telefono.trim() } : {}),
      ...(input.contrasena !== undefined ? { contrasena: input.contrasena.trim() } : {}),
    }

    const response = await request<ApiUser>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })

    return toUser(response)
  },

  async deactivateUser(id: string): Promise<User> {
    const response = await request<ApiUser>(`/usuarios/${id}/desactivar`, { method: 'PATCH' })
    return toUser(response)
  },

  async reactivateUser(id: string): Promise<User> {
    const response = await request<ApiUser>(`/usuarios/${id}/reactivar`, { method: 'PATCH' })
    return toUser(response)
  },
}
