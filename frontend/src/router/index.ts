import type { RouteRecordRaw } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import MonitoringLayout from '../layouts/MonitoringLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import SensorsView from '../views/SensorsView.vue'
import ReadingsView from '../views/ReadingsView.vue'
import DetectionEngineView from '../views/DetectionEngineView.vue'
import AlertsView from '../views/AlertsView.vue'
import LocationsView from '../views/LocationsView.vue'
import SettingsView from '../views/SettingsView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/',
    component: MonitoringLayout,
    children: [
      { path: '', name: 'dashboard', component: DashboardView },
      { path: 'sensores', name: 'sensors', component: SensorsView },
      { path: 'sensores/:id', name: 'sensor-detail', component: SensorsView },
      { path: 'lecturas', name: 'readings', component: ReadingsView },
      { path: 'motor', name: 'detection', component: DetectionEngineView },
      { path: 'alertas', name: 'alerts', component: AlertsView },
      { path: 'ubicaciones', name: 'locations', component: LocationsView },
      { path: 'configuracion', name: 'settings', component: SettingsView },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]
