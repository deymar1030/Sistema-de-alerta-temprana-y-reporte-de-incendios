import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User, UserRole } from '../types'
import { normalizeRole, normalizeStatus } from '../types'
import { usersMock } from '../mocks/users'
import { userService, type CreateUserInput, type UpdateUserInput } from '../services/user.service'

const normalizeUser = (user: Partial<User> & Record<string, any>): User => ({
  id: String(user.id ?? `USR-${Math.random().toString(36).slice(2, 10)}`),
  nombre: user.nombre ?? (([user.firstName, user.lastName].filter(Boolean) as string[]).join(' ').trim() || user.email || 'Usuario'),
  email: user.email ?? user.correo ?? 'sin-email@alerta.bo',
  role: normalizeRole(user.role ?? user.rol),
  rol: normalizeRole(user.role ?? user.rol),
  institutionId: user.institutionId ?? user.institucionId ?? null,
  institucionId: user.institutionId ?? user.institucionId ?? null,
  phone: user.phone ?? user.telefono,
  city: user.city ?? user.ciudad,
  activo: user.activo ?? normalizeStatus(user.status) === 'ACTIVE',
  status: normalizeStatus(user.status ?? (user.activo === false ? 'INACTIVE' : 'ACTIVE')),
  createdAt: user.createdAt ?? new Date().toISOString(),
})

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const useMocks = import.meta.env.VITE_USE_MOCKS === 'true'

  const seedUsers = () => {
    users.value = useMocks ? usersMock.map(normalizeUser) : []
  }

  const institutionUsers = computed(() => users.value.filter((user) => normalizeRole(user.role ?? user.rol) !== 'CENTRAL_OPERATOR'))

  const getUsers = async () => users.value
  const getUsersByRole = (role: UserRole) => users.value.filter((user) => normalizeRole(user.role ?? user.rol) === role)

  const fetchUsers = async () => {
    loading.value = true
    error.value = null

    try {
      const remoteUsers = await userService.getUsers()
      users.value = remoteUsers.map(normalizeUser)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.'
      if (useMocks) {
        seedUsers()
      } else {
        users.value = []
      }
    } finally {
      loading.value = false
    }
  }

  const createUser = async (input: CreateUserInput) => {
    const created = await userService.createUser(input)
    const normalized = normalizeUser(created)
    users.value = [normalized, ...users.value.filter((user) => user.id !== normalized.id)]
    return normalized
  }

  const updateUser = async (id: string, input: UpdateUserInput) => {
    const updated = await userService.updateUser(id, input)
    const normalized = normalizeUser(updated)
    users.value = users.value.map((user) => (user.id === id ? { ...normalizeUser(user), ...normalized } : user))
    return normalized
  }

  const deactivateUser = async (id: string) => {
    const updated = await userService.deactivateUser(id)
    const normalized = normalizeUser(updated)
    users.value = users.value.map((user) => (user.id === id ? { ...normalizeUser(user), ...normalized } : user))
    return normalized
  }

  const reactivateUser = async (id: string) => {
    const updated = await userService.reactivateUser(id)
    const normalized = normalizeUser(updated)
    users.value = users.value.map((user) => (user.id === id ? { ...normalizeUser(user), ...normalized } : user))
    return normalized
  }

  return {
    users,
    institutionUsers,
    loading,
    error,
    getUsers,
    getUsersByRole,
    fetchUsers,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
  }
})
