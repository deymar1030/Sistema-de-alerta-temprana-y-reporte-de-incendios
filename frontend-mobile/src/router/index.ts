import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

import LoginView from '../views/LoginView.vue'
import InstitutionLayout from '../layouts/InstitutionLayout.vue'
import InstitutionHomeView from '../views/institution/InstitutionHomeView.vue'
import InstitutionAlertsView from '../views/institution/InstitutionAlertsView.vue'
import InstitutionEmergencyDetailView from '../views/institution/InstitutionEmergencyDetailView.vue'
import InstitutionHistoryView from '../views/institution/InstitutionHistoryView.vue'
import CitizenLayout from '../layouts/CitizenLayout.vue'
import CitizenHomeView from '../views/citizen/CitizenHomeView.vue'
import CitizenReportView from '../views/citizen/CitizenReportView.vue'
import CitizenReportsView from '../views/citizen/CitizenReportsView.vue'
import CitizenNotificationsView from '../views/citizen/CitizenNotificationsView.vue'
import CitizenInstructionsView from '../views/citizen/CitizenInstructionsView.vue'
import RegisterView from '../views/RegisterView.vue'

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/registro', name: 'Registro', component: RegisterView },
  {
    path: '/institucion',
    component: InstitutionLayout,
    children: [
      { path: '', redirect: '/institucion/inicio' },
      { path: 'inicio', component: InstitutionHomeView },
      { path: 'alertas', component: InstitutionAlertsView },
      { path: 'emergencia/:id', component: InstitutionEmergencyDetailView },
      { path: 'historial', component: InstitutionHistoryView },
    ],
  },
  {
    path: '/ciudadano',
    component: CitizenLayout,
    children: [
      { path: '', redirect: '/ciudadano/inicio' },
      { path: 'inicio', component: CitizenHomeView },
      { path: 'reportar', component: CitizenReportView },
      { path: 'mis-reportes', component: CitizenReportsView },
      { path: 'notificaciones', component: CitizenNotificationsView },
      { path: 'instrucciones', component: CitizenInstructionsView },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const role = authStore.currentRole

  // Definir rutas públicas que no requieren autenticación
  const publicPages = ['/login', '/registro']
  const authRequired = !publicPages.includes(to.path)

  // Redirigir al login si intenta acceder a una ruta protegida sin sesión
  if (authRequired && !role) {
    return '/login'
  }

  // Prevenir que un rol acceda a las rutas del otro
  if (to.path.startsWith('/institucion') && role !== 'INSTITUTION_USER') {
    return role === 'CITIZEN' ? '/ciudadano/inicio' : '/login'
  }

  if (to.path.startsWith('/ciudadano') && role !== 'CITIZEN') {
    return role === 'INSTITUTION_USER' ? '/institucion/inicio' : '/login'
  }

  // Si ya tiene sesión, no dejarlo entrar a Login o Registro
  if (!authRequired && role) {
    return role === 'INSTITUTION_USER' ? '/institucion/inicio' : '/ciudadano/inicio'
  }

  return true
})

export default router