import { apiFetch } from './http'
import type { User } from '../types'

const USERS_STORAGE_KEY = 'alerta-mobile-users'
const SESSION_STORAGE_KEY = 'alerta-mobile-session'
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

const DEMO_USERS: Array<{ email: string; password: string; user: User }> = [
  {
    email: 'ciudadano@alerta.bo',
    password: 'Ciudadano123',
    user: {
      id: 'MOB-CIT-001',
      name: 'Ciudadano demo',
      firstName: 'Ciudadano',
      lastName: 'Demo',
      email: 'ciudadano@alerta.bo',
      role: 'CIUDADANO',
      phone: '+591 71000000',
      city: 'La Paz',
      active: true,
    },
  },
  {
    email: 'operativo@alerta.bo',
    password: 'Admin123',
    user: {
      id: 'MOB-INS-001',
      name: 'Personal operativo',
      firstName: 'Personal',
      lastName: 'Operativo',
      email: 'operativo@alerta.bo',
      role: 'OPERATIVO',
      institutionId: 'INS-001',
      active: true,
    },
  },
  {
    email: 'admin.bomberos@alerta.bo',
    password: 'Admin123',
    user: {
      id: 'MOB-ADM-001',
      name: 'Administrador institución',
      email: 'admin.bomberos@alerta.bo',
      role: 'JEFE_INSTITUCION',
      institutionId: 'INS-001',
      active: true,
    },
  },
  {
    email: 'superadmin@alerta.bo',
    password: 'Admin123',
    user: {
      id: 'MOB-SA-001',
      name: 'Administrador general',
      email: 'superadmin@alerta.bo',
      role: 'ADMIN',
      active: true,
    },
  },
]

const getSavedUsers = (): Array<{ email: string; password: string; user: User }> => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const persistUsers = (users: Array<{ email: string; password: string; user: User }>) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

const allUsers = () => [...DEMO_USERS, ...getSavedUsers()]

const ALLOWED_ROLES: User['role'][] = ['CIUDADANO', 'OPERATIVO']

const normalizeUser = (payload: any): User | null => {
  if (!payload || typeof payload !== 'object') return null
  const user = payload.usuario ?? payload.user ?? payload.data ?? payload
  const rawRole = String(user?.nombre_rol ?? user?.role ?? user?.rol ?? '').trim().toUpperCase()
  // Nunca asumir que id_rol=2/3/4 significa lo mismo sin confirmar el catálogo.
  if (!['ADMIN', 'JEFE_INSTITUCION', 'OPERATIVO', 'CIUDADANO'].includes(rawRole)) return null
  const id = user?.id_usuario ?? user?.id
  if (id == null || id === '') return null
  const institution = user?.id_institucion ?? user?.institutionId ?? user?.institucionId
  const firstName = String(user?.nombre ?? user?.firstName ?? '').trim()
  const lastName = [user?.primer_apellido, user?.segundo_apellido].filter(Boolean).join(' ').trim()
  const active = user?.estado === false || user?.activo === false || user?.active === false ? false : true

  return {
    id: String(id),
    name: [firstName, lastName || user?.lastName].filter(Boolean).join(' ').trim() || String(user?.name ?? 'Usuario'),
    firstName: firstName || undefined,
    lastName: lastName || user?.lastName,
    email: String(user?.correo ?? user?.email ?? ''),
    role: rawRole as User['role'],
    institutionId: institution == null || institution === '' ? undefined : String(institution),
    phone: user?.telefono ?? user?.phone,
    city: user?.ciudad ?? user?.city,
    active,
  }
}

const saveDemoSession = (user: User) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user }))
  }
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    if (USE_MOCKS) {
      const match = allUsers().find(
        (entry) => entry.email.toLowerCase() === email.trim().toLowerCase() && entry.password === password,
      )

      if (!match) {
        throw new Error('Correo o contraseña incorrectos.')
      }

      const user = match.user
      const allowedMobileRoles: User['role'][] = ['CIUDADANO', 'OPERATIVO']

      if (!allowedMobileRoles.includes(user.role)) {
        throw new Error('Este usuario debe ingresar desde la plataforma web.')
      }

      saveDemoSession(user)
      return user
    }

    const payload = await apiFetch<unknown>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo: email.trim(), contrasena: password }),
    })
    const user = normalizeUser(payload)
    if (!user) throw new Error('El servidor no devolvió un usuario con nombre_rol reconocido.')
    if (!user.active) throw new Error('La cuenta está desactivada.')
    if (!ALLOWED_ROLES.includes(user.role)) {
      throw new Error('Este usuario debe ingresar desde la plataforma web.')
    }
    // La cookie sid es HttpOnly: no se almacena en localStorage ni se inventa un token.
    if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return user
  },

  async register(payload: {
    nombre?: string
    firstName?: string
    lastName?: string
    secondLastName?: string
    primerApellido?: string
    segundoApellido?: string | null
    email: string
    phone: string
    city?: string
    password: string
    confirmPassword: string
  }): Promise<User> {
    const trimmedEmail = payload.email.trim().toLowerCase()
    const nombre = (payload.nombre ?? payload.firstName ?? '').trim()
    const primerApellido = (payload.primerApellido ?? payload.lastName ?? '').trim()
    const segundoApellido = (payload.segundoApellido ?? payload.secondLastName ?? '').trim()

    if (USE_MOCKS) {
      const userExists = allUsers().some((entry) => entry.email.toLowerCase() === trimmedEmail)
      if (userExists) throw new Error('Este correo ya está registrado.')
      if (payload.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
      if (payload.password !== payload.confirmPassword) throw new Error('Las contraseñas no coinciden.')

      const newUser: User = {
        id: `MOB-CIT-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        name: `${nombre} ${primerApellido} ${segundoApellido}`.trim(),
        firstName: nombre,
        lastName: primerApellido,
        email: trimmedEmail,
        phone: payload.phone.trim(),
        role: 'CIUDADANO',
        active: true,
      }

      const savedUsers = getSavedUsers()
      savedUsers.push({ email: trimmedEmail, password: payload.password, user: newUser })
      persistUsers(savedUsers)
      return newUser
    }

    if (payload.password !== payload.confirmPassword) {
      throw new Error('Las contraseñas no coinciden.')
    }

    const finalPayload = {
      nombre: nombre,
      primer_apellido: primerApellido,
      segundo_apellido: segundoApellido || null,
      telefono: payload.phone.trim(),
      correo: trimmedEmail,
      contrasena: payload.password,
    }

    try {
      const response = await apiFetch<{ code?: string; success?: boolean; error?: string; message?: string; data?: { usuario?: User; user?: User }; usuario?: User; user?: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(finalPayload),
      })

      if (response?.code === 'CORREO_YA_REGISTRADO') {
        throw new Error('Este correo electrónico ya está registrado.')
      }

      const registered = normalizeUser(response)
      if (!registered) throw new Error('El servidor no devolvió un usuario registrado válido.')
      return registered
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta.'
      if (message === 'CORREO_YA_REGISTRADO' || /correo/i.test(message)) {
        throw new Error('Este correo electrónico ya está registrado.')
      }
      throw new Error(message)
    }
  },

  async getCurrentUser(): Promise<User | null> {
    if (USE_MOCKS) {
      if (typeof window === 'undefined') return null
      try {
        const saved = window.localStorage.getItem(SESSION_STORAGE_KEY)
        return saved ? normalizeUser(JSON.parse(saved)) : null
      } catch { return null }
    }
    try {
      const user = normalizeUser(await apiFetch<unknown>('/auth/me'))
      return user?.active && ALLOWED_ROLES.includes(user.role) ? user : null
    } catch {
      // Sin /auth/me confirmado, NO restaurar una sesión anterior desde localStorage.
      return null
    }
  },

  async logout(): Promise<void> {
    try {
      if (!USE_MOCKS) await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(SESSION_STORAGE_KEY)
        window.localStorage.removeItem('alerta_mobile_citizen_reports')
      }
    }
  },
}
