<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronRight,
  Flame,
  Gauge,
  MapPinned,
  Menu,
  ShieldCheck,
  SlidersHorizontal,
  UserCircle2,
  X,
} from 'lucide-vue-next'

const route = useRoute()
const sidebarOpen = ref(false)
const collapsed = ref(false)

const navItems = [
  { label: 'Dashboard', to: '/', icon: Gauge },
  { label: 'Sensores', to: '/sensores', icon: Activity },
  { label: 'Lecturas', to: '/lecturas', icon: ShieldCheck },
  { label: 'Motor de Detección', to: '/motor', icon: Flame },
  { label: 'Alertas', to: '/alertas', icon: AlertTriangle },
  { label: 'Ubicaciones', to: '/ubicaciones', icon: MapPinned },
  { label: 'Configuración', to: '/configuracion', icon: SlidersHorizontal },
]

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  sensors: 'Sensores',
  'sensor-detail': 'Detalles del sensor',
  readings: 'Lecturas',
  detection: 'Motor de Detección',
  alerts: 'Alertas',
  locations: 'Ubicaciones',
  settings: 'Configuración',
}

const currentTitle = computed(() => pageTitles[route.name as string] ?? 'Dashboard')

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  },
)

const now = new Date()
const formattedTime = computed(() =>
  new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now),
)
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="flex min-h-screen">
      <aside
        :class="[
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-sm transition-all duration-300 lg:static',
          collapsed ? 'w-20' : 'w-72',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ]"
      >
        <div class="flex items-center justify-between border-b border-slate-800 px-4 py-5">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-300 ring-1 ring-red-500/30">
              <Flame class="h-5 w-5" />
            </div>
            <div v-if="!collapsed" class="min-w-0">
              <div class="text-xs uppercase tracking-[0.28em] text-slate-400">Sistema</div>
              <div class="truncate text-lg font-semibold text-white">FIREGUARD</div>
            </div>
          </div>
          <button class="hidden rounded-lg border border-slate-700 p-1 text-slate-300 lg:block" @click="collapsed = !collapsed" aria-label="Colapsar menú">
            <ChevronRight :class="['h-4 w-4 transition-transform', collapsed ? 'rotate-180' : '']" />
          </button>
          <button class="rounded-lg border border-slate-700 p-1 text-slate-300 lg:hidden" @click="sidebarOpen = false" aria-label="Cerrar menú">
            <X class="h-4 w-4" />
          </button>
        </div>

        <nav class="flex-1 space-y-2 p-3">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            :class="route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to)) ? 'bg-slate-800 text-white ring-1 ring-slate-700' : ''"
          >
            <component :is="item.icon" class="h-4 w-4" />
            <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
          </RouterLink>
        </nav>

        <div class="border-t border-slate-800 p-3">
          <div class="flex items-center gap-3 rounded-xl bg-slate-900/80 p-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-200">
              <UserCircle2 class="h-5 w-5" />
            </div>
            <div v-if="!collapsed" class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-white">Operador principal</p>
              <p class="text-[10px] uppercase tracking-[0.18em] text-emerald-300">Sistema operativo</p>
            </div>
          </div>
        </div>
      </aside>

      <div class="flex min-h-screen flex-1 flex-col">
        <header class="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 px-4 py-4 backdrop-blur-sm lg:px-6">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <button class="rounded-lg border border-slate-700 p-2 text-slate-300 lg:hidden" @click="sidebarOpen = true" aria-label="Abrir menú">
                <Menu class="h-5 w-5" />
              </button>
              <div>
                <p class="text-[10px] uppercase tracking-[0.26em] text-slate-400">Centro de monitoreo</p>
                <h1 class="mt-1 text-xl font-semibold text-white">{{ currentTitle }}</h1>
              </div>
            </div>

            <div class="hidden items-center gap-3 md:flex">
              <div class="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                Sistema conectado
              </div>
              <div class="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">{{ formattedTime }}</div>
            </div>

            <div class="flex items-center gap-3">
              <button class="relative rounded-lg border border-slate-700 bg-slate-900/80 p-2 text-slate-300" aria-label="Notificaciones">
                <Bell class="h-4 w-4" />
                <span class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">3</span>
              </button>
              <div class="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-2 py-1.5">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 text-sky-300">OP</div>
                <div class="hidden text-left sm:block">
                  <div class="text-xs font-medium text-white">Operador</div>
                  <div class="text-[10px] uppercase tracking-[0.2em] text-slate-400">online</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main class="flex-1 p-4 lg:p-6">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>
