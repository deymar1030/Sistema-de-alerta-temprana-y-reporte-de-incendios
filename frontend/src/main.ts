import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import 'leaflet/dist/leaflet.css'
import './style.css'
import App from './App.vue'
import { routes } from './router'
import { useAuthStore } from './stores/auth.store'
import { isWebUserRole, type UserRole, type WebUserRole } from './types'

const app = createApp(App)
const pinia = createPinia()
const router = createRouter({ history: createWebHistory(), routes })
app.use(pinia)
app.use(router)

const fallback: Record<WebUserRole, string> = {
  CENTRAL_OPERATOR: '/central/dashboard',
  INSTITUTION_ADMIN: '/admin-institucion/dashboard',
}

const homeForRole = (role: UserRole) => isWebUserRole(role) ? fallback[role] : '/login'

const authStore = useAuthStore(pinia)
router.beforeEach(async (to) => {
  await authStore.initialize()
  if (authStore.user && !isWebUserRole(authStore.role)) {
    await authStore.logout()
    return '/login'
  }
  if (to.path !== '/login' && !authStore.user) return '/login'
  if (to.path === '/login' && authStore.user && to.query.access !== 'mobile') return homeForRole(authStore.role)
  const allowedRoles = to.meta.roles as UserRole[] | undefined
  if (allowedRoles && !allowedRoles.includes(authStore.role)) return homeForRole(authStore.role)
})

app.mount('#app')
