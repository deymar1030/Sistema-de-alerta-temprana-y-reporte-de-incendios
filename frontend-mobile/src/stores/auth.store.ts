import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '../types'
import { authService } from '../services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value))
  const role = computed(() => user.value?.role ?? null)

  function setError(message: string | null) {
    error.value = message
  }

  async function initialize() {
    if (initialized.value) return user.value

    initialized.value = true
    loading.value = true

    try {
      user.value = await authService.getCurrentUser()
      return user.value
    } catch (err) {
      user.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(email, password)
      user.value = response
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión.'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(payload: {
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
  }) {
    loading.value = true
    error.value = null

    try {
      const newUser = await authService.register(payload)
      return newUser
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la cuenta.'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      user.value = null
      initialized.value = false
      error.value = null
      // Evitar datos privados de la cuenta anterior en una sesión posterior.
      const [{ useAlertStore }, { useCitizenReportStore }, { useNotificationStore }] = await Promise.all([
        import('./alert.store'), import('./citizen-report.store'), import('./notification.store'),
      ])
      useAlertStore().clear()
      useCitizenReportStore().clear()
      useNotificationStore().clear()
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    role,
    setError,
    initialize,
    login,
    register,
    logout,
  }
})
