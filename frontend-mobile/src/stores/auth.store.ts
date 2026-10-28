import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authService } from '../services/auth.service'
import { connectRealtime, disconnectRealtime } from '../services/realtime'
import type { User } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  
  const currentRole = computed(() => user.value?.role ?? null)
  const checkSession = async () => {
    try {
      const sessionUser = await authService.getMe()
      if (sessionUser) {
        user.value = sessionUser
        connectRealtime()
      }
    } catch (error) {
      user.value = null
    }
  }

  // 2. Iniciar sesión real (POST /auth/login)
  const login = async (correo: string, contrasena: string) => {
    const loggedUser = await authService.login(correo, contrasena)
    user.value = loggedUser
    connectRealtime()
    return loggedUser
  }

  // 3. Cerrar sesión (POST /auth/logout)
  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      user.value = null
      disconnectRealtime()
    }
  }

  return {
    user,
    currentRole,
    checkSession,
    login,
    logout,
  }
})