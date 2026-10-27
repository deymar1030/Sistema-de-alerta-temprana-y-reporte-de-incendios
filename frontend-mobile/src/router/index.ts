import {
  createRouter,
  createWebHistory,
} from '@ionic/vue-router'

import type {
  RouteRecordRaw,
} from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/citizen/home',
    name: 'CitizenHomeAlias',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/CitizenHomeView.vue'),
  },
  {
    path: '/ciudadano/inicio',
    name: 'CitizenHome',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/CitizenHomeView.vue'),
  },
  {
    path: '/citizen/report',
    name: 'CitizenReportAlias',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/CitizenReportView.vue'),
  },
  {
    path: '/ciudadano/reportar',
    name: 'CitizenReport',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/CitizenReportView.vue'),
  },
  {
    path: '/citizen/reports',
    name: 'CitizenReportsAlias',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/CitizenReportsView.vue'),
  },
  {
    path: '/ciudadano/reportes',
    name: 'CitizenReports',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/CitizenReportsView.vue'),
  },
  {
    path: '/citizen/reports/:id',
    name: 'CitizenReportDetailAlias',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/CitizenReportDetailView.vue'),
  },
  {
    path: '/ciudadano/reportes/:id',
    name: 'CitizenReportDetail',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/CitizenReportDetailView.vue'),
  },
  {
    path: '/citizen/notifications',
    name: 'CitizenNotificationsAlias',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/NotificationsView.vue'),
  },
  {
    path: '/ciudadano/notificaciones',
    name: 'CitizenNotifications',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/NotificationsView.vue'),
  },
  {
    path: '/citizen/profile',
    name: 'CitizenProfileAlias',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/CitizenProfileView.vue'),
  },
  {
    path: '/ciudadano/perfil',
    name: 'CitizenProfile',
    meta: { requiresAuth: true, allowedRoles: ['CIUDADANO'] },
    component: () => import('../views/CitizenProfileView.vue'),
  },
  {
    path: '/institucion/inicio',
    name: 'InstitutionHome',
    meta: { requiresAuth: true, allowedRoles: ['OPERATIVO', 'JEFE_INSTITUCION'] },
    component: () => import('../views/InstitutionHomeView.vue'),
  },
  {
    path: '/institucion/notificaciones',
    name: 'InstitutionNotifications',
    meta: { requiresAuth: true, allowedRoles: ['OPERATIVO', 'JEFE_INSTITUCION'] },
    component: () => import('../views/NotificationsView.vue'),
  },
  {
    path: '/institucion/emergencias/:id',
    name: 'InstitutionEmergencyDetail',
    meta: { requiresAuth: true, allowedRoles: ['OPERATIVO', 'JEFE_INSTITUCION'] },
    component: () => import('../views/InstitutionEmergencyDetailView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const user = await authStore.initialize()

  if (to.path === '/login' || to.path === '/register') {
    if (user && user.role === 'CIUDADANO') {
      next('/citizen/home')
      return
    }

    if (user && (user.role === 'OPERATIVO' || user.role === 'JEFE_INSTITUCION')) {
      next('/institucion/inicio')
      return
    }

    next()
    return
  }

  const requiresAuth = Boolean(to.meta.requiresAuth)
  if (!requiresAuth) {
    next()
    return
  }

  if (!user) {
    next('/login')
    return
  }

  const allowedRoles = Array.isArray(to.meta.allowedRoles) ? to.meta.allowedRoles as string[] : []
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN' || user.role === 'JEFE_INSTITUCION' || user.role === 'OPERATIVO') {
      authStore.setError('Este usuario debe ingresar desde la plataforma web.')
      next('/login')
      return
    }

    next(user.role === 'CIUDADANO' ? '/citizen/home' : '/institucion/inicio')
    return
  }

  next()
})

export default router