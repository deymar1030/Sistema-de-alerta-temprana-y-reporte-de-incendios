<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, Bell, ClipboardList, Flame, Home, Plus, RefreshCw, UserRound } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.store'
import { useCitizenReportStore } from '../stores/citizen-report.store'
import { useNotificationStore } from '../stores/notification.store'
import { backendAlertsService, type BackendAlert } from '../services/backend-alerts.service'
const router = useRouter()
const auth = useAuthStore()
const reportsStore = useCitizenReportStore()
const notificationStore = useNotificationStore()
const alerts = ref<BackendAlert[]>([])
const loading = ref(false)
const alertError = ref('')
const name = computed(() => auth.user?.firstName ?? auth.user?.nombre?.split(' ')[0] ?? 'Ciudadano')
const latestReports = computed(() => reportsStore.reports.filter((r) => r.usuarioId === auth.user?.id || r.citizenId === auth.user?.id).slice(0, 3))
const notifications = computed(() => notificationStore.notifications.slice(0, 2))
async function refresh() {
  loading.value = true; alertError.value = ''
  await Promise.all([reportsStore.fetchReports(), notificationStore.fetchNotifications()])
  try { alerts.value = (await backendAlertsService.active()).slice(0, 4) }
  catch (e) { alerts.value = []; alertError.value = e instanceof Error ? e.message : 'No fue posible consultar las alertas.' }
  finally { loading.value = false }
}
onMounted(() => { void refresh() })
</script>

<template>
  <div class="min-h-dvh bg-[#f7f1ea] pb-24 text-slate-800">
    <div class="mx-auto min-w-0 max-w-2xl bg-white px-4 pb-8 pt-6 shadow-sm sm:px-7">
      <header class="flex min-w-0 flex-wrap items-center justify-between gap-3"><div class="min-w-0"><p class="text-sm text-slate-500">Hola,</p><h1 class="break-words text-2xl font-extrabold text-slate-900">{{ name }}</h1><p class="mt-1 text-xs font-semibold uppercase tracking-wider text-orange-600">ALERTA · Protección ciudadana</p></div><button type="button" class="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-700" aria-label="Ver mis notificaciones" @click="router.push('/ciudadano/notificaciones')"><Bell class="h-5 w-5"/><span v-if="notificationStore.unreadCount" class="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{{ notificationStore.unreadCount }}</span></button></header>
      <button type="button" class="mt-6 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 px-4 py-4 text-base font-extrabold text-white shadow-md shadow-orange-100 hover:bg-orange-700 sm:text-lg" @click="router.push('/ciudadano/reportar')"><Flame class="h-6 w-6 shrink-0"/> Reportar un posible incendio</button>
      <section class="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"><div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="flex items-center gap-2 text-lg font-bold text-slate-900"><AlertTriangle class="h-5 w-5 text-orange-600"/> Alertas activas</h2><p class="mt-1 text-xs text-slate-500">Alertas del sistema, no necesariamente cercanas a ti.</p></div><button type="button" class="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 disabled:opacity-40" :disabled="loading" @click="refresh"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" /> Actualizar</button></div><p v-if="loading" class="mt-4 text-sm text-slate-600">Consultando datos...</p><p v-else-if="alertError" role="alert" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ alertError }}</p><p v-else-if="!alerts.length" class="mt-4 text-sm text-slate-600">No se registran alertas activas.</p><ul v-else class="mt-4 space-y-3"><li v-for="alert in alerts" :key="String(alert.id_alerta)" class="min-w-0 rounded-xl border border-slate-200 bg-white p-3"><div class="flex flex-wrap justify-between gap-2"><span class="break-all font-bold text-slate-900">Alerta #{{ alert.id_alerta }}</span><span class="max-w-full break-all rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-800">{{ alert.estado }}</span></div><p class="mt-1 break-words text-sm text-slate-600">{{ alert.clasificacion ?? 'Sin clasificar' }} · {{ alert.fecha }} {{ alert.hora }}</p></li></ul></section>
      <section class="mt-7"><div class="flex min-w-0 items-center justify-between gap-2"><h2 class="text-lg font-bold text-slate-900">Mis últimos reportes</h2><RouterLink to="/ciudadano/mis-reportes" class="text-sm font-bold text-orange-700">Ver todos</RouterLink></div><p v-if="reportsStore.error" role="alert" class="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ reportsStore.error }}</p><p v-else-if="!latestReports.length" class="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Aún no tienes reportes confirmados por el servidor.</p><div v-else class="mt-3 space-y-3"><button v-for="report in latestReports" :key="report.id" type="button" class="block w-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-orange-300" @click="router.push(`/ciudadano/reporte/${encodeURIComponent(report.id)}`)"><div class="flex flex-wrap justify-between gap-2"><strong class="break-all text-sm text-slate-900">Reporte #{{ report.id }}</strong><span class="break-all rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800">{{ report.status }}</span></div><p class="mt-2 break-words text-sm text-slate-600">{{ report.descripcion || 'Sin descripción' }}</p></button></div></section>
      <section class="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"><div class="flex items-center justify-between gap-3"><h2 class="text-lg font-bold text-slate-900">Notificaciones recientes</h2><RouterLink to="/ciudadano/notificaciones" class="text-sm font-bold text-orange-700">Ver todas</RouterLink></div><p v-if="notificationStore.error" role="alert" class="mt-3 text-sm text-red-700">{{ notificationStore.error }}</p><p v-else-if="!notifications.length" class="mt-3 text-sm text-slate-600">No tienes notificaciones.</p><ul v-else class="mt-3 space-y-2"><li v-for="item in notifications" :key="String(item.id_notificacion ?? item.id)" class="break-words rounded-xl bg-white p-3 text-sm text-slate-700"><strong>{{ item.titulo || 'Aviso' }}</strong><p class="mt-1">{{ item.mensaje }}</p></li></ul></section>
      <section class="mt-7 rounded-2xl border border-orange-100 bg-orange-50 p-4"><h2 class="text-lg font-bold text-slate-900">Consejos de seguridad</h2><p class="mt-2 text-sm leading-relaxed text-slate-700">Mantente lejos del fuego y del humo. No ingreses a edificios o zonas peligrosas. Sigue las indicaciones del personal de emergencia.</p></section>
    </div>
    <nav class="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-2xl border-t border-slate-200 bg-white/95 px-2 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_20px_rgba(15,23,42,.07)] backdrop-blur" aria-label="Navegación ciudadana"><div class="grid grid-cols-4 gap-1 text-center text-xs font-semibold text-slate-600"><button type="button" class="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl bg-orange-50 text-orange-700" @click="router.push('/ciudadano/inicio')"><Home class="h-4 w-4"/> Inicio</button><button type="button" class="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl" @click="router.push('/ciudadano/reportar')"><Plus class="h-4 w-4"/> Reportar</button><button type="button" class="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl" @click="router.push('/ciudadano/mis-reportes')"><ClipboardList class="h-4 w-4"/> Reportes</button><button type="button" class="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl" @click="router.push('/ciudadano/perfil')"><UserRound class="h-4 w-4"/> Perfil</button></div></nav>
  </div>
</template>
