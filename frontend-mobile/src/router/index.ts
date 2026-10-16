import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

import DemoSelectionView from '../views/DemoSelectionView.vue'
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

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/demo' },
  { path: '/demo', component: DemoSelectionView },
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
  { path: '/:pathMatch(.*)*', redirect: '/demo' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const role = authStore.role

  if (!role && to.path !== '/demo') {
    return '/demo'
  }

  if (to.path.startsWith('/institucion') && role !== 'INSTITUTION_USER') {
    return role === 'CITIZEN' ? '/ciudadano/inicio' : '/demo'
  }

  if (to.path.startsWith('/ciudadano') && role !== 'CITIZEN') {
    return role === 'INSTITUTION_USER' ? '/institucion/inicio' : '/demo'
  }

  return true
})

export default router
