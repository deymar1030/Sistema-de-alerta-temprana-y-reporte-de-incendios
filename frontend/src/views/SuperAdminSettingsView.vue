<script setup lang="ts">
import AccountProfileForm from '../components/account/AccountProfileForm.vue'
</script>

<template>
  <main class="admin-page mx-auto max-w-[1100px] space-y-5">
    <header>
      <p class="text-xs font-bold uppercase tracking-widest text-orange-600">Administración general</p>
      <h1 class="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Configuración de mi perfil</h1>
      <p class="mt-2 text-sm text-slate-600">Actualiza los datos de la cuenta con la que iniciaste sesión.</p>
    </header>
    <AccountProfileForm />
  </main>
</template>