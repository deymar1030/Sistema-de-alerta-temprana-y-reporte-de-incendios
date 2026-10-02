import { demoUsers } from '../mocks/users'
import type { User, UserRole } from '../types'

export const authService = {
  async loginDemo(role: UserRole): Promise<User | undefined> {
    return Promise.resolve(demoUsers.find((user) => user.role === role))
  },
}
