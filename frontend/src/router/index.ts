import type { RouteRecordRaw } from 'vue-router'
import type { WebUserRole } from '../types'

import LoginView from '../views/LoginView.vue'
import MonitoringLayout from '../layouts/MonitoringLayout.vue'

// Vistas de monitoreo existentes
import DashboardView from '../views/DashboardView.vue'
import SensorsView from '../views/SensorsView.vue'
import ReadingsView from '../views/ReadingsView.vue'
import DetectionEngineView from '../views/DetectionEngineView.vue'
import AlertsView from '../views/AlertsView.vue'
import LocationsView from '../views/LocationsView.vue'
import SettingsView from '../views/SettingsView.vue'

// Operador Central
import CentralDashboardView from '../views/CentralDashboardView.vue'
import CentralAlertsView from '../views/CentralAlertsView.vue'
import CentralIncidentsView from '../views/CentralIncidentsView.vue'
import CentralInstitutionsView from '../views/CentralInstitutionsView.vue'
import CentralHistoryView from '../views/CentralHistoryView.vue'

// Institución
import InstitutionAdminDashboardView from '../views/InstitutionAdminDashboardView.vue'
import InstitutionAlertsView from '../views/InstitutionAlertsView.vue'
import InstitutionAlertDetailView from '../views/InstitutionAlertDetailView.vue'
import InstitutionHistoryView from '../views/InstitutionHistoryView.vue'
import InstitutionReportsView from '../views/InstitutionReportsView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'

const centralRoles: WebUserRole[] = ['CENTRAL_OPERATOR']
const institutionAdminRoles: WebUserRole[] = ['INSTITUTION_ADMIN']

export const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: LoginView, meta: { title: 'Acceso' } },

  // Rutas heredadas: se conservan para no romper enlaces del prototipo anterior.
  {
    path: '/', component: MonitoringLayout, meta: { roles: centralRoles }, children: [
      { path: '', redirect: '/central/dashboard' },
      { path: 'dashboard-anterior', name: 'legacy-dashboard', component: DashboardView, meta: { roles: centralRoles, title: 'Dashboard anterior' } },
      { path: 'sensores', name: 'sensors', component: SensorsView, meta: { roles: centralRoles, title: 'Sensores' } },
      { path: 'sensores/:id', name: 'sensor-detail', component: SensorsView, meta: { roles: centralRoles, title: 'Detalle de sensor' } },
      { path: 'lecturas', name: 'readings', component: ReadingsView, meta: { roles: centralRoles, title: 'Lecturas' } },
      { path: 'motor', name: 'detection', component: DetectionEngineView, meta: { roles: centralRoles, title: 'Motor de Detección' } },
      { path: 'alertas', name: 'alerts', component: AlertsView, meta: { roles: centralRoles, title: 'Alertas técnicas' } },
      { path: 'ubicaciones', name: 'locations', component: LocationsView, meta: { roles: centralRoles, title: 'Ubicaciones' } },
      { path: 'configuracion', name: 'settings', component: SettingsView, meta: { roles: centralRoles, title: 'Configuración' } },
    ],
  },

  {
    path: '/central', component: MonitoringLayout, meta: { roles: centralRoles }, children: [
      { path: '', redirect: '/central/dashboard' },
      { path: 'dashboard', name: 'central-dashboard', component: CentralDashboardView, meta: { roles: centralRoles, title: 'Dashboard' } },
      { path: 'alertas', name: 'central-alerts', component: CentralAlertsView, meta: { roles: centralRoles, title: 'Alertas por validar' } },
      { path: 'incidentes', name: 'central-incidents', component: CentralIncidentsView, meta: { roles: centralRoles, title: 'Incidentes' } },
      { path: 'sensores', name: 'central-sensors', component: SensorsView, meta: { roles: centralRoles, title: 'Sensores' } },
      { path: 'instituciones', name: 'central-institutions', component: CentralInstitutionsView, meta: { roles: centralRoles, title: 'Instituciones' } },
      { path: 'historial', name: 'central-history', component: CentralHistoryView, meta: { roles: centralRoles, title: 'Historial' } },
      { path: 'configuracion', name: 'central-settings', component: SettingsView, meta: { roles: centralRoles, title: 'Configuración' } },
      // Compatibilidad con enlaces generados por la versión anterior.
      { path: 'despacho', redirect: '/central/alertas' },
      { path: 'ubicaciones', redirect: '/central/dashboard' },
      { path: 'informes', redirect: '/central/historial' },
    ],
  },

  {
    path: '/admin-institucion', component: MonitoringLayout, meta: { roles: institutionAdminRoles }, children: [
      { path: '', redirect: '/admin-institucion/dashboard' },
      { path: 'dashboard', name: 'institution-admin-dashboard', component: InstitutionAdminDashboardView, meta: { roles: institutionAdminRoles, title: 'Dashboard institucional' } },
      { path: 'alertas', name: 'institution-admin-alerts', component: InstitutionAlertsView, meta: { roles: institutionAdminRoles, title: 'Alertas recibidas' } },
      { path: 'alertas/:id', name: 'institution-admin-alert-detail', component: InstitutionAlertDetailView, meta: { roles: institutionAdminRoles, title: 'Detalle de alerta' } },
      { path: 'usuarios', name: 'institution-users', component: AdminUsersView, meta: { roles: institutionAdminRoles, title: 'Personal y usuarios' } },
      { path: 'informes', name: 'institution-reports', component: InstitutionReportsView, meta: { roles: institutionAdminRoles, title: 'Informes de Atención' } },
      { path: 'historial', name: 'institution-history', component: InstitutionHistoryView, meta: { roles: institutionAdminRoles, title: 'Historial' } },
      { path: 'configuracion', name: 'institution-settings', component: SettingsView, meta: { roles: institutionAdminRoles, title: 'Configuración' } },
    ],
  },

  { path: '/institucion/:pathMatch(.*)*', redirect: { path: '/login', query: { access: 'mobile' } } },
  { path: '/ciudadano/:pathMatch(.*)*', redirect: { path: '/login', query: { access: 'mobile' } } },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]
