import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authService } from '../services/auth.service'
import type { User, UserRole } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const role = computed<UserRole>(() => user.value?.rol ?? 'CENTRAL_OPERATOR')

  const initialize = async () => {
    if (initialized.value) return
    user.value = await authService.getCurrentUser()
    initialized.value = true
  }
  const loginDemo = async (email: string) => {
    user.value = await authService.loginDemo(email)
    initialized.value = true
    return user.value
  }
  const switchDemoRole = async (nextRole: UserRole) => {
    user.value = await authService.switchDemoRole(nextRole)
    initialized.value = true
  }
  const logout = async () => {
    await authService.logout()
    user.value = null
    initialized.value = true
  }
  return { user, role, initialized, initialize, loginDemo, switchDemoRole, logout }
})
