<script setup lang="ts">
const sections = [
  { title: 'Perfil', items: ['Nombre', 'Rol', 'Correo', 'Horario'] },
  { title: 'Notificaciones', items: ['Email', 'SMS', 'Push', 'Escala de prioridad'] },
  { title: 'Monitoreo', items: ['Frecuencia de lectura', 'Umbrales', 'Integración de sensores', 'Persistencia'] },
  { title: 'Motor de detección', items: ['Sensibilidad', 'Reglas', 'Escenarios', 'Métricas'] },
  { title: 'Sistema', items: ['Idioma', 'Zona horaria', 'Respaldo', 'Seguridad'] },
]
</script>

<template>
  <div class="grid gap-4 xl:grid-cols-2">
    <div v-for="section in sections" :key="section.title" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 class="text-lg font-semibold text-white">{{ section.title }}</h3>
      <div class="mt-4 space-y-3">
        <div v-for="item in section.items" :key="item" class="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-300">
          <span>{{ item }}</span>
          <button class="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200">Configurar</button>
        </div>
      </div>
    </div>
  </div>
</template>
