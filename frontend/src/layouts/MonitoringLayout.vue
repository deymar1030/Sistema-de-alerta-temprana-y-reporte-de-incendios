
<script setup lang="ts">
import {
  computed,
  nextTick,
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
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flame,
  Gauge,
  History,
  LogOut,
  MapPinned,
  Menu,
  Settings,
  UserRound,
  Users,
  X,
} from 'lucide-vue-next'

import { useAuthStore } from '../stores/auth.store'
import { useInstitutionStore } from '../stores/institution.store'
import { useNotificationStore } from '../stores/notification.store'
import { getRoleLabel, isWebUserRole, type WebUserRole } from '../types'

type NavItem = { label: string; to: string; icon: Component }

const navByRole: Record<WebUserRole, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', to: '/super-admin/dashboard', icon: Gauge },
    { label: 'Usuarios', to: '/super-admin/usuarios', icon: Users },
    { label: 'Instituciones', to: '/super-admin/instituciones', icon: Building2 },
    { label: 'Zonas', to: '/super-admin/zonas', icon: MapPinned },
    { label: 'Predios', to: '/super-admin/predios', icon: Building2 },
    { label: 'Sensores', to: '/super-admin/sensores', icon: Gauge },
    { label: 'Lecturas', to: '/super-admin/lecturas', icon: ClipboardList },
    { label: 'Alertas', to: '/super-admin/alertas', icon: AlertTriangle },
    { label: 'Incidentes', to: '/super-admin/incidentes', icon: Flame },
    { label: 'Auditoría', to: '/super-admin/auditoria', icon: History },
  ],
  JEFE_INSTITUCION: [
    { label: 'Dashboard', to: '/institucion/dashboard', icon: Gauge },
    { label: 'Alertas recibidas', to: '/institucion/alertas', icon: AlertTriangle },
    { label: 'Usuarios', to: '/institucion/usuarios', icon: Users },
    { label: 'Informes de Atención', to: '/institucion/informes', icon: ClipboardList },
    { label: 'Historial', to: '/institucion/historial', icon: History },
  ],
  OPERATIVO: [
    { label: 'Dashboard', to: '/institucion/dashboard', icon: Gauge },
    { label: 'Alertas recibidas', to: '/institucion/alertas', icon: AlertTriangle },
    { label: 'Historial', to: '/institucion/historial', icon: History },
  ],
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const institutionStore = useInstitutionStore()
const notificationStore = useNotificationStore()

const sidebarOpen = ref(false)
const collapsed = ref(false)
const notificationsOpen = ref(false)
const profileMenuOpen = ref(false)
const accountModalOpen = ref(false)
const loggingOut = ref(false)
const notificationActionError = ref('')

const mobileMenuButton = ref<HTMLButtonElement | null>(null)
const headerActions = ref<HTMLElement | null>(null)
const accountDialog = ref<HTMLElement | null>(null)
const accountCloseButton = ref<HTMLButtonElement | null>(null)

let previousBodyOverflow = ''
let bodyWasLocked = false
let previouslyFocused: HTMLElement | null = null
let resizeTimer: ReturnType<typeof setTimeout> | undefined
let clockTimer: ReturnType<typeof setInterval> | undefined
const now = ref(new Date())

const navItems = computed<NavItem[]>(() => {
  const role = authStore.role
  return role && isWebUserRole(role) ? navByRole[role] : []
})

const currentTitle = computed(() => String(route.meta.title ?? 'ALERTA'))
const headerContext = computed(() => {
  if (authStore.role === 'ADMIN') return 'Administración general'
  if (authStore.role === 'JEFE_INSTITUCION' || authStore.role === 'OPERATIVO') {
    return 'Administración institucional'
  }
  return 'Centro de monitoreo'
})

const displayName = computed(() => String(authStore.user?.nombre ?? 'Usuario').trim() || 'Usuario')
const initials = computed(() =>
  displayName.value
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase(),
)
const displayRole = computed(() =>
  authStore.role ? getRoleLabel(authStore.role) : 'Sin rol',
)

const settingsRoute = computed(() =>
  authStore.role === 'ADMIN' ? '/super-admin/configuracion' : '/institucion/configuracion',
)

const accountFields = computed(() => {
  const institutionId = authStore.user?.institucionId ?? authStore.user?.institutionId
  const institutionName = institutionId
    ? institutionStore.institutions.find((item) => String(item.id) === String(institutionId))?.nombre ?? `Institución #${institutionId}`
    : 'No asignada'

  return [
    { label: 'Nombre completo', value: displayName.value },
    { label: 'Correo', value: authStore.user?.email ?? 'Sin registrar' },
    { label: 'Teléfono', value: authStore.user?.phone ?? authStore.user?.telefono ?? 'Sin registrar' },
    { label: 'Rol', value: displayRole.value },
    { label: 'Institución', value: institutionName },
  ]
})

const notificationItems = computed(() =>
  notificationStore.notifications.map((notification) => {
    const id = String(notification.id_notificacion ?? notification.id ?? '')
    const title = typeof notification.titulo === 'string' ? notification.titulo : ''
    const message = typeof notification.mensaje === 'string' ? notification.mensaje : ''
    return {
      id,
      text: title && message ? `${title}: ${message}` : message || title || 'Notificación',
    }
  }),
)

const formattedTime = computed(() =>
  new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now.value),
)

function isActive(item: NavItem): boolean {
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

function closeMenus() {
  notificationsOpen.value = false
  profileMenuOpen.value = false
}

function toggleNotifications() {
  profileMenuOpen.value = false
  notificationsOpen.value = !notificationsOpen.value
  notificationActionError.value = ''
  if (notificationsOpen.value) void notificationStore.fetchNotifications()
}

function toggleProfile() {
  notificationsOpen.value = false
  profileMenuOpen.value = !profileMenuOpen.value
}

async function markAsRead(id: string) {
  if (!id) return
  notificationActionError.value = ''
  try {
    await notificationStore.markAsRead(id)
  } catch (error) {
    notificationActionError.value = error instanceof Error ? error.message : 'No se pudo marcar como leída.'
    return
  }
  notificationsOpen.value = false
}

async function markAllAsRead() {
  notificationActionError.value = ''
  try {
    await notificationStore.markAllAsRead()
  } catch (error) {
    notificationActionError.value = error instanceof Error ? error.message : 'No se pudieron actualizar las notificaciones.'
  }
}

function showAccount() {
  closeMenus()
  previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
  accountModalOpen.value = true
  void nextTick(() => accountCloseButton.value?.focus())
}

function closeAccount() {
  accountModalOpen.value = false
  void nextTick(() => previouslyFocused?.focus())
}

async function goToSettings() {
  profileMenuOpen.value = false
  await router.push(settingsRoute.value)
}

async function logout() {
  if (loggingOut.value) return
  profileMenuOpen.value = false
  loggingOut.value = true
  try {
    await authStore.logout()
    await router.replace('/login')
  } finally {
    loggingOut.value = false
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (headerActions.value && !headerActions.value.contains(event.target as Node)) {
    closeMenus()
  }
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (accountModalOpen.value) closeAccount()
    else if (sidebarOpen.value) {
      sidebarOpen.value = false
      void nextTick(() => mobileMenuButton.value?.focus())
    } else closeMenus()
    return
  }

  // Mantener el foco dentro del modal de cuenta.
  if (event.key !== 'Tab' || !accountModalOpen.value || !accountDialog.value) return
  const focusable = [...accountDialog.value.querySelectorAll<HTMLElement>(
    'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)',
  )].filter((element) => element.getClientRects().length > 0)
  if (!focusable.length) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(() => route.fullPath, () => {
  sidebarOpen.value = false
  closeMenus()
})

// Cuando existe un menú móvil o un modal, no desplazamos el fondo.
watch([sidebarOpen, accountModalOpen], ([sidebar, modal]) => {
  if (sidebar || modal) {
    if (!bodyWasLocked) {
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      bodyWasLocked = true
    }
  } else if (bodyWasLocked) {
    document.body.style.overflow = previousBodyOverflow
    bodyWasLocked = false
  }
})

watch([collapsed, sidebarOpen], () => {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => window.dispatchEvent(new Event('resize')), 320)
})

onMounted(() => {
  clockTimer = setInterval(() => { now.value = new Date() }, 30_000)
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
  void Promise.allSettled([
    institutionStore.fetchInstitutions(),
    notificationStore.fetchNotifications(),
  ])
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (resizeTimer) clearTimeout(resizeTimer)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
  if (bodyWasLocked) document.body.style.overflow = previousBodyOverflow
})
</script>

<template>
  <div class="legacy-light min-h-dvh min-w-0 bg-[#f3f5f3] text-slate-900">
    <div class="flex min-h-dvh min-w-0 w-full">
      <!-- Fondo del menú móvil: fuera del panel para cerrar tocando alrededor. -->
      <button
        v-if="sidebarOpen"
        type="button"
        class="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        aria-label="Cerrar menú de navegación"
        @click="sidebarOpen = false"
      />

      <aside
        id="alerta-navigation"
        :class="[
          'fixed inset-y-0 left-0 z-50 flex h-dvh shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-xl transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:shadow-none',
          'w-[min(18rem,calc(100vw-2rem))]',
          collapsed ? 'lg:w-[5rem]' : 'lg:w-[17.5rem]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ]"
      >
        <div
          :class="[
            'flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 py-4',
            collapsed ? 'lg:flex-col lg:px-2 lg:py-3' : '',
          ]"
        >
          <div class="flex min-w-0 items-center gap-2.5">
            <img src="/logo-alerta-ave.svg" alt="Logo ALERTA" class="h-10 w-10 shrink-0 object-contain" />
            <div :class="['min-w-0', collapsed ? 'lg:hidden' : '']">
              <p class="text-[11px] font-semibold uppercase tracking-[0.19em] text-orange-600">ALERTA</p>
              <p class="break-words text-xs font-semibold leading-tight text-slate-900">
                Prevención de Incendios
              </p>
            </div>
          </div>

          <button
            type="button"
            class="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-700 lg:flex"
            :aria-label="collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'"
            :title="collapsed ? 'Expandir menú' : 'Contraer menú'"
            @click="collapsed = !collapsed"
          >
            <ChevronRight v-if="collapsed" class="h-5 w-5" aria-hidden="true" />
            <ChevronLeft v-else class="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
            aria-label="Cerrar menú lateral"
            @click="sidebarOpen = false"
          >
            <X class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav class="flex-1 space-y-1.5 p-3" aria-label="Navegación principal">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :title="collapsed ? item.label : undefined"
            :aria-current="isActive(item) ? 'page' : undefined"
            :class="[
              'group flex min-h-11 min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors',
              collapsed ? 'lg:justify-center lg:px-2' : '',
              isActive(item)
                ? 'border-orange-200 bg-orange-50 text-orange-800 shadow-sm'
                : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900',
            ]"
          >
            <component
              :is="item.icon"
              :class="['h-5 w-5 shrink-0', isActive(item) ? 'text-orange-600' : 'text-slate-500']"
              aria-hidden="true"
            />
            <span :class="['min-w-0 break-words leading-snug', collapsed ? 'lg:hidden' : '']">
              {{ item.label }}
            </span>
          </RouterLink>
        </nav>
      </aside>

      <div class="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-5 lg:px-6">
          <div class="flex min-w-0 w-full items-center justify-between gap-2 sm:gap-3">
            <div class="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <button
                ref="mobileMenuButton"
                type="button"
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
                aria-label="Abrir menú lateral"
                aria-controls="alerta-navigation"
                :aria-expanded="sidebarOpen"
                @click="sidebarOpen = true"
              >
                <Menu class="h-5 w-5" aria-hidden="true" />
              </button>

              <div class="min-w-0 flex-1">
                <p class="hidden min-w-0 items-center gap-2 truncate text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 sm:flex">
                  <span class="h-2 w-2 shrink-0 rounded-full bg-orange-400" />
                  <span class="truncate">ALERTA · {{ headerContext }}</span>
                </p>
                <h1 class="min-w-0 truncate text-base font-bold leading-tight text-slate-900 sm:mt-1 sm:text-lg" :title="currentTitle">
                  {{ currentTitle }}
                </h1>
              </div>
            </div>

            <!-- Estos elementos se ocultan antes de invadir el espacio del perfil. -->
            <div class="hidden shrink-0 items-center gap-2 xl:flex">
              <span class="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                <span class="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                Sesión iniciada
              </span>
              <span class="hidden whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 2xl:inline-flex">
                {{ formattedTime }}
              </span>
            </div>

            <!-- La campana y el perfil comparten un ancla para menús que no se salen de pantalla. -->
            <div ref="headerActions" class="relative flex shrink-0 items-center gap-2">
              <button
                type="button"
                class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-orange-200 hover:text-orange-700"
                aria-label="Notificaciones"
                aria-controls="alerta-notifications"
                :aria-expanded="notificationsOpen"
                @click.stop="toggleNotifications"
              >
                <Bell class="h-5 w-5" aria-hidden="true" />
                <span
                  v-if="notificationStore.unreadCount > 0"
                  class="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white"
                >
                  {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
                </span>
              </button>

              <button
                type="button"
                class="flex min-h-11 max-w-[12rem] min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-1.5 py-1 shadow-sm hover:border-orange-200 sm:px-2"
                aria-label="Abrir menú de perfil"
                aria-controls="alerta-profile"
                :aria-expanded="profileMenuOpen"
                @click.stop="toggleProfile"
              >
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                  {{ initials }}
                </span>
                <span class="hidden min-w-0 max-w-[8.5rem] text-left 2xl:block">
                  <span class="block truncate text-xs font-semibold text-slate-900" :title="displayName">{{ displayName }}</span>
                  <span class="block truncate text-[10px] text-slate-500">{{ displayRole }}</span>
                </span>
              </button>

              <!-- Menú de notificaciones; sólo ocupa el ancho disponible del viewport. -->
              <section
                v-if="notificationsOpen"
                id="alerta-notifications"
                class="absolute right-0 top-[calc(100%+0.75rem)] z-[60] max-h-[70dvh] w-[min(23rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
                aria-label="Notificaciones"
              >
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-1 pb-3">
                  <h2 class="text-sm font-bold text-slate-900">Notificaciones</h2>
                  <button
                    v-if="notificationStore.unreadCount > 0"
                    type="button"
                    class="min-h-11 rounded-lg px-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"
                    @click="markAllAsRead"
                  >
                    Marcar todas como leídas
                  </button>
                </div>

                <p v-if="notificationActionError" role="alert" class="mt-3 break-words rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {{ notificationActionError }}
                </p>
                <p v-if="notificationStore.loading" role="status" class="py-8 text-center text-sm text-slate-600">
                  Cargando notificaciones...
                </p>
                <p v-else-if="notificationStore.error" role="alert" class="mt-3 break-words rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {{ notificationStore.error }}
                </p>
                <div v-else-if="!notificationItems.length" class="py-8 text-center">
                  <Bell class="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" />
                  <p class="mt-2 text-sm font-semibold text-slate-800">No tienes notificaciones</p>
                  <p class="mt-1 text-xs text-slate-600">Las nuevas notificaciones aparecerán aquí.</p>
                </div>
                <div v-else class="mt-2 space-y-1">
                  <button
                    v-for="(notification, index) in notificationItems"
                    :key="notification.id || index"
                    type="button"
                    class="min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    @click="markAsRead(notification.id)"
                  >
                    <span class="block break-words">{{ notification.text }}</span>
                  </button>
                </div>
              </section>

              <!-- Menú del perfil. -->
              <div
                v-if="profileMenuOpen"
                id="alerta-profile"
                class="absolute right-0 top-[calc(100%+0.75rem)] z-[60] w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
              >
                <button
                  type="button"
                  class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-slate-800 hover:bg-slate-50"
                  @click="showAccount"
                >
                  <UserRound class="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
                  Mi cuenta
                </button>
                <button
                  type="button"
                  class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-slate-800 hover:bg-slate-50"
                  @click="goToSettings"
                >
                  <Settings class="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
                  Configuración
                </button>
                <button
                  type="button"
                  :disabled="loggingOut"
                  class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                  @click="logout"
                >
                  <LogOut class="h-4 w-4 shrink-0" aria-hidden="true" />
                  {{ loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión' }}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main class="relative min-w-0 max-w-full flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:p-6">
          <RouterView />
        </main>
      </div>
    </div>

    <!-- Fuera del header para no recortar el modal ni colocarlo detrás del menú. -->
    <Teleport to="body">
      <div
        v-if="accountModalOpen"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5"
        @click.self="closeAccount"
      >
        <section
          ref="accountDialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-title"
          class="flex max-h-[min(92dvh,46rem)] w-full max-w-lg min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <header class="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 id="account-title" class="text-xl font-bold text-slate-900">Mi cuenta</h2>
            <button
              ref="accountCloseButton"
              type="button"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
              aria-label="Cerrar información de cuenta"
              @click="closeAccount"
            >
              <X class="h-5 w-5" aria-hidden="true" />
            </button>
          </header>
          <div class="min-h-0 space-y-4 overflow-y-auto p-4 sm:p-5">
            <div class="flex min-w-0 items-center gap-3">
              <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-700">
                {{ initials }}
              </span>
              <div class="min-w-0">
                <p class="break-words text-lg font-bold text-slate-900">{{ displayName }}</p>
                <p class="text-sm text-slate-600">{{ displayRole }}</p>
              </div>
            </div>
            <dl class="space-y-2">
              <div
                v-for="field in accountFields"
                :key="field.label"
                class="flex min-w-0 flex-col gap-1 rounded-xl bg-slate-50 p-3 sm:flex-row sm:justify-between sm:gap-4"
              >
                <dt class="shrink-0 text-sm font-semibold text-slate-600">{{ field.label }}</dt>
                <dd class="min-w-0 break-words text-sm font-medium text-slate-900 sm:text-right">{{ field.value }}</dd>
              </div>
            </dl>
          </div>
          <footer class="shrink-0 border-t border-slate-200 px-4 py-3 text-right sm:px-5">
            <button type="button" class="min-h-11 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white hover:bg-orange-700" @click="closeAccount">
              Cerrar
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>
