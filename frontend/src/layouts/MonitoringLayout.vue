<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Activity, AlertTriangle, Bell, BookOpenCheck, Building2, ChevronRight, ClipboardList,
  Flame, Gauge, History, Menu, RadioTower, Settings, ShieldCheck, SlidersHorizontal,
  UserCircle2, Users, X,
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.store'
import { roleLabels } from '../mocks/users'
import { institutionsMock } from '../mocks/institutions'
import type { UserRole } from '../types'

const route = useRoute(); const router = useRouter(); const authStore = useAuthStore()
const sidebarOpen = ref(false); const collapsed = ref(false); const notificationsOpen = ref(false)
const now = ref(new Date()); let timer: ReturnType<typeof setInterval> | undefined

type NavItem = { label: string; to: string; icon: Component }
const navByRole: Record<UserRole, NavItem[]> = {
  CENTRAL_OPERATOR: [
    { label: 'Dashboard', to: '/central/dashboard', icon: Gauge },
    { label: 'Alertas', to: '/central/alertas', icon: AlertTriangle },
    { label: 'Incidentes', to: '/central/incidentes', icon: Flame },
    { label: 'Instituciones', to: '/central/instituciones', icon: Building2 },
    { label: 'Historial', to: '/central/historial', icon: History },
    { label: 'Configuración', to: '/central/configuracion', icon: SlidersHorizontal },
  ],
  INSTITUTION_ADMIN: [
    { label: 'Dashboard', to: '/admin-institucion/dashboard', icon: Gauge },
    { label: 'Alertas recibidas', to: '/admin-institucion/alertas', icon: AlertTriangle },
    { label: 'Sensores', to: '/admin-institucion/sensores', icon: Activity },
    { label: 'Lecturas', to: '/admin-institucion/lecturas', icon: ShieldCheck },
    { label: 'Motor de Detección', to: '/admin-institucion/motor', icon: Flame },
    { label: 'Personal', to: '/admin-institucion/usuarios', icon: Users },
    { label: 'Informes de Atención', to: '/admin-institucion/informes', icon: ClipboardList },
    { label: 'Historial', to: '/admin-institucion/historial', icon: History },
    { label: 'Configuración', to: '/admin-institucion/configuracion', icon: Settings },
  ],
  INSTITUTION_USER: [
    { label: 'Inicio', to: '/institucion/dashboard', icon: Gauge },
    { label: 'Emergencias', to: '/institucion/emergencias', icon: RadioTower },
    { label: 'Historial', to: '/institucion/historial', icon: History },
  ],
  CITIZEN: [
    { label: 'Inicio', to: '/ciudadano/inicio', icon: Gauge },
    { label: 'Reportar incendio', to: '/ciudadano/reportar', icon: Flame },
    { label: 'Mis reportes', to: '/ciudadano/mis-reportes', icon: ClipboardList },
    { label: 'Notificaciones', to: '/ciudadano/notificaciones', icon: Bell },
    { label: 'Instrucciones', to: '/ciudadano/instrucciones', icon: BookOpenCheck },
  ],
}

const navItems = computed(() => navByRole[authStore.role])
const roleOptions = Object.entries(roleLabels) as Array<[UserRole, string]>
const currentTitle = computed(() => String(route.meta.title ?? 'ALERTA'))
const currentInstitution = computed(() => institutionsMock.find((item) => item.id === authStore.user?.institucionId))
const headerContext = computed(() => ({
  CENTRAL_OPERATOR: 'Centro de Monitoreo',
  INSTITUTION_ADMIN: currentInstitution.value?.nombre ?? 'Administración institucional',
  INSTITUTION_USER: currentInstitution.value?.nombre ?? 'Personal operativo',
  CITIZEN: 'Ciudadano',
}[authStore.role]))
const initials = computed(() => (authStore.user?.nombre ?? 'AL').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase())

const notifications = computed(() => {
  if (authStore.role === 'CITIZEN') return [
    { text: 'Tu reporte continúa en verificación', to: '/ciudadano/mis-reportes' },
    { text: 'Consulta recomendaciones de emergencia', to: '/ciudadano/instrucciones' },
  ]
  if (authStore.role === 'INSTITUTION_USER') return [
    { text: 'Tienes una emergencia asignada', to: '/institucion/emergencias' },
  ]
  if (authStore.role === 'INSTITUTION_ADMIN') return [
    { text: 'Revisa las alertas recibidas por tu institución', to: '/admin-institucion/alertas' },
    { text: 'Hay informes de atención para completar', to: '/admin-institucion/informes' },
  ]
  return [
    { text: 'Nueva alerta pendiente de validación', to: '/central/alertas' },
    { text: 'Incidente activo en seguimiento', to: '/central/incidentes' },
    { text: 'Instituciones disponibles para despacho', to: '/central/instituciones' },
  ]
})

const switchRole = async (role: UserRole) => {
  await authStore.switchDemoRole(role)
  notificationsOpen.value = false
  await router.push(navByRole[role][0].to)
}
const logout = async () => { await authStore.logout(); await router.push('/login') }
const isActive = (item: NavItem) => route.path === item.to || (item.to.endsWith('/emergencias') && route.path.startsWith('/institucion/emergencias'))
const goNotification = async (to: string) => { notificationsOpen.value = false; await router.push(to) }

watch(() => route.fullPath, () => { sidebarOpen.value = false; notificationsOpen.value = false })
onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 30_000) })
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
const formattedTime = computed(() => new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(now.value))
</script>

<template>
  <div class="legacy-light min-h-screen bg-[#f3f5f3] text-slate-900">
    <div class="flex min-h-screen">
      <aside :class="['fixed inset-y-0 left-0 z-40 flex flex-col overflow-y-auto border-r border-slate-200 bg-white transition-all duration-300 lg:static', collapsed ? 'w-20' : 'w-[280px]', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']">
        <div class="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-5">
          <div class="flex items-center gap-3 overflow-hidden">
            <img src="/logo-alerta-ave.svg" alt="Logo ALERTA" class="h-11 w-11 shrink-0" />
            <div v-if="!collapsed" class="min-w-0"><div class="text-xs font-semibold uppercase tracking-[0.28em] text-[#f4a259]">ALERTA</div><div class="truncate text-sm font-semibold text-slate-900">Prevención de Incendios</div></div>
          </div>
          <button class="hidden rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-orange-200 hover:text-orange-600 lg:block" @click="collapsed=!collapsed" aria-label="Colapsar menú"><ChevronRight :class="['h-4 w-4 transition-transform',collapsed?'rotate-180':'']"/></button>
          <button class="rounded-xl border border-slate-200 p-2 text-slate-500 lg:hidden" @click="sidebarOpen=false" aria-label="Cerrar menú"><X class="h-4 w-4"/></button>
        </div>

        <nav class="flex-1 space-y-1.5 p-3">
          <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" :class="['group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition',isActive(item)?'border border-orange-200 bg-[#f6e8d9] text-slate-900 shadow-sm':'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900']">
            <component :is="item.icon" :class="['h-5 w-5 shrink-0',isActive(item)?'text-orange-600':'text-slate-500']"/><span v-if="!collapsed" class="truncate">{{ item.label }}</span>
          </RouterLink>
        </nav>

        <div class="shrink-0 border-t border-slate-200 p-3">
          <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"><UserCircle2 class="h-5 w-5"/></div><div v-if="!collapsed" class="min-w-0 flex-1"><p class="truncate text-sm font-semibold text-slate-900">{{ authStore.user?.nombre }}</p><p class="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.17em] text-emerald-700">{{ roleLabels[authStore.role] }}</p></div></div>
          <div v-if="!collapsed" class="mt-3 space-y-2"><label class="block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Modo demostración</label><select :value="authStore.role" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-orange-300" @change="switchRole(($event.target as HTMLSelectElement).value as UserRole)"><option v-for="[role,label] in roleOptions" :key="role" :value="role">{{ label }}</option></select><button class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 hover:border-orange-200 hover:text-orange-600" @click="logout">Cerrar sesión</button></div>
        </div>
      </aside>

      <div class="flex min-h-screen min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-6">
          <div class="flex items-center justify-between gap-4">
            <div class="flex min-w-0 items-center gap-3"><button class="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden" @click="sidebarOpen=true" aria-label="Abrir menú"><Menu class="h-5 w-5"/></button><div class="min-w-0"><p class="flex items-center gap-2 truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500"><span class="h-2 w-2 shrink-0 rounded-full bg-[#f4a259]"></span> ALERTA · {{ headerContext }}</p><h1 class="mt-1 truncate text-xl font-semibold text-slate-900">{{ currentTitle }}</h1></div></div>

            <div class="hidden items-center gap-3 lg:flex"><div class="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>Sistema conectado</div><div class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600">{{ formattedTime }}</div></div>

            <div class="relative flex items-center gap-2 sm:gap-3"><button class="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm" aria-label="Notificaciones" @click="notificationsOpen=!notificationsOpen"><Bell class="h-4 w-4"/><span class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{{ notifications.length }}</span></button><div v-if="notificationsOpen" class="absolute right-0 top-14 z-50 w-[min(330px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"><p class="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Notificaciones</p><button v-for="notification in notifications" :key="notification.text" class="block w-full rounded-xl px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50" @click="goNotification(notification.to)">{{ notification.text }}</button></div><div class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm"><div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6e8d9] text-sm font-semibold text-orange-600">{{ initials }}</div><div class="hidden text-left md:block"><div class="max-w-32 truncate text-xs font-semibold text-slate-900">{{ authStore.user?.nombre }}</div><div class="text-[9px] uppercase tracking-[0.18em] text-slate-500">online</div></div></div></div>
          </div>
        </header>

        <main class="min-w-0 flex-1 p-4 lg:p-6"><router-view /></main>
      </div>
    </div>
  </div>
</template>
