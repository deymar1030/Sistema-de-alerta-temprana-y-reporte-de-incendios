<template>
  <main class="mx-auto max-w-[900px] space-y-5">
    <header><p class="text-xs font-bold uppercase tracking-wider text-orange-600">Administración</p><h1 class="text-2xl font-extrabold text-slate-900">Auditoría</h1></header>
    <section role="status" class="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      El backend establece que <strong>GET /api/auditoria</strong> y <strong>GET /api/auditoria/usuarios</strong>
      son exclusivos del rol <strong>AUDITOR</strong>, incluso para usuarios ADMIN devuelven HTTP 403.
      Esta pantalla no inventa registros ni intenta eludir esa restricción.
    </section>
  </main>
</template>
