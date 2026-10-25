import { normalizeRole, normalizeStatus, type User, type UserRole } from '../types'
import { apiFetch } from './http'

interface ApiUser {
  id_usuario?: string | number
  id?: string | number
  nombre?: string | null
  primer_apellido?: string | null
  segundo_apellido?: string | null
  correo?: string | null
  telefono?: string | null
  nombre_rol?: string | null
  id_rol?: string | number | null
  id_institucion?: string | number | null
  estado?: boolean | string | number | null
  fecha_eliminacion?: string | null
}

export interface CreateUserInput {
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
  role?: UserRole
  nombre_rol?: UserRole
  id_institucion?: string | number | null
  institutionId?: string | number | null
}

export type UpdateUserInput = Partial<CreateUserInput>

function toUser(data: ApiUser): User {
  if (!data || (data.id_usuario == null && data.id == null)) {
    throw new Error('El backend devolvió un usuario sin identificador.')
  }

  // El contrato confirmado devuelve nombre_rol. No inferir roles desde ID 2, 3, etc.
  if (!data.nombre_rol?.trim()) {
    throw new Error(`El usuario ${data.id_usuario ?? data.id} no tiene nombre_rol en la respuesta.`)
  }

  const role = normalizeRole(data.nombre_rol)
  const firstName = String(data.nombre ?? '').trim()
  const primerApellido = String(data.primer_apellido ?? '').trim()
  const segundoApellido = String(data.segundo_apellido ?? '').trim()
  const institutionId = data.id_institucion == null ? null : String(data.id_institucion)
  const status = normalizeStatus(data.estado ?? 'ACTIVE')

  return {
    id: String(data.id_usuario ?? data.id),
    nombre: [firstName, primerApellido, segundoApellido].filter(Boolean).join(' ') || 'Usuario',
    firstName,
    lastName: [primerApellido, segundoApellido].filter(Boolean).join(' '),
    primerApellido,
    segundoApellido,
    email: String(data.correo ?? ''),
    phone: data.telefono ?? undefined,
    telefono: data.telefono ?? undefined,
    role,
    rol: role,
    institutionId,
    institucionId: institutionId,
    activo: status === 'ACTIVE',
    status,
  }
}

function accountFields(input: CreateUserInput, creating: boolean): Record<string, unknown> {
  const nombre = (input.firstName ?? input.nombre ?? '').trim()
  const primerApellido = (input.primer_apellido ?? input.lastName ?? '').trim()
  const correo = (input.correo ?? input.email ?? '').trim()
  const password = input.contrasena ?? input.password

  const fields: Record<string, unknown> = {
    ...(input.firstName !== undefined || input.nombre !== undefined ? { nombre } : {}),
    ...(input.primer_apellido !== undefined || input.lastName !== undefined ? { primer_apellido: primerApellido } : {}),
    ...(input.segundo_apellido !== undefined ? { segundo_apellido: input.segundo_apellido.trim() } : {}),
    ...(input.correo !== undefined || input.email !== undefined ? { correo } : {}),
    ...(input.telefono !== undefined || input.phone !== undefined
      ? { telefono: (input.telefono ?? input.phone ?? '').trim() }
      : {}),
    ...(input.nombre_rol !== undefined || input.role !== undefined
      ? { nombre_rol: input.nombre_rol ?? input.role }
      : {}),
    ...(input.id_institucion !== undefined || input.institutionId !== undefined
      ? { id_institucion: input.id_institucion !== undefined ? input.id_institucion : input.institutionId }
      : {}),
  }

  // Si no se cambia contraseña al editar, no se envía ese campo.
  if (password?.trim()) fields.contrasena = password

  if (creating && !nombre) throw new Error('Ingresa el nombre del usuario.')
  if (creating && !correo) throw new Error('Ingresa el correo del usuario.')
  if (creating && !fields.nombre_rol) throw new Error('Selecciona el rol del usuario.')
  if (creating && !password?.trim()) throw new Error('Ingresa una contraseña para crear el usuario.')

  return fields
}

export const userService = {
  async getUsers(): Promise<User[]> {
    // El backend documentó data como un arreglo, sin objeto de paginación.
    const result = await apiFetch<unknown>('/usuarios?incluirEliminados=false')
    if (!Array.isArray(result)) {
      throw new Error('El backend no devolvió un listado válido de usuarios.')
    }
    return (result as ApiUser[]).map(toUser)
  },

  async getUserById(id: string): Promise<User> {
    return toUser(await apiFetch<ApiUser>(`/usuarios/${encodeURIComponent(id)}`))
  },

  async createUser(input: CreateUserInput): Promise<User> {
    const data = await apiFetch<ApiUser>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(accountFields(input, true)),
    })
    // Si POST devuelve solo el ID, recuperar el DTO completo con nombre_rol.
    if (data?.nombre_rol) return toUser(data)
    const id = data?.id_usuario ?? data?.id
    if (id == null) throw new Error('El servidor creó el usuario, pero no devolvió su identificador.')
    return this.getUserById(String(id))
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    await apiFetch(`/usuarios/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(accountFields(input, false)),
    })
    return this.getUserById(id)
  },

  async deactivateUser(id: string): Promise<User> {
    await apiFetch(`/usuarios/${encodeURIComponent(id)}/desactivar`, { method: 'PATCH' })
    return this.getUserById(id)
  },

  async reactivateUser(id: string): Promise<User> {
    await apiFetch(`/usuarios/${encodeURIComponent(id)}/reactivar`, { method: 'PATCH' })
    return this.getUserById(id)
  },
}