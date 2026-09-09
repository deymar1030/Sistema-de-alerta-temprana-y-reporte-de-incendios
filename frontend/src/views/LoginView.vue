<script setup lang="ts">
import { ShieldCheck, Flame, LockKeyhole } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

const login = () => {
  router.push('/')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
    <div class="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-slate-950/60 backdrop-blur-sm">
      <div class="border-b border-slate-800 bg-slate-950/80 p-6 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-300 ring-1 ring-red-500/30">
          <Flame class="h-8 w-8" />
        </div>
        <p class="mt-4 text-[10px] uppercase tracking-[0.28em] text-slate-400">Centro de monitoreo</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">FIREGUARD</h1>
      </div>

      <form class="space-y-5 p-6" @submit.prevent="login">
        <div>
          <label for="username" class="mb-2 block text-sm text-slate-300">Usuario</label>
          <div class="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 focus-within:border-sky-500">
            <ShieldCheck class="h-4 w-4 text-slate-400" />
            <input id="username" type="text" value="operador@fireguard" class="w-full bg-transparent text-white outline-none placeholder:text-slate-500" placeholder="Usuario" />
          </div>
        </div>

        <div>
          <label for="password" class="mb-2 block text-sm text-slate-300">Contraseña</label>
          <div class="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 focus-within:border-sky-500">
            <LockKeyhole class="h-4 w-4 text-slate-400" />
            <input id="password" type="password" value="fireguard123" class="w-full bg-transparent text-white outline-none placeholder:text-slate-500" placeholder="Contraseña" />
          </div>
        </div>

        <button type="submit" class="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">Ingresar</button>
      </form>
    </div>
  </div>
</template>
