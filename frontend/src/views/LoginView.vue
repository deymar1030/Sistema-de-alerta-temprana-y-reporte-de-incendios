<script setup lang="ts">
import { ShieldCheck, LockKeyhole } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

const login = () => {
  router.push('/')
}
</script>

<template>
  <div class="login-shell flex min-h-screen items-center justify-center px-4 py-10 text-slate-100">
    <div class="w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/85 shadow-2xl shadow-black/40 backdrop-blur-sm">
      <div class="border-b border-slate-800 bg-slate-950/70 p-8 text-center">
        <img src="/logo-alerta-ave.svg" alt="Logo ALERTA" class="mx-auto h-24 w-24" />
        <p class="mt-5 text-[10px] uppercase tracking-[0.28em] text-orange-300">Centro nacional de monitoreo</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-white">ALERTA</h1>
        <p class="mt-1 text-sm text-slate-400">Prevención de Incendios</p>
      </div>

      <form class="space-y-5 p-6" @submit.prevent="login">
        <div>
          <label for="username" class="mb-2 block text-sm text-slate-300">Usuario</label>
          <div class="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 focus-within:border-orange-500">
            <ShieldCheck class="h-4 w-4 text-slate-400" />
            <input id="username" type="text" value="operador@fireguard" class="w-full bg-transparent text-white outline-none placeholder:text-slate-500" placeholder="Usuario" />
          </div>
        </div>

        <div>
          <label for="password" class="mb-2 block text-sm text-slate-300">Contraseña</label>
          <div class="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 focus-within:border-orange-500">
            <LockKeyhole class="h-4 w-4 text-slate-400" />
            <input id="password" type="password" value="fireguard123" class="w-full bg-transparent text-white outline-none placeholder:text-slate-500" placeholder="Contraseña" />
          </div>
        </div>

        <button type="submit" class="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">Ingresar al sistema</button>
      </form>
    </div>
  </div>
</template>
