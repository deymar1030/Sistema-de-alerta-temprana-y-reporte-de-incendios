import type { RouteRecordRaw } from 'vue-router'
import type { UserRole } from '../types'

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
import CentralUsersView from '../views/CentralUsersView.vue'

// Institución
import InstitutionAdminDashboardView from '../views/InstitutionAdminDashboardView.vue'
import InstitutionAlertsView from '../views/InstitutionAlertsView.vue'
import InstitutionAlertDetailView from '../views/InstitutionAlertDetailView.vue'
import InstitutionHistoryView from '../views/InstitutionHistoryView.vue'
import InstitutionReportsView from '../views/InstitutionReportsView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'

// Ciudadano
import CitizenWelcomeView from '../views/CitizenWelcomeView.vue'
import CitizenLoginView from '../views/CitizenLoginView.vue'
import CitizenRegisterView from '../views/CitizenRegisterView.vue'
import CitizenForgotPasswordView from '../views/CitizenForgotPasswordView.vue'
import CitizenHomeView from '../views/CitizenHomeView.vue'
import CitizenReportView from '../views/CitizenReportView.vue'
import CitizenReportsView from '../views/CitizenReportsView.vue'
import CitizenReportDetailView from '../views/CitizenReportDetailView.vue'
import CitizenNotificationsView from '../views/CitizenNotificationsView.vue'
import CitizenEmergencyGuideView from '../views/CitizenEmergencyGuideView.vue'
import CitizenProfileView from '../views/CitizenProfileView.vue'
import CitizenEditProfileView from '../views/CitizenEditProfileView.vue'
import CitizenChangePasswordView from '../views/CitizenChangePasswordView.vue'

// Super admin
import SuperAdminDashboardView from '../views/SuperAdminDashboardView.vue'
import SuperAdminUsersView from '../views/SuperAdminUsersView.vue'
import SuperAdminInstitutionsView from '../views/SuperAdminInstitutionsView.vue'
import SuperAdminAlertsView from '../views/SuperAdminAlertsView.vue'
import SuperAdminIncidentsView from '../views/SuperAdminIncidentsView.vue'
import SuperAdminAuditView from '../views/SuperAdminAuditView.vue'
import SuperAdminSettingsView from '../views/SuperAdminSettingsView.vue'

const centralRoles: UserRole[] = ['CENTRAL_OPERATOR']
const institutionAdminRoles: UserRole[] = ['INSTITUTION_ADMIN', 'INSTITUTION_USER']
const citizenRoles: UserRole[] = ['CITIZEN']
const superAdminRoles: UserRole[] = ['SUPER_ADMIN']

export const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: LoginView, meta: { title: 'Acceso' } },
  { path: '/ciudadano/welcome', name: 'citizen-welcome', component: CitizenWelcomeView, meta: { title: 'Bienvenida ciudadana' } },
  { path: '/ciudadano/login', name: 'citizen-login', component: CitizenLoginView, meta: { title: 'Iniciar sesión' } },
  { path: '/ciudadano/registro', name: 'citizen-register', component: CitizenRegisterView, meta: { title: 'Registrarse' } },
  { path: '/ciudadano/recuperar-password', name: 'citizen-recover-password', component: CitizenForgotPasswordView, meta: { title: 'Recuperar contraseña' } },
  { path: '/ciudadano/inicio', name: 'citizen-home', component: CitizenHomeView, meta: { roles: citizenRoles, title: 'Inicio ciudadano' } },
  { path: '/ciudadano/reportar', name: 'citizen-report', component: CitizenReportView, meta: { roles: citizenRoles, title: 'Reportar incendio' } },
  { path: '/ciudadano/mis-reportes', name: 'citizen-reports', component: CitizenReportsView, meta: { roles: citizenRoles, title: 'Mis reportes' } },
  { path: '/ciudadano/reporte/:id', name: 'citizen-report-detail', component: CitizenReportDetailView, meta: { roles: citizenRoles, title: 'Detalle de reporte' } },
  { path: '/ciudadano/notificaciones', name: 'citizen-notifications', component: CitizenNotificationsView, meta: { roles: citizenRoles, title: 'Notificaciones' } },
  { path: '/ciudadano/instrucciones', name: 'citizen-emergency-guide', component: CitizenEmergencyGuideView, meta: { roles: citizenRoles, title: 'Instrucciones de emergencia' } },
  { path: '/ciudadano/perfil', name: 'citizen-profile', component: CitizenProfileView, meta: { roles: citizenRoles, title: 'Perfil' } },
  { path: '/ciudadano/perfil/editar', name: 'citizen-edit-profile', component: CitizenEditProfileView, meta: { roles: citizenRoles, title: 'Editar perfil' } },
  { path: '/ciudadano/perfil/cambiar-password', name: 'citizen-change-password', component: CitizenChangePasswordView, meta: { roles: citizenRoles, title: 'Cambiar contraseña' } },

  {
    path: '/super-admin', component: MonitoringLayout, meta: { roles: superAdminRoles }, children: [
      { path: '', redirect: '/super-admin/dashboard' },
      { path: 'dashboard', name: 'super-admin-dashboard', component: SuperAdminDashboardView, meta: { roles: superAdminRoles, title: 'Dashboard general' } },
      { path: 'usuarios', name: 'super-admin-users', component: SuperAdminUsersView, meta: { roles: superAdminRoles, title: 'Usuarios del sistema' } },
      { path: 'instituciones', name: 'super-admin-institutions', component: SuperAdminInstitutionsView, meta: { roles: superAdminRoles, title: 'Instituciones' } },
      { path: 'alertas', name: 'super-admin-alerts', component: SuperAdminAlertsView, meta: { roles: superAdminRoles, title: 'Alertas' } },
      { path: 'incidentes', name: 'super-admin-incidents', component: SuperAdminIncidentsView, meta: { roles: superAdminRoles, title: 'Incidentes' } },
      { path: 'auditoria', name: 'super-admin-audit', component: SuperAdminAuditView, meta: { roles: superAdminRoles, title: 'Auditoría' } },
      { path: 'configuracion', name: 'super-admin-settings', component: SuperAdminSettingsView, meta: { roles: superAdminRoles, title: 'Configuración' } },
    ],
  },

  {
    path: '/ciudadano', redirect: '/ciudadano/inicio'
  },

  {
    path: '/institucion', component: MonitoringLayout, meta: { roles: institutionAdminRoles }, children: [
      { path: '', redirect: '/institucion/dashboard' },
      { path: 'dashboard', name: 'institution-admin-dashboard', component: InstitutionAdminDashboardView, meta: { roles: institutionAdminRoles, title: 'Dashboard institucional' } },
      { path: 'inicio', redirect: '/institucion/dashboard' },
      { path: 'alertas', name: 'institution-admin-alerts', component: InstitutionAlertsView, meta: { roles: institutionAdminRoles, title: 'Alertas recibidas' } },
      { path: 'alertas/:id', name: 'institution-admin-alert-detail', component: InstitutionAlertDetailView, meta: { roles: institutionAdminRoles, title: 'Detalle de alerta' } },
      { path: 'usuarios', name: 'institution-users', component: AdminUsersView, meta: { roles: institutionAdminRoles, title: 'Personal y usuarios' } },
      { path: 'informes', name: 'institution-reports', component: InstitutionReportsView, meta: { roles: institutionAdminRoles, title: 'Informes de Atención' } },
      { path: 'historial', name: 'institution-history', component: InstitutionHistoryView, meta: { roles: institutionAdminRoles, title: 'Historial' } },
      { path: 'configuracion', name: 'institution-settings', component: SettingsView, meta: { roles: institutionAdminRoles, title: 'Configuración' } },
    ],
  },

  // Compatibilidad de rutas antiguas para institucional y central.
  {
    path: '/admin-institucion', component: MonitoringLayout, meta: { roles: institutionAdminRoles }, children: [
      { path: '', redirect: '/institucion/dashboard' },
      { path: 'dashboard', redirect: '/institucion/dashboard' },
      { path: 'alertas', redirect: '/institucion/alertas' },
      { path: 'alertas/:id', redirect: (to) => `/institucion/alertas/${to.params.id}` },
      { path: 'usuarios', redirect: '/institucion/usuarios' },
      { path: 'informes', redirect: '/institucion/informes' },
      { path: 'historial', redirect: '/institucion/historial' },
      { path: 'configuracion', redirect: '/institucion/configuracion' },
    ],
  },

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
      { path: 'usuarios', name: 'central-users', component: CentralUsersView, meta: { roles: centralRoles, title: 'Usuarios' } },
      { path: 'historial', name: 'central-history', component: CentralHistoryView, meta: { roles: centralRoles, title: 'Historial' } },
      { path: 'configuracion', name: 'central-settings', component: SettingsView, meta: { roles: centralRoles, title: 'Configuración' } },
      // Compatibilidad con enlaces generados por la versión anterior.
      { path: 'despacho', redirect: '/central/alertas' },
      { path: 'ubicaciones', redirect: '/central/dashboard' },
      { path: 'informes', redirect: '/central/historial' },
    ],
  },

  { path: '/institucion/:pathMatch(.*)*', redirect: { path: '/institucion/dashboard' } },
  { path: '/super-admin/:pathMatch(.*)*', redirect: { path: '/super-admin/dashboard' } },
  { path: '/ciudadano/:pathMatch(.*)*', redirect: { path: '/ciudadano/inicio' } },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]
