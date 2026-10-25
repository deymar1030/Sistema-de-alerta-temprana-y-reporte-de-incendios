<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotificationStore } from '../stores/notification.store'
const store = useNotificationStore()
onMounted(() => { void store.fetchNotifications() })
async function mark(id: string) { try { await store.markAsRead(id) } catch { /* El error de lectura no cambia el estado local. */ } }
async function markAll() { try { await store.markAllAsRead() } catch { /* Se muestra estado remoto al refrescar. */ } }
function date(value?: string) { if (!value) return ''; const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleString('es-BO') }
</script>
<template>
  <div class="min-h-screen bg-[#f7f1ea] px-3 py-6 text-slate-800 sm:px-5"><div class="mx-auto max-w-2xl rounded-3xl bg-white p-4 shadow-sm sm:p-6"><div class="flex flex-wrap items-center justify-between gap-2"><h1 class="text-2xl font-extrabold text-slate-900">Notificaciones</h1><button type="button" class="min-h-11 rounded-xl border border-orange-200 px-3 text-sm font-bold text-orange-700 disabled:opacity-50" :disabled="store.loading || !store.unreadCount" @click="markAll">Marcar todas</button></div><p v-if="store.loading" class="mt-6 text-sm text-slate-600">Cargando...</p><p v-else-if="store.error" role="alert" class="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ store.error }}</p><p v-else-if="!store.notifications.length" class="mt-5 rounded-xl bg-slate-50 p-6 text-sm text-slate-600">No tienes notificaciones.</p><div v-else class="mt-5 space-y-3"><article v-for="notification in store.notifications" :key="String(notification.id_notificacion ?? notification.id)" class="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"><div class="flex min-w-0 flex-wrap items-start justify-between gap-3"><div class="min-w-0 flex-1"><strong class="break-words text-sm text-slate-900">{{ notification.titulo || 'Notificación' }}</strong><p class="mt-2 break-words text-sm text-slate-700">{{ notification.mensaje }}</p><p class="mt-2 text-xs text-slate-500">{{ date(notification.fecha_hora) }}</p></div><button v-if="!notification.leida" type="button" class="min-h-10 rounded-lg bg-orange-100 px-3 text-xs font-bold text-orange-800" @click="mark(String(notification.id_notificacion ?? notification.id))">Marcar leída</button></div></article></div></div></div>
</template>
