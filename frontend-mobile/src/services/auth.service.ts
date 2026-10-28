import type { User, UserRole } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'https://alertaincendios.duckdns.org/api'

// Roles del backend que pueden usar la app móvil.
// Cualquier otro (por ejemplo JEFE_INSTITUCION) debe usar la plataforma web.
const ROLES_PERMITIDOS: Record<string, UserRole> = {
  CIUDADANO: 'CITIZEN',
  OPERATIVO: 'INSTITUTION_USER'
}

const mapBackendUserToFrontend = (backendUser: any): User => {
  const rolBackend = String(backendUser?.nombre_rol ?? '').trim().toUpperCase()
  const mappedRole = ROLES_PERMITIDOS[rolBackend]

  // Si el rol no está permitido, se rechaza el ingreso
  if (!mappedRole) throw new Error('ROL_NO_PERMITIDO')

  return {
    id: String(backendUser.id_usuario),
    name: `${backendUser.nombre} ${backendUser.primer_apellido}`.trim(),
    role: mappedRole,
    roleLabel: backendUser.nombre_rol || 'Desconocido',
    institutionName: backendUser.id_institucion ? `Institución #${backendUser.id_institucion}` : undefined
  }
}

const cerrarSesion = async (): Promise<void> => {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  })
}

export const authService = {
  async login(correo: string, contrasena: string): Promise<User> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena }),
      credentials: 'include' // Envía la cookie de sesión automáticamente
    })

    if (!response.ok) throw new Error('Credenciales incorrectas')

    const json = await response.json()

    try {
      return mapBackendUserToFrontend(json.data)
    } catch (error) {
      // El backend ya abrió la sesión: se cierra para que no quede activa
      await cerrarSesion().catch(() => undefined)
      throw error
    }
  },

  async getMe(): Promise<User> {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) throw new Error('No hay sesión activa')

    const json = await response.json()
    return mapBackendUserToFrontend(json.data)
  },

  async logout(): Promise<void> {
    await cerrarSesion()
  },

  async register(userData: any): Promise<void> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Detalle del error del backend:', errorData)

      if (response.status === 409 || errorData.message === 'CORREO_YA_REGISTRADO') {
        throw new Error('CORREO_YA_REGISTRADO')
      }
      throw new Error(errorData.message || 'Error al crear la cuenta')
    }
  }
}