import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import 'leaflet/dist/leaflet.css'
import './style.css'
import './styles/alerta-modulos-2026.css'

import App from './App.vue'
import { routes } from './router'
import { useAuthStore } from './stores/auth.store'
import type { UserRole } from './types'
import { homeForRole, isCompatibleRedirect } from './utils/auth-navigation'

const app = createApp(App)

const pinia = createPinia()

const router = createRouter({
  history: createWebHistory(),
  routes,
})

app.use(pinia)
app.use(router)

const authStore = useAuthStore(pinia)

router.beforeEach(async (to) => {
  if (authStore.mfaPending) {
    if (to.path === '/mfa') return true
    return { path: '/mfa', query: { redirect: typeof to.query.redirect === 'string' ? to.query.redirect : to.fullPath } }
  }
  await authStore.initialize()

  const user = authStore.user
  const effectiveRole = authStore.role

  if (!user) {
    if (to.path === '/mfa') return { path: '/login', query: { ...(typeof to.query.redirect === 'string' ? { redirect: to.query.redirect } : {}), mfa: 'restart' } }
    if (['/login', '/ciudadano/welcome', '/ciudadano/login', '/ciudadano/registro', '/ciudadano/recuperar-password'].includes(to.path)) {
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

  // AUDITOR no tiene pantallas ciudadanas, generales ni institucionales.
  if (effectiveRole === 'AUDITOR' && !to.path.startsWith('/auditor')) {
    return '/auditor/auditoria'
  }

  if (to.path === '/login' || to.path === '/mfa') {
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