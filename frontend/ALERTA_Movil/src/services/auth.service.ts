import { apiFetch } from './http'
import type { User } from '../types'

const USERS_STORAGE_KEY = 'alerta-mobile-users'
const SESSION_STORAGE_KEY = 'alerta-mobile-session'
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

/*
|--------------------------------------------------------------------------
| USUARIOS DEMO
|--------------------------------------------------------------------------
| Solo se utilizan cuando VITE_USE_MOCKS=true.
*/
const DEMO_USERS: Array<{
  email: string
  password: string
  user: User
}> = [
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
]

/*
|--------------------------------------------------------------------------
| NORMALIZACIÓN DE ROLES
|--------------------------------------------------------------------------
| Backend REAL:
|
| 1 = ADMIN
| 2 = JEFE_INSTITUCION
| 3 = OPERATIVO
| 4 = CIUDADANO
|
| El backend puede devolver "4" o 4, por eso convertimos todo a String.
*/
const normalizeRole = (value: unknown): User['role'] | null => {
  const role = String(value ?? '')
    .trim()
    .toUpperCase()

  switch (role) {
    case '1':
    case 'ADMIN':
      return 'ADMIN'

    case '2':
    case 'JEFE_INSTITUCION':
      return 'JEFE_INSTITUCION'

    case '3':
    case 'OPERATIVO':
      return 'OPERATIVO'

    case '4':
    case 'CIUDADANO':
      return 'CIUDADANO'

    default:
      console.error('Rol desconocido recibido del backend:', value)
      return null
  }
}

/*
|--------------------------------------------------------------------------
| LOCAL STORAGE - SOLO APOYO PARA MOBILE
|--------------------------------------------------------------------------
*/
const getSavedUsers = (): Array<{
  email: string
  password: string
  user: User
}> => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY)

    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const persistUsers = (
  users: Array<{
    email: string
    password: string
    user: User
  }>,
) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    USERS_STORAGE_KEY,
    JSON.stringify(users),
  )
}

const allUsers = () => [
  ...DEMO_USERS,
  ...getSavedUsers(),
]

/*
|--------------------------------------------------------------------------
| NORMALIZAR USUARIO DEL BACKEND
|--------------------------------------------------------------------------
|
| Backend devuelve campos como:
|
| id_usuario
| id_rol
| id_institucion
| nombre
| primer_apellido
| segundo_apellido
| telefono
| correo
| estado
|
*/
const normalizeUser = (payload: any): User | null => {
  if (!payload) {
    return null
  }

  /*
   * apiFetch ya puede devolver payload.data directamente,
   * pero dejamos estas alternativas para que funcione con
   * diferentes formas de respuesta.
   */
  const userRaw =
    payload?.usuario ??
    payload?.user ??
    payload?.data ??
    payload

  if (!userRaw || typeof userRaw !== 'object') {
    return null
  }

  /*
   * IMPORTANTE:
   * Primero usamos id_rol porque ese es el campo REAL del backend.
   */
  const role = normalizeRole(
    userRaw?.id_rol ??
      userRaw?.role ??
      userRaw?.rol,
  )

  if (!role) {
    console.error('No se pudo normalizar el usuario:', {
      id_rol: userRaw?.id_rol,
      role: userRaw?.role,
      rol: userRaw?.rol,
      usuario: userRaw,
    })

    return null
  }

  const nombre = String(
    userRaw?.nombre ??
      userRaw?.name ??
      userRaw?.full_name ??
      '',
  ).trim()

  const primerApellido = String(
    userRaw?.primer_apellido ??
      userRaw?.firstLastName ??
      '',
  ).trim()

  const segundoApellido = String(
    userRaw?.segundo_apellido ??
      userRaw?.secondLastName ??
      '',
  ).trim()

  const nombreCompleto = [
    nombre,
    primerApellido,
    segundoApellido,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  const institutionRaw =
    userRaw?.id_institucion ??
    userRaw?.institutionId ??
    userRaw?.institucionId ??
    null

  return {
    id: String(
      userRaw?.id_usuario ??
        userRaw?.id ??
        userRaw?.usuario_id ??
        userRaw?.userId ??
        'guest',
    ),

    name: nombreCompleto || 'Usuario',

    firstName:
      nombre ||
      userRaw?.firstName ||
      undefined,

    lastName:
      [primerApellido, segundoApellido]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      userRaw?.lastName ||
      undefined,

    email: String(
      userRaw?.correo ??
        userRaw?.email ??
        userRaw?.mail ??
        '',
    ),

    role,

    institutionId:
      institutionRaw !== null &&
      institutionRaw !== undefined &&
      institutionRaw !== ''
        ? String(institutionRaw)
        : undefined,

    phone:
      userRaw?.telefono ??
      userRaw?.phone ??
      undefined,

    city:
      userRaw?.ciudad ??
      userRaw?.city ??
      undefined,

    active:
      userRaw?.estado ??
      userRaw?.activo ??
      userRaw?.active ??
      true,
  }
}

/*
|--------------------------------------------------------------------------
| GUARDAR SESIÓN LOCAL MOBILE
|--------------------------------------------------------------------------
|
| La autenticación REAL del backend utiliza cookie sid.
| Este localStorage solamente mantiene el usuario para la interfaz.
*/
const setSession = (
  user: User,
  token?: string,
) => {
  if (typeof window === 'undefined') {
    return
  }

  const session = token
    ? {
        user,
        token,
      }
    : {
        user,
      }

  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(session),
  )
}

/*
|--------------------------------------------------------------------------
| SERVICIO AUTH
|--------------------------------------------------------------------------
*/
export const authService = {
  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */
  async login(
    email: string,
    password: string,
  ): Promise<User> {
    /*
     * MODO MOCK
     */
    if (USE_MOCKS) {
      const match = allUsers().find(
        (entry) =>
          entry.email.toLowerCase() ===
            email.trim().toLowerCase() &&
          entry.password === password,
      )

      if (!match) {
        throw new Error(
          'Correo o contraseña incorrectos.',
        )
      }

      const user = match.user

      const allowedMobileRoles: User['role'][] = [
        'CIUDADANO',
        'OPERATIVO',
      ]

      if (!allowedMobileRoles.includes(user.role)) {
        throw new Error(
          'Este usuario debe ingresar desde la plataforma web.',
        )
      }

      setSession(user)

      return user
    }

    /*
     * BACKEND REAL
     *
     * apiFetch ya usa:
     * credentials: 'include'
     *
     * por lo que la cookie sid se guarda automáticamente.
     */
    try {
      const payload = await apiFetch<any>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            correo: email.trim().toLowerCase(),
            contrasena: password,
          }),
        },
      )

      /*
       * Aquí estaba el error anterior.
       *
       * Backend devuelve:
       *
       * id_rol: "4"
       *
       * y antes Mobile intentaba comparar "4"
       * directamente con "CIUDADANO".
       *
       * normalizeUser ahora convierte:
       *
       * "4" -> CIUDADANO
       */
      const user = normalizeUser(payload)

      if (!user) {
        throw new Error(
          'El servidor inició la sesión, pero devolvió datos de usuario inválidos.',
        )
      }

      /*
       * Roles permitidos en Mobile.
       */
      const allowedMobileRoles: User['role'][] = [
        'CIUDADANO',
        'OPERATIVO',
      ]

      if (!allowedMobileRoles.includes(user.role)) {
        /*
         * Como el backend ya pudo crear una sesión,
         * intentamos cerrarla antes de rechazar el acceso.
         */
        try {
          await apiFetch('/auth/logout', {
            method: 'POST',
          })
        } catch {
          // No bloqueamos el mensaje principal.
        }

        throw new Error(
          'Este usuario debe ingresar desde la plataforma web.',
        )
      }

      /*
       * Guardamos solo información de interfaz.
       * La autenticación real continúa siendo la cookie sid.
       */
      setSession(user)

      return user
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar sesión.'

      /*
       * Conservamos mensajes reales del backend.
       */
      if (
        /credencial/i.test(message) ||
        /contraseña/i.test(message) ||
        /correo/i.test(message)
      ) {
        throw new Error(
          'Correo o contraseña incorrectos.',
        )
      }

      throw new Error(message)
    }
  },

  /*
  |--------------------------------------------------------------------------
  | REGISTRO CIUDADANO
  |--------------------------------------------------------------------------
  |
  | Backend asigna automáticamente:
  |
  | id_rol = 4
  |
  | NO enviamos id_rol desde Mobile.
  */
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
    const trimmedEmail = payload.email
      .trim()
      .toLowerCase()

    const nombre = (
      payload.nombre ??
      payload.firstName ??
      ''
    ).trim()

    const primerApellido = (
      payload.primerApellido ??
      payload.lastName ??
      ''
    ).trim()

    const segundoApellido = (
      payload.segundoApellido ??
      payload.secondLastName ??
      ''
    ).trim()

    /*
     * VALIDACIONES FRONTEND
     */
    if (!nombre) {
      throw new Error(
        'Debes ingresar tus nombres.',
      )
    }

    if (!primerApellido) {
      throw new Error(
        'Debes ingresar tu primer apellido.',
      )
    }

    if (!trimmedEmail) {
      throw new Error(
        'El correo electrónico es obligatorio.',
      )
    }

    if (!payload.phone.trim()) {
      throw new Error(
        'El número de celular es obligatorio.',
      )
    }

    if (payload.password.length < 8) {
      throw new Error(
        'La contraseña debe tener al menos 8 caracteres.',
      )
    }

    if (
      payload.password !==
      payload.confirmPassword
    ) {
      throw new Error(
        'Las contraseñas no coinciden.',
      )
    }

    /*
     * MODO MOCK
     */
    if (USE_MOCKS) {
      const userExists = allUsers().some(
        (entry) =>
          entry.email.toLowerCase() ===
          trimmedEmail,
      )

      if (userExists) {
        throw new Error(
          'Este correo electrónico ya está registrado.',
        )
      }

      const newUser: User = {
        id: `MOB-CIT-${String(
          Math.floor(Math.random() * 9000) +
            1000,
        )}`,

        name: [
          nombre,
          primerApellido,
          segundoApellido,
        ]
          .filter(Boolean)
          .join(' '),

        firstName: nombre,

        lastName: [
          primerApellido,
          segundoApellido,
        ]
          .filter(Boolean)
          .join(' '),

        email: trimmedEmail,

        phone: payload.phone.trim(),

        role: 'CIUDADANO',

        active: true,
      }

      const savedUsers = getSavedUsers()

      savedUsers.push({
        email: trimmedEmail,
        password: payload.password,
        user: newUser,
      })

      persistUsers(savedUsers)

      return newUser
    }

    /*
     * PAYLOAD EXACTO DEL BACKEND
     */
    const finalPayload = {
      nombre,
      primer_apellido: primerApellido,
      segundo_apellido:
        segundoApellido || null,
      telefono: payload.phone.trim(),
      correo: trimmedEmail,
      contrasena: payload.password,
    }

    try {
      /*
       * apiFetch considera cualquier 2xx como éxito,
       * incluido HTTP 201 Created.
       */
      const response = await apiFetch<any>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(finalPayload),
        },
      )

      /*
       * Si backend devuelve el usuario,
       * intentamos normalizarlo.
       */
      const backendUser =
        normalizeUser(response)

      if (backendUser) {
        return backendUser
      }

      /*
       * Algunos endpoints de registro solamente
       * responden éxito y no devuelven usuario.
       *
       * En ese caso creamos un objeto local SOLO
       * para satisfacer el retorno del servicio.
       *
       * NO significa que se esté guardando otro
       * usuario en localStorage.
       */
      const newUser: User = {
        id: 'nuevo-ciudadano',

        name: [
          nombre,
          primerApellido,
          segundoApellido,
        ]
          .filter(Boolean)
          .join(' '),

        firstName: nombre,

        lastName: [
          primerApellido,
          segundoApellido,
        ]
          .filter(Boolean)
          .join(' '),

        email: trimmedEmail,

        phone: payload.phone.trim(),

        role: 'CIUDADANO',

        active: true,
      }

      return newUser
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo crear la cuenta.'

      if (
        message ===
          'CORREO_YA_REGISTRADO' ||
        /correo ya est[aá] registrado/i.test(
          message,
        ) ||
        /correo.*registrado/i.test(message)
      ) {
        throw new Error(
          'Este correo electrónico ya está registrado.',
        )
      }

      throw new Error(message)
    }
  },

  /*
  |--------------------------------------------------------------------------
  | USUARIO ACTUAL
  |--------------------------------------------------------------------------
  */
  async getCurrentUser(): Promise<User | null> {
    /*
     * Primero intentamos comprobar la sesión REAL
     * del backend mediante la cookie sid.
     */
    if (!USE_MOCKS) {
      try {
        const payload =
          await apiFetch<any>('/auth/me', {
            method: 'GET',
          })

        const backendUser =
          normalizeUser(payload)

        if (backendUser) {
          const allowedMobileRoles: User['role'][] =
            ['CIUDADANO', 'OPERATIVO']

          if (
            !allowedMobileRoles.includes(
              backendUser.role,
            )
          ) {
            return null
          }

          setSession(backendUser)

          return backendUser
        }
      } catch {
        /*
         * Si /auth/me devuelve 401,
         * continuamos y limpiamos la sesión local.
         */
      }
    }

    /*
     * En mocks sí podemos recuperar localmente.
     */
    if (USE_MOCKS) {
      if (typeof window === 'undefined') {
        return null
      }

      const raw =
        window.localStorage.getItem(
          SESSION_STORAGE_KEY,
        )

      if (!raw) {
        return null
      }

      try {
        const parsed = JSON.parse(raw)

        return normalizeUser(
          parsed?.user ?? parsed,
        )
      } catch {
        return null
      }
    }

    /*
     * Si backend no reconoce una sesión,
     * eliminamos cualquier usuario local viejo.
     */
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(
        SESSION_STORAGE_KEY,
      )
    }

    return null
  },

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */
  async logout(): Promise<void> {
    /*
     * IMPORTANTE:
     * Antes solamente se eliminaba localStorage.
     *
     * Eso NO destruía la cookie HttpOnly sid,
     * por eso Web seguía viendo al ciudadano
     * autenticado.
     */
    if (!USE_MOCKS) {
      try {
        await apiFetch('/auth/logout', {
          method: 'POST',
        })
      } catch (error) {
        console.warn(
          'No se pudo cerrar la sesión en el backend:',
          error,
        )
      }
    }

    /*
     * Limpiamos información local.
     */
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(
        SESSION_STORAGE_KEY,
      )
    }
  },
}