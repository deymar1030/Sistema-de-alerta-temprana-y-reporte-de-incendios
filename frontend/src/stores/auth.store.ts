
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { authService } from '../services/auth.service'
import type { User } from '../types'
import { normalizeRole } from '../types'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const loading = ref(false)

  let initialization: Promise<User | null> | null = null

  const role = computed(() => {
    if (!user.value) return null

    return normalizeRole(
      user.value.role ?? user.value.rol
    )
  })

  const isAuthenticated = computed(
    () => user.value !== null
  )

  // Restaurar la sesión desde el backend.
  // Nunca restaurar usuarios desde localStorage.
  const initialize = async (
    force = false
  ): Promise<User | null> => {
    if (initialization) {
      return initialization
    }

    if (initialized.value && !force) {
      return user.value
    }

    loading.value = true

    initialization = (async () => {
      try {
        user.value =
          await authService.getCurrentUser()

        return user.value
      } catch {
        user.value = null
        return null
      } finally {
        initialized.value = true
        loading.value = false
        initialization = null
      }
    })()

    return initialization
  }

  const login = async (
    correo: string,
    contrasena: string
  ): Promise<User> => {
    loading.value = true
    user.value = null

    try {
      const loginUser = await authService.login(
        correo,
        contrasena
      )

      // Un HTTP 200 en login no garantiza que el
      // navegador haya conservado la cookie sid.
      const confirmed = USE_MOCKS
        ? loginUser
        : await authService.getCurrentUser()

      if (!confirmed) {
        throw new Error(
          'El servidor aceptó el login, pero no confirmó la sesión. Revisa la cookie sid y el proxy HTTPS.'
        )
      }

      user.value = confirmed
      initialized.value = true

      return confirmed
    } catch (error) {
      user.value = null
      initialized.value = true
      throw error
    } finally {
      loading.value = false
    }
  }

  const registerCitizen = async (
    payload: Partial<User> & {
      password: string
      confirmPassword: string
    }
  ) => {
    const email = payload.email?.trim().toLowerCase()

    if (!email) {
      throw new Error(
        'Debe ingresar un correo válido.'
      )
    }

    if (payload.password.length < 8) {
      throw new Error(
        'La contraseña debe tener al menos 8 caracteres.'
      )
    }

    if (
      payload.password !== payload.confirmPassword
    ) {
      throw new Error(
        'La confirmación de contraseña no coincide.'
      )
    }

    return authService.registerCitizen({
      firstName:
        payload.firstName ??
        payload.nombre?.split(' ')[0] ??
        '',

      lastName:
        payload.lastName ??
        payload.nombre?.split(' ').slice(1).join(' ') ??
        '',

      email,
      phone: payload.phone ?? payload.telefono ?? '',
      city: payload.city ?? '',
      password: payload.password,
      confirmPassword: payload.confirmPassword,
    })
  }

  const changePassword = async (
    _currentPassword: string,
    _newPassword: string,
    _confirmPassword: string
  ) => {
    if (!user.value) {
      throw new Error(
        'Debe iniciar sesión para cambiar la contraseña.'
      )
    }

    throw new Error(
      'El cambio de contraseña todavía no está disponible en este servidor.'
    )
  }

  const logout = async () => {
    try {
      // POST /auth/logout.
      // La cookie HttpOnly es administrada por el navegador.
      await authService.logout()
    } finally {
      user.value = null
      initialized.value = true

      const [
        { useUserStore },
        { useInstitutionStore },
        { useNotificationStore },
        { useCitizenReportStore },
        { useAlertStore },
        { useReadingStore },
      ] = await Promise.all([
        import('./user.store'),
        import('./institution.store'),
        import('./notification.store'),
        import('./citizen-report.store'),
        import('./alert.store'),
        import('./reading.store'),
      ])

      useUserStore().users = []
      useInstitutionStore().institutions = []

      useNotificationStore().notifications = []
      useNotificationStore().unreadCount = 0

      useCitizenReportStore().reports = []
      useAlertStore().alerts = []
      useReadingStore().readings = []
    }
  }

  return {
    user,
    loading,
    role,
    initialized,
    isAuthenticated,
    initialize,
    login,
    registerCitizen,
    changePassword,
    logout,
  }
})
