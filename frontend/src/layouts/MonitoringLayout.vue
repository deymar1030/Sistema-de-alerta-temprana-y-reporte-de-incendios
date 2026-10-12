<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Component,
} from 'vue'

import { useRoute, useRouter } from 'vue-router'

import {
  AlertTriangle,
  Bell,
  Building2,
  ChevronRight,
  ClipboardList,
  Flame,
  Gauge,
  History,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-vue-next'

import { useAuthStore } from '../stores/auth.store'
import { useNotificationStore } from '../stores/notification.store'

import {
  isWebUserRole,
  type WebUserRole,
} from '../types'

const route = useRoute()
const router = useRouter()

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const sidebarOpen = ref(false)
const collapsed = ref(false)
const notificationsOpen = ref(false)

const profileMenuOpen = ref(false)

const profileMenuRef = ref<HTMLElement | null>(null)
const notificationMenuRef = ref<HTMLElement | null>(null)

const now = ref(new Date())

let timer: ReturnType<typeof setInterval> | undefined

type NavItem = {
  label: string
  to: string
  icon: Component
}

const navByRole: Record<WebUserRole, NavItem[]> = {
  ADMIN: [
    {
      label: 'Dashboard',
      to: '/super-admin/dashboard',
      icon: Gauge,
    },
    {
      label: 'Usuarios',
      to: '/super-admin/usuarios',
      icon: Users,
    },
    {
      label: 'Instituciones',
      to: '/super-admin/instituciones',
      icon: Building2,
    },
    {
      label: 'Alertas',
      to: '/super-admin/alertas',
      icon: AlertTriangle,
    },
    {
      label: 'Incidentes',
      to: '/super-admin/incidentes',
      icon: Flame,
    },
    {
      label: 'Auditoría',
      to: '/super-admin/auditoria',
      icon: History,
    },
  ],
  JEFE_INSTITUCION: [
    {
      label: 'Dashboard',
      to: '/institucion/dashboard',
      icon: Gauge,
    },
    {
      label: 'Alertas recibidas',
      to: '/institucion/alertas',
      icon: AlertTriangle,
    },
    {
      label: 'Usuarios',
      to: '/institucion/usuarios',
      icon: Users,
    },
    {
      label: 'Informes de Atención',
      to: '/institucion/informes',
      icon: ClipboardList,
    },
    {
      label: 'Historial',
      to: '/institucion/historial',
      icon: History,
    },
  ],
  OPERATIVO: [
    {
      label: 'Dashboard',
      to: '/institucion/dashboard',
      icon: Gauge,
    },
    {
      label: 'Alertas recibidas',
      to: '/institucion/alertas',
      icon: AlertTriangle,
    },
    {
      label: 'Historial',
      to: '/institucion/historial',
      icon: History,
    },
  ],
}

const navItems = computed(() => {
  const role = authStore.role ?? 'ADMIN'
  return navByRole[
    isWebUserRole(role)
      ? role
      : 'ADMIN'
  ]
})

const currentTitle = computed(() =>
  String(route.meta.title ?? 'ALERTA'),
)

const headerContext = computed(() => {
  if (authStore.role === 'ADMIN') return 'Administración general'
  if (authStore.role === 'JEFE_INSTITUCION' || authStore.role === 'OPERATIVO') return 'Administración Institucional'
  return 'Centro de Monitoreo'
})

const initials = computed(() =>
  (authStore.user?.nombre ?? 'AL')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
)

const settingsRoute = computed(() => {
  if (authStore.role === 'ADMIN') return '/super-admin/configuracion'
  if (authStore.role === 'JEFE_INSTITUCION' || authStore.role === 'OPERATIVO') return '/institucion/configuracion'
  return '/ciudadano/perfil'
})

const userRoleBadge = computed(() => {
  if (authStore.role === 'ADMIN') return 'ADMIN'
  if (authStore.role === 'JEFE_INSTITUCION') return 'JEFE INSTITUCIÓN'
  if (authStore.role === 'OPERATIVO') return 'OPERATIVO'
  return 'CIUDADANO'
})

/*
 * NOTIFICACIONES REALES DEL BACKEND
 */

const notificationItems = computed(() => {
  return notificationStore.notifications.map(
    (notification) => {
      const id = String(
        notification.id_notificacion ??
          notification.id ??
          '',
      )

      const title =
        typeof notification.titulo === 'string'
          ? notification.titulo
          : ''

      const message =
        typeof notification.mensaje === 'string'
          ? notification.mensaje
          : ''

      return {
        id,

        text:
          title && message
            ? `${title}: ${message}`
            : message ||
              title ||
              'Notificación',
      }
    },
  )
})

const openNotification = async (
  id: string,
) => {
  if (id) {
    try {
      await notificationStore.markAsRead(id)
    } catch {
      /*
       * No bloqueamos el menú si el backend
       * falla al marcar la notificación.
       */
    }
  }

  notificationsOpen.value = false
}

const markAllNotifications = async () => {
  try {
    await notificationStore.markAllAsRead()
  } catch {
    /*
     * Evitamos romper el layout si falla
     * únicamente esta operación.
     */
  }
}

/*
 * SESIÓN
 */

const logout = async () => {
  profileMenuOpen.value = false

  await authStore.logout()

  await router.push('/login')
}

/*
 * NAVEGACIÓN
 */

const isActive = (item: NavItem) =>
  route.path === item.to

const closeMenus = () => {
  notificationsOpen.value = false
  profileMenuOpen.value = false
}

/*
 * WATCHERS
 */

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
    closeMenus()
  },
)

watch(
  () => [
    sidebarOpen.value,
    collapsed.value,
  ],
  () => {
    setTimeout(() => {
      window.dispatchEvent(
        new Event('resize'),
      )
    }, 300)
  },
)

/*
 * CERRAR MENÚS AL HACER CLICK FUERA
 */

const handleDocumentClick = (
  event: MouseEvent,
) => {
  const target = event.target as Node

  if (
    profileMenuOpen.value &&
    profileMenuRef.value &&
    !profileMenuRef.value.contains(target)
  ) {
    profileMenuOpen.value = false
  }

  if (
    notificationsOpen.value &&
    notificationMenuRef.value &&
    !notificationMenuRef.value.contains(
      target,
    )
  ) {
    notificationsOpen.value = false
  }
}

/*
 * MONTAJE
 */

onMounted(async () => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 30_000)

  window.addEventListener(
    'click',
    handleDocumentClick,
  )

  /*
   * Consultamos:
   * GET /api/notificaciones
   * GET /api/notificaciones/no-leidas/conteo
   */
  await notificationStore.fetchNotifications()
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }

  window.removeEventListener(
    'click',
    handleDocumentClick,
  )
})

/*
 * FECHA / HORA
 */

const formattedTime = computed(() =>
  new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now.value),
)
</script>

<template>
  <div
    class="legacy-light min-h-screen bg-[#f3f5f3] text-slate-900"
  >
    <div
      class="flex min-h-screen w-full overflow-hidden"
    >
      <!-- SIDEBAR -->
      <aside
        :class="[
          'fixed inset-y-0 left-0 z-40 flex flex-col overflow-y-auto border-r border-slate-200 bg-white transition-all duration-300 lg:static lg:sticky lg:top-0 lg:h-screen',

          collapsed
            ? 'w-20'
            : 'w-[280px]',

          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
        ]"
      >
        <!-- Logo -->
        <div
          class="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-5"
        >
          <div
            class="flex items-center gap-3 overflow-hidden"
          >
            <img
              src="/logo-alerta-ave.svg"
              alt="Logo ALERTA"
              class="h-11 w-11 shrink-0"
            />

            <div
              v-if="!collapsed"
              class="min-w-0"
            >
              <div
                class="text-xs font-semibold uppercase tracking-[0.28em] text-[#f4a259]"
              >
                ALERTA
              </div>

              <div
                class="truncate text-sm font-semibold text-slate-900"
              >
                Prevención de Incendios
              </div>
            </div>
          </div>

          <!-- Colapsar -->
          <button
            class="hidden rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-orange-200 hover:text-orange-600 lg:block"
            @click="collapsed = !collapsed"
            aria-label="Colapsar menú"
          >
            <ChevronRight
              :class="[
                'h-4 w-4 transition-transform',
                collapsed
                  ? 'rotate-180'
                  : '',
              ]"
            />
          </button>

          <!-- Cerrar móvil -->
          <button
            class="rounded-xl border border-slate-200 p-2 text-slate-500 lg:hidden"
            @click="sidebarOpen = false"
            aria-label="Cerrar menú"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Navegación -->
        <nav
          class="flex-1 space-y-1.5 p-3"
        >
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition',

              isActive(item)
                ? 'border border-orange-200 bg-[#f6e8d9] text-slate-900 shadow-sm'
                : 'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            ]"
          >
            <component
              :is="item.icon"
              :class="[
                'h-5 w-5 shrink-0',

                isActive(item)
                  ? 'text-orange-600'
                  : 'text-slate-500',
              ]"
            />

            <span
              v-if="!collapsed"
              class="truncate"
            >
              {{ item.label }}
            </span>
          </RouterLink>
        </nav>
      </aside>

      <!-- CONTENIDO -->
      <div
        class="flex min-h-screen min-w-0 flex-1 flex-col"
      >
        <!-- HEADER -->
        <header
          class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-6"
        >
          <div
            class="flex items-center justify-between gap-4"
          >
            <!-- Izquierda -->
            <div
              class="flex min-w-0 items-center gap-3"
            >
              <button
                class="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
                @click="sidebarOpen = true"
                aria-label="Abrir menú"
              >
                <Menu class="h-5 w-5" />
              </button>

              <div class="min-w-0">
                <p
                  class="flex items-center gap-2 truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500"
                >
                  <span
                    class="h-2 w-2 shrink-0 rounded-full bg-[#f4a259]"
                  ></span>

                  ALERTA ·
                  {{ headerContext }}
                </p>

                <h1
                  class="mt-1 truncate text-xl font-semibold text-slate-900"
                >
                  {{ currentTitle }}
                </h1>
              </div>
            </div>

            <!-- Centro -->
            <div
              class="hidden items-center gap-3 lg:flex"
            >
              <div
                class="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"
              >
                <span
                  class="h-2 w-2 rounded-full bg-emerald-500"
                ></span>

                Sistema conectado
              </div>

              <div
                class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600"
              >
                {{ formattedTime }}
              </div>
            </div>

            <!-- Derecha -->
            <div
              class="relative flex items-center gap-2 sm:gap-3"
            >
              <!-- CAMPANA -->
              <button
                class="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-orange-200 hover:text-orange-600"
                aria-label="Notificaciones"
                @click.stop="
                  notificationsOpen =
                    !notificationsOpen
                "
              >
                <Bell class="h-4 w-4" />

                <!-- CONTADOR REAL -->
                <span
                  v-if="
                    notificationStore.unreadCount >
                    0
                  "
                  class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
                >
                  {{
                    notificationStore.unreadCount
                  }}
                </span>
              </button>

              <!-- MENÚ NOTIFICACIONES -->
              <div
                v-if="notificationsOpen"
                ref="notificationMenuRef"
                class="absolute right-0 top-14 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
              >
                <!-- Cabecera -->
                <div
                  class="flex items-center justify-between gap-3 px-2 pb-2"
                >
                  <p
                    class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                  >
                    Notificaciones
                  </p>

                  <button
                    v-if="
                      notificationStore.unreadCount >
                      0
                    "
                    type="button"
                    class="text-[10px] font-semibold text-orange-600 transition hover:text-orange-700"
                    @click="
                      markAllNotifications
                    "
                  >
                    Marcar todas como leídas
                  </button>
                </div>

                <!-- Loading -->
                <div
                  v-if="
                    notificationStore.loading
                  "
                  class="px-3 py-6 text-center text-sm text-slate-500"
                >
                  Cargando notificaciones...
                </div>

                <!-- Error -->
                <div
                  v-else-if="
                    notificationStore.error
                  "
                  class="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
                >
                  {{
                    notificationStore.error
                  }}
                </div>

                <!-- Vacío -->
                <div
                  v-else-if="
                    notificationItems.length === 0
                  "
                  class="px-3 py-6 text-center"
                >
                  <Bell
                    class="mx-auto h-5 w-5 text-slate-300"
                  />

                  <p
                    class="mt-2 text-sm font-medium text-slate-700"
                  >
                    No tienes notificaciones
                  </p>

                  <p
                    class="mt-1 text-xs text-slate-400"
                  >
                    Las nuevas notificaciones
                    aparecerán aquí.
                  </p>
                </div>

                <!-- Lista -->
                <div
                  v-else
                  class="space-y-1"
                >
                  <button
                    v-for="notification in notificationItems"
                    :key="
                      notification.id ||
                      notification.text
                    "
                    type="button"
                    class="block w-full rounded-xl px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    @click="
                      openNotification(
                        notification.id,
                      )
                    "
                  >
                    {{ notification.text }}
                  </button>
                </div>
              </div>

              <!-- PERFIL -->
              <div
                ref="profileMenuRef"
                class="relative"
              >
                <button
                  class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition hover:border-orange-200"
                  @click.stop="
                    profileMenuOpen =
                      !profileMenuOpen
                  "
                  aria-label="Abrir menú de perfil"
                >
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6e8d9] text-sm font-semibold text-orange-600"
                  >
                    {{ initials }}
                  </div>

                  <div
                    class="hidden max-w-[12rem] text-left md:block"
                  >
                    <div
                      class="truncate text-xs font-semibold text-slate-900"
                    >
                      {{
                        authStore.user?.nombre
                      }}
                    </div>

                    <div
                      class="text-[9px] uppercase tracking-[0.18em] text-slate-500"
                    >
                      {{ userRoleBadge }}
                    </div>
                  </div>
                </button>

                <!-- Menú perfil -->
                <div
                  v-if="profileMenuOpen"
                  class="absolute right-0 top-[calc(100%+0.75rem)] z-[60] w-56 rounded-2xl border border-[#D4DAD7] bg-white p-2 shadow-[0_18px_42px_rgba(15,23,42,0.12)]"
                >
                  <!-- Configuración -->
                  <button
                    class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#17212B] transition hover:bg-slate-50"
                    @click="
                      router.push(
                        settingsRoute,
                      );
                      profileMenuOpen =
                        false
                    "
                  >
                    <Settings
                      class="h-4 w-4 text-slate-600"
                    />

                    <span>
                      Configuración
                    </span>
                  </button>

                  <!-- Logout -->
                  <button
                    class="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#17212B] transition hover:bg-slate-50"
                    @click="logout"
                  >
                    <LogOut
                      class="h-4 w-4 text-slate-600"
                    />

                    <span>
                      Cerrar sesión
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- VISTA -->
        <main
          class="relative z-0 min-w-0 flex-1 p-4 lg:p-6"
        >
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>