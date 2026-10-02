import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authService } from '../services/auth.service'
import { storageService } from '../services/storage.service'
import type { User, UserRole } from '../types'

const STORAGE_KEY = 'alerta-mobile-role'

export const useAuthStore = defineStore('auth', () => {
  const isUserRole = (value: unknown): value is UserRole => value === 'INSTITUTION_USER' || value === 'CITIZEN'
  const role = ref<UserRole | null>(storageService.read(STORAGE_KEY, null, isUserRole))
  const user = ref<User | null>(null)

  if (role.value) {
    void authService.loginDemo(role.value).then((match) => {
      user.value = match ?? null
    })
  }

  const currentRole = computed(() => role.value)

  const setRole = async (nextRole: UserRole) => {
    role.value = nextRole
    storageService.write(STORAGE_KEY, nextRole)
    const match = await authService.loginDemo(nextRole)
    user.value = match ?? null
  }

  const clearRole = () => {
    role.value = null
    user.value = null
    storageService.remove(STORAGE_KEY)
  }

  return {
    role,
    user,
    currentRole,
    setRole,
    clearRole,
  }
})
