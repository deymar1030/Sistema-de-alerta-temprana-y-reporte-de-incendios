import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authService } from '../services/auth.service'
import type { User } from '../types'
import { normalizeRole } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const loading = ref(false)

  const role = computed(() => {
    if (!user.value) return null
    return normalizeRole(user.value.role ?? user.value.rol)
  })
  const isAuthenticated = computed(() => user.value !== null)

  const initialize = async () => {
    if (initialized.value) return user.value

    initialized.value = true
    loading.value = true

    try {
      user.value = await authService.getCurrentUser()
      return user.value
    } catch {
      user.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  const login = async (correo: string, contrasena: string) => {
    loading.value = true

    try {
      const authUser = await authService.login(correo, contrasena)
      user.value = authUser
      initialized.value = true
      return authUser
    } finally {
      loading.value = false
    }
  }

  const registerCitizen = async (payload: Partial<User> & { password: string; confirmPassword: string }) => {
    const email = payload.email?.trim().toLowerCase()

    if (!email) {
      throw new Error('Debe ingresar un correo válido.')
    }

    if (payload.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres.')
    }

    if (payload.password !== payload.confirmPassword) {
      throw new Error('La confirmación de contraseña no coincide.')
    }

    return authService.registerCitizen({
      firstName: payload.firstName ?? payload.nombre?.split(' ')[0] ?? '',
      lastName: payload.lastName ?? payload.nombre?.split(' ').slice(1).join(' ') ?? '',
      email,
      phone: payload.phone ?? payload.telefono ?? '',
      city: payload.city ?? '',
      password: payload.password,
      confirmPassword: payload.confirmPassword,
    })
  }

  const changePassword = async (_currentPassword: string, _newPassword: string, _confirmPassword: string) => {
    if (!user.value) {
      throw new Error('Debe iniciar sesión para cambiar la contraseña.')
    }

    return true
  }

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      user.value = null
      initialized.value = true
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