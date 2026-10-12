import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import 'leaflet/dist/leaflet.css'
import './style.css'

import App from './App.vue'
import { routes } from './router'
import { useAuthStore } from './stores/auth.store'
import { isWebUserRole, type WebUserRole, type UserRole } from './types'

const app = createApp(App)

const pinia = createPinia()

const router = createRouter({
  history: createWebHistory(),
  routes,
})

app.use(pinia)
app.use(router)

const fallback: Record<WebUserRole, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  CENTRAL_OPERATOR: '/central/dashboard',
  INSTITUTION_ADMIN: '/institucion/dashboard',
}

const homeForRole = (role: UserRole | null | undefined) => {
  if (!role) return '/login'

  if (role === 'SUPER_ADMIN') {
    return '/super-admin/dashboard'
  }

  if (role === 'CITIZEN') {
    return '/ciudadano/inicio'
  }

  if (role === 'INSTITUTION_USER') {
    return '/institucion/inicio'
  }

  if (isWebUserRole(role)) {
    return fallback[role]
  }

  return '/login'
}

const isCompatibleRedirect = (redirect: string | undefined, role: UserRole | null | undefined) => {
  if (!redirect || !redirect.startsWith('/')) return false

  const normalized = redirect.split('?')[0]

  switch (role) {
    case 'SUPER_ADMIN':
      return normalized.startsWith('/super-admin')
    case 'CENTRAL_OPERATOR':
      return normalized.startsWith('/central')
    case 'INSTITUTION_ADMIN':
    case 'INSTITUTION_USER':
      return normalized.startsWith('/institucion')
    case 'CITIZEN':
      return normalized.startsWith('/ciudadano')
    default:
      return false
  }
}

const authStore = useAuthStore(pinia)

router.beforeEach(async (to) => {
  await authStore.initialize()

  const user = authStore.user
  const effectiveRole = authStore.role

  if (!user) {
    if (to.path === '/login') {
      return true
    }

    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (!effectiveRole) {
    await authStore.logout()

    return {
      path: '/login',
      query: {
        access: 'mobile',
      },
    }
  }

  if (to.path === '/login') {
    if (to.query.access === 'mobile') {
      return true
    }

    const requestedRedirect = typeof to.query.redirect === 'string' ? to.query.redirect : undefined
    if (requestedRedirect && isCompatibleRedirect(requestedRedirect, effectiveRole)) {
      return requestedRedirect
    }

    return homeForRole(effectiveRole)
  }

  const allowedRoles = to.meta.roles as UserRole[] | undefined

  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    return homeForRole(effectiveRole)
  }

  return true
})

app.mount('#app')