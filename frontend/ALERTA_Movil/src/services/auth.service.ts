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
      role: 'CITIZEN',
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
      role: 'INSTITUTION_USER',
      institutionId: 'INS-001',
      active: true,
    },
  },
  {
    email: 'operador@alerta.bo',
    password: 'Admin123',
    user: {
      id: 'MOB-OP-001',
      name: 'Operador central',
      email: 'operador@alerta.bo',
      role: 'CENTRAL_OPERATOR',
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
      role: 'INSTITUTION_ADMIN',
      institutionId: 'INS-001',
      active: true,
    },
  },
  {
    email: 'superadmin@alerta.bo',
    password: 'Admin123',
    user: {
      id: 'MOB-SA-001',
      name: 'Superadministrador',
      email: 'superadmin@alerta.bo',
      role: 'SUPER_ADMIN',
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

const normalizeUser = (payload: any): User | null => {
  if (!payload) return null

  const userRaw = payload.usuario ?? payload.user ?? payload.data ?? payload
  const role = userRaw?.role ?? userRaw?.rol ?? null

  if (!role || !['SUPER_ADMIN', 'CENTRAL_OPERATOR', 'INSTITUTION_ADMIN', 'INSTITUTION_USER', 'CITIZEN'].includes(role)) {
    return null
  }

  return {
    id: String(userRaw?.id ?? userRaw?.id_usuario ?? userRaw?.usuario_id ?? userRaw?.userId ?? 'guest'),
    name: String(userRaw?.name ?? userRaw?.nombre ?? userRaw?.full_name ?? 'Usuario'),
    firstName: userRaw?.firstName ?? userRaw?.nombre?.split(' ')[0],
    lastName: userRaw?.lastName ?? userRaw?.nombre?.split(' ').slice(1).join(' '),
    email: String(userRaw?.email ?? userRaw?.correo ?? userRaw?.mail ?? ''),
    role,
    institutionId: userRaw?.institutionId ?? userRaw?.institucionId ?? userRaw?.id_institucion ? String(userRaw.institutionId ?? userRaw.institucionId ?? userRaw.id_institucion) : undefined,
    phone: userRaw?.phone ?? userRaw?.telefono,
    city: userRaw?.city ?? userRaw?.ciudad,
    active: userRaw?.active ?? userRaw?.activo ?? true,
  }
}

const setSession = (user: User, token?: string) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user, token: token ?? 'demo-token' }))
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
      const allowedMobileRoles: User['role'][] = ['CITIZEN', 'INSTITUTION_USER']

      if (!allowedMobileRoles.includes(user.role)) {
        throw new Error('Este usuario debe ingresar desde la plataforma web.')
      }

      setSession(user)
      return user
    }

    const payload = await apiFetch<{ data?: { usuario?: User; user?: User; token?: string }; token?: string; usuario?: User; user?: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo: email.trim(), contrasena: password }),
    })

    const user = normalizeUser(payload?.data ?? payload?.usuario ?? payload?.user ?? payload)
    const token = payload?.data?.token ?? payload?.token ?? undefined

    if (!user) {
      throw new Error('Correo o contraseña incorrectos.')
    }

    const allowedMobileRoles: User['role'][] = ['CITIZEN', 'INSTITUTION_USER']
    if (!allowedMobileRoles.includes(user.role)) {
      throw new Error('Este usuario debe ingresar desde la plataforma web.')
    }

    setSession(user, token)
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
        role: 'CITIZEN',
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

    const response = await apiFetch<{ success?: boolean; error?: string; data?: { usuario?: User; user?: User }; usuario?: User; user?: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(finalPayload),
    })

    if (response?.success === false) {
      const message = response.error ?? 'No se pudo crear la cuenta.'
      if (/correo/i.test(message)) {
        throw new Error('Este correo electrónico ya está registrado.')
      }
      throw new Error(message)
    }

    const user = normalizeUser(response?.data ?? response?.usuario ?? response?.user ?? response)
    if (!user) {
      throw new Error('No se pudo crear la cuenta.')
    }

    return user
  },

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null

    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw)
      return normalizeUser(parsed.user ?? parsed)
    } catch {
      return null
    }
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  },
}
