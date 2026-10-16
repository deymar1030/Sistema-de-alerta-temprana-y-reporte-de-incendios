<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { citizensMock } from '../mocks/citizens'
import { citizenReportsMock } from '../mocks/citizenReports'
import { notificationsMock } from '../mocks/notifications'

const router = useRouter()
const authStore = useAuthStore()

const userName = computed(() => authStore.user?.firstName || authStore.user?.nombre?.split(' ')[0] || 'Ciudadano')
const latestReports = computed(() => citizenReportsMock.slice(0, 3))
const recentNotifications = computed(() => notificationsMock.slice(0, 2))
const nearbyAlerts = computed(() => [
  { id: 'A-201', title: 'Alerta cercana', message: 'Zona con humo y temperatura elevada', severity: 'Alta' },
  { id: 'A-202', title: 'Monitoreo activo', message: 'Se reportó actividad en la zona', severity: 'Media' },
])

const demoCitizen = citizensMock[0]
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] pb-24 text-slate-800">
    <div class="mx-auto max-w-md bg-white px-4 pb-8 pt-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500">Hola,</p>
          <h1 class="text-2xl font-bold text-slate-900">{{ userName }}</h1>
        </div>
        <button class="rounded-full bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-700" @click="router.push('/ciudadano/notificaciones')">Notificaciones</button>
      </div>

      <button class="mt-6 w-full rounded-[24px] bg-[#f24a23] px-4 py-4 text-lg font-bold text-white shadow-lg shadow-orange-200" @click="router.push('/ciudadano/reportar')">
        REPORTAR INCENDIO
      </button>

      <section class="mt-6 rounded-[24px] bg-slate-50 p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900">Alertas cercanas</h2>
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Live</span>
        </div>
        <ul class="mt-3 space-y-3">
          <li v-for="alert in nearbyAlerts" :key="alert.id" class="rounded-2xl border border-slate-200 bg-white p-3">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-slate-800">{{ alert.title }}</p>
              <span class="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold uppercase text-orange-700">{{ alert.severity }}</span>
            </div>
            <p class="mt-1 text-sm text-slate-600">{{ alert.message }}</p>
          </li>
        </ul>
      </section>

      <section class="mt-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900">Mis últimos reportes</h2>
          <button class="text-sm font-medium text-orange-600" @click="router.push('/ciudadano/mis-reportes')">Ver todo</button>
        </div>
        <div class="mt-3 space-y-3">
          <div v-for="report in latestReports" :key="report.id" class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" @click="router.push(`/ciudadano/reporte/${report.id}`)">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-slate-800">{{ report.id }}</p>
              <span class="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase text-amber-700">{{ report.status }}</span>
            </div>
            <p class="mt-2 text-sm text-slate-600">{{ (report.description ?? report.descripcion ?? 'Sin descripción').slice(0, 80) }}</p>
          </div>
        </div>
      </section>

      <section class="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900">Notificaciones recientes</h2>
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ recentNotifications.length }}</span>
        </div>
        <ul class="mt-3 space-y-2">
          <li v-for="notification in recentNotifications" :key="notification.id" class="rounded-xl bg-white p-3 text-sm text-slate-700 shadow-sm">
            {{ notification.message }}
          </li>
        </ul>
      </section>

      <section class="mt-6 rounded-[24px] border border-orange-100 bg-orange-50 p-4">
        <h2 class="text-lg font-bold text-slate-900">Preparación del vecino</h2>
        <p class="mt-2 text-sm text-slate-700">{{ demoCitizen?.city ?? 'La Paz' }} · {{ demoCitizen?.phone ?? 'Sin registro' }}</p>
      </section>

      <section class="mt-6">
        <h2 class="text-lg font-bold text-slate-900">Recomendaciones de seguridad</h2>
        <div class="mt-3 grid gap-3">
          <div class="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">Manténgase alejado del incendio y evite zonas con humo denso.</div>
          <div class="rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">No intente ingresar a una zona peligrosa. Siga instrucciones de autoridades.</div>
        </div>
      </section>
    </div>

    <nav class="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-slate-200 bg-white px-4 py-3">
      <div class="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-slate-600">
        <button class="rounded-xl bg-orange-50 py-2 text-orange-700" @click="router.push('/ciudadano/inicio')">Inicio</button>
        <button class="rounded-xl py-2" @click="router.push('/ciudadano/reportar')">Reportar</button>
        <button class="rounded-xl py-2" @click="router.push('/ciudadano/mis-reportes')">Reportes</button>
        <button class="rounded-xl py-2" @click="router.push('/ciudadano/perfil')">Perfil</button>
      </div>
    </nav>
  </div>
</template>
