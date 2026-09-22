import { usersMock } from '../mocks/users'
import type { User, UserRole } from '../types'

const DEMO_USER_KEY = 'alerta-demo-user'

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    const storedId = localStorage.getItem(DEMO_USER_KEY)
    if (!storedId) return null
    return usersMock.find((user) => user.id === storedId) ?? null
  },
  async loginDemo(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase()
    const user = usersMock.find((candidate) => candidate.email.toLowerCase() === normalized) ?? null
    if (user) localStorage.setItem(DEMO_USER_KEY, user.id)
    return user
  },
  async switchDemoRole(role: UserRole): Promise<User> {
    const user = usersMock.find((candidate) => candidate.rol === role) ?? usersMock[0]
    localStorage.setItem(DEMO_USER_KEY, user.id)
    return user
  },
  async logout(): Promise<void> { localStorage.removeItem(DEMO_USER_KEY) },
}
