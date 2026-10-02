type ValueGuard<T> = (value: unknown) => value is T

const getStorage = (): Storage | undefined => {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

export const storageService = {
  read<T>(key: string, fallback: T, isValid: ValueGuard<T>): T {
    try {
      const storage = getStorage()
      const serialized = storage?.getItem(key)
      if (!serialized) return fallback
      const value: unknown = JSON.parse(serialized)
      return isValid(value) ? value : fallback
    } catch {
      return fallback
    }
  },

  write<T>(key: string, value: T): boolean {
    try {
      const storage = getStorage()
      if (!storage) return false
      storage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  remove(key: string): boolean {
    try {
      const storage = getStorage()
      if (!storage) return false
      storage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
}
