<script setup lang="ts">
const logs = [
  { id: 'AUD-001', action: 'CREATE_USER', performedBy: 'USR-SA-001', targetRole: 'SUPER_ADMIN', timestamp: '2026-10-11T10:00:00Z' },
  { id: 'AUD-002', action: 'EDIT_USER', performedBy: 'USR-SA-001', targetRole: 'INSTITUTION_ADMIN', timestamp: '2026-10-11T09:15:00Z' },
  { id: 'AUD-003', action: 'DEACTIVATE_USER', performedBy: 'USR-SA-001', targetRole: 'CITIZEN', timestamp: '2026-10-10T18:20:00Z' },
]
</script>

<template>
  <div class="space-y-6 p-6">
    <h1 class="text-3xl font-bold text-slate-900">Auditoría</h1>
    <div class="space-y-3">
      <div v-for="log in logs" :key="log.id" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="font-bold text-slate-900">{{ log.action }}</p>
          <span class="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold uppercase text-orange-700">{{ log.targetRole }}</span>
        </div>
        <p class="mt-2 text-sm text-slate-600">Realizado por: {{ log.performedBy }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ new Date(log.timestamp).toLocaleString() }}</p>
      </div>
    </div>
  </div>
</template>
