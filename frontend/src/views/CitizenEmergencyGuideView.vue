<script setup lang="ts">
const instructions = [
  'Manténgase alejado del incendio y evite áreas con humo denso.',
  'No intente ingresar a una zona peligrosa ni acercarse a una estructura en llamas.',
  'Llame a emergencias si existe peligro inmediato o si hay personas atrapadas.',
  'Siga las instrucciones de las autoridades y bomberos.',
  'No bloquee el acceso de vehículos de emergencia ni las rutas de evacuación.',
]
</script>

<template>
  <div class="min-h-screen bg-[#f5efe8] px-4 py-6 text-slate-800">
    <div class="mx-auto max-w-md rounded-[30px] bg-white p-5 shadow-lg shadow-orange-100">
      <h1 class="text-2xl font-bold text-slate-900">Instrucciones de emergencia</h1>
      <ul class="mt-4 space-y-3">
        <li v-for="(instruction, index) in instructions" :key="index" class="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">{{ index + 1 }}</span>
          <span>{{ instruction }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
