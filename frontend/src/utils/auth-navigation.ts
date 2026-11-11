import type { UserRole } from '../types'

export function homeForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case 'ADMIN': return '/super-admin/dashboard'
    case 'AUDITOR': return '/auditor/auditoria'
    case 'JEFE_INSTITUCION':
    case 'OPERATIVO': return '/institucion/dashboard'
    case 'CIUDADANO': return '/ciudadano/inicio'
    default: return '/login'
  }
}

export function isCompatibleRedirect(redirect: string | undefined, role: UserRole | null | undefined): boolean {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//') || /[\\\u0000-\u0020]/.test(redirect)) return false
  const root = homeForRole(role).split('/')[1]
  if (!root || root === 'login') return false
  const pathname = redirect.split(/[?#]/)[0]!
  return pathname === `/${root}` || pathname.startsWith(`/${root}/`)
}
