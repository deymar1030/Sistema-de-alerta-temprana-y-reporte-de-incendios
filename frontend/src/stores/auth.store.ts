
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { authService, AuthHttpError } from '../services/auth.service'
import type { User } from '../types'
import { normalizeRole } from '../types'
import type { MfaState } from '../utils/mfa'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const loading = ref(false)

  const mfaPending = ref<{ state: MfaState; email: string; expiresAt: number } | null>(null)
  let authRevision = 0

  function clearMfa() {
    authRevision++
    mfaPending.value = null
    user.value = null
    initialized.value = true
  }

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
    if (mfaPending.value) return null
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

  const login = async (correo: string, contrasena: string): Promise<User | null> => {
    if (loading.value) throw new Error('Espera a que termine la solicitud actual.')
    clearMfa()
    const revision = authRevision
    loading.value = true
    try {
      const result = await authService.login(correo, contrasena)
      if (revision !== authRevision) return null
      if (result.kind === 'mfa') {
        mfaPending.value = { state: result.state, email: correo.trim(), expiresAt: Date.now() + 5 * 60_000 }
        // /auth/me rechaza una sesión pendiente y borra su cookie. No consultarlo aquí.
        return null
      }
      const confirmed = USE_MOCKS ? result.user : await authService.getCurrentUser()
      if (revision !== authRevision) return null
      if (!confirmed || String(confirmed.id) !== String(result.user.id)) {
        throw new Error('El servidor no confirmó la sesión de esta cuenta. Inicia sesión nuevamente.')
      }
      user.value = confirmed
      return confirmed
    } finally {
      if (revision === authRevision) loading.value = false
    }
  }

  const verifyMfa = async (codigo: string): Promise<User> => {
    if (loading.value) throw new Error('Espera a que termine la verificación actual.')
    if (!mfaPending.value || Date.now() >= mfaPending.value.expiresAt) {
      clearMfa()
      throw new Error('La verificación expiró. Inicia sesión nuevamente.')
    }
    const revision = authRevision
    loading.value = true
    try {
      const verified = await authService.verifyMfa(codigo)
      if (revision !== authRevision) throw new Error('La verificación ya no está vigente.')
      const confirmed = await authService.getCurrentUser()
      if (revision !== authRevision) throw new Error('La verificación ya no está vigente.')
      if (!confirmed || String(confirmed.id) !== String(verified.id)) {
        clearMfa()
        throw new Error('No se pudo confirmar la sesión verificada. Inicia sesión nuevamente.')
      }
      mfaPending.value = null
      user.value = confirmed
      initialized.value = true
      return confirmed
    } catch (error) {
      if (revision === authRevision && error instanceof AuthHttpError &&
          (error.status === 403 || (error.status === 401 && error.code !== 'MFA_INVALIDO'))) clearMfa()
      throw error
    } finally { loading.value = false }
  }

  const cancelMfa = async () => {
    if (loading.value) return
    clearMfa()
    loading.value = true
    try { await authService.logout() } finally { loading.value = false }
  }

  /** Recarga la cuenta logueada desde la cookie de sesion del backend. */
  const refreshProfile = async (): Promise<User> => {
    if (!user.value) throw new Error('Debes iniciar sesion para editar tus datos.')
    const currentId = String(user.value.id)
    const fresh = await authService.getCurrentUser()
    if (!fresh) throw new Error('El servidor no pudo confirmar tu sesion despues del cambio.')
    if (String(fresh.id) !== currentId) {
      throw new Error('El servidor devolvio una cuenta distinta a la autenticada.')
    }
    user.value = fresh
    return fresh
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
    clearMfa()
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
        { useAuditStore },
        { useChatStore },
      ] = await Promise.all([
        import('./user.store'),
        import('./institution.store'),
        import('./notification.store'),
        import('./citizen-report.store'),
        import('./alert.store'),
        import('./reading.store'),
        import('./audit.store'),
        import('./chat.store'),
      ])

      useUserStore().users = []
      useInstitutionStore().institutions = []

      useNotificationStore().notifications = []
      useNotificationStore().unreadCount = 0

      useCitizenReportStore().reports = []
      useAlertStore().alerts = []
      useReadingStore().readings = []
      useAuditStore().clear()
      useChatStore().clear()
    }
  }

  return {
    user,
    loading,
    role,
    initialized,
    isAuthenticated,
    mfaPending,
    verifyMfa,
    cancelMfa,
    clearMfa,
    initialize,
    login,
    registerCitizen,
    refreshProfile,
    changePassword,
    logout,
  }
})