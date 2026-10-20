<script setup lang="ts">
import { computed } from 'vue'
import { notificationsMock } from '../mocks/notifications'

const notifications = computed(() => notificationsMock)

const markRead = (id: string) => {
  const item = notificationsMock.find((entry) => entry.id === id)
  if (item) item.read = true
}

const markAllRead = () => {
  notificationsMock.forEach((entry) => {
    entry.read = true
  })
}
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] px-4 py-6 text-slate-800">
    <div class="mx-auto max-w-md rounded-[30px] bg-white p-5 shadow-lg shadow-orange-100">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-900">Notificaciones</h1>
        <button class="text-sm font-medium text-orange-600" @click="markAllRead">Marcar todas</button>
      </div>

      <div class="mt-4 space-y-3">
        <article v-for="notification in notifications" :key="notification.id" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-slate-900">{{ notification.title }}</p>
              <p class="mt-1 text-sm text-slate-600">{{ notification.message }}</p>
            </div>
            <button v-if="!notification.read" class="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold uppercase text-orange-700" @click="markRead(notification.id)">Leer</button>
          </div>
          <p class="mt-2 text-xs text-slate-500">{{ new Date(notification.createdAt).toLocaleString() }}</p>
        </article>
      </div>
    </div>
  </div>
</template>
