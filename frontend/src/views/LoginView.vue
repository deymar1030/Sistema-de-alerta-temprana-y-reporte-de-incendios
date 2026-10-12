<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const correo = ref('')
const password = ref('')
const loading = ref(false)

const error = ref(
  route.query.access === 'mobile'
    ? 'Este acceso está disponible únicamente en la aplicación móvil.'
    : '',
)

const useDemoMode = import.meta.env.VITE_USE_MOCKS === 'true'

const demoAccounts = useDemoMode ? [
  {
    nombre: 'Administrador',
    email: 'superadmin@alerta.bo',
    password: 'Admin123',
    rol: 'ADMIN',
    detalle: 'Administración general',
  },
  {
    nombre: 'Jefe de institución',
    email: 'admin.bomberos@alerta.bo',
    password: 'Admin123',
    rol: 'JEFE_INSTITUCION',
    detalle: 'Respuesta institucional',
  },
  {
    nombre: 'Ciudadano demo',
    email: 'ciudadano@alerta.bo',
    password: 'Ciudadano123',
    rol: 'CIUDADANO',
    detalle: 'Reportes y alertas',
  },
] : [] as const

const homeByRole = (rol?: string) => {
  switch (rol ?? 'ADMIN') {
    case 'CIUDADANO':
      return '/ciudadano/inicio'
    case 'JEFE_INSTITUCION':
    case 'OPERATIVO':
      return '/institucion/dashboard'
    case 'ADMIN':
    default:
      return '/super-admin/dashboard'
  }
}

const isCompatibleRedirect = (redirect: string | undefined, rol?: string) => {
  if (!redirect || !redirect.startsWith('/')) return false

  const normalized = redirect.split('?')[0]

  switch (rol ?? 'ADMIN') {
    case 'ADMIN':
      return normalized.startsWith('/super-admin')
    case 'JEFE_INSTITUCION':
    case 'OPERATIVO':
      return normalized.startsWith('/institucion')
    case 'CIUDADANO':
      return normalized.startsWith('/ciudadano')
    default:
      return false
  }
}

const seleccionarCuenta = (correoSeleccionado: string, passSeleccionada: string) => {
  correo.value = correoSeleccionado
  password.value = passSeleccionada
  error.value = ''
}

const ingresar = async () => {
  error.value = ''
  loading.value = true

  try {
    const user = await authStore.login(correo.value, password.value)
    const role = user.role ?? user.rol ?? 'ADMIN'
    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : undefined

    if (redirectPath && isCompatibleRedirect(redirectPath, role)) {
      await router.push(redirectPath)
      return
    }

    await router.push(homeByRole(role))
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-shell min-h-screen px-4 py-8">
    <div
      class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-[0.95fr_1.05fr]"
    >
      <section
        class="relative hidden overflow-hidden bg-[#17212b] p-10 text-white lg:flex lg:flex-col lg:justify-between"
      >
        <div
          class="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl"
        ></div>

        <div class="relative">
          <img
            src="/logo-alerta-ave.svg"
            alt="ALERTA"
            class="main-logo-image h-20 w-20"
          />

          <p
            class="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-orange-300"
          >
            ALERTA
          </p>

          <h1 class="mt-2 text-4xl font-semibold leading-tight">
            Prevención y coordinación de incendios
          </h1>

          <p class="mt-4 max-w-md text-sm leading-6 text-slate-300">
            Monitoreo, validación humana y coordinación institucional de
            emergencias por incendios.
          </p>
        </div>

        <div
          class="relative rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <p
            class="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300"
          >
            Acceso seguro
          </p>

          <p class="mt-2 text-sm text-slate-300">
            Ingresa con las credenciales asignadas o usa una cuenta demo.
          </p>
        </div>
      </section>

      <section class="flex items-center p-6 sm:p-10">
        <div class="mx-auto w-full max-w-lg">
          <div class="lg:hidden">
            <img
              src="/logo-alerta-ave.svg"
              alt="ALERTA"
              class="main-logo-image h-16 w-16"
            />
          </div>

          <p
            class="mt-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500"
          >
            Acceso al sistema
          </p>

          <h2 class="mt-2 text-3xl font-semibold text-slate-900">
            Ingresar a ALERTA
          </h2>

          <p class="mt-2 text-sm text-slate-600">
            Ingresa con tu correo y contraseña para acceder al sistema.
          </p>

          <form
            class="mt-7 space-y-4"
            @submit.prevent="ingresar"
          >
            <label class="block text-sm font-medium text-slate-700">
              Correo

              <div
                class="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 focus-within:border-orange-300"
              >
                <ShieldCheck class="h-4 w-4 text-slate-400" />

                <input
                  v-model="correo"
                  type="email"
                  autocomplete="email"
                  required
                  class="w-full bg-transparent text-slate-900 outline-none"
                  placeholder="Ingresa tu correo"
                />
              </div>
            </label>

            <label class="block text-sm font-medium text-slate-700">
              Contraseña

              <div
                class="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 focus-within:border-orange-300"
              >
                <LockKeyhole class="h-4 w-4 text-slate-400" />

                <input
                  v-model="password"
                  type="password"
                  autocomplete="current-password"
                  required
                  class="w-full bg-transparent text-slate-900 outline-none"
                  placeholder="Ingresa tu contraseña"
                />
              </div>
            </label>

            <p
              v-if="error"
              class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {{ error }}
            </p>

            <button
              type="submit"
              :disabled="loading"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f24a23] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-100 transition hover:bg-[#df3f1c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ loading ? 'Ingresando...' : 'Ingresar' }}

              <ArrowRight
                v-if="!loading"
                class="h-4 w-4"
              />
            </button>
          </form>

          <div v-if="demoAccounts.length" class="mt-8">
            <p class="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              CUENTAS DEMO
            </p>

            <div class="mt-3 flex flex-col gap-3">
              <button
                v-for="account in demoAccounts"
                :key="account.email"
                type="button"
                class="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left shadow-sm transition hover:border-orange-200 hover:bg-orange-50"
                @click="seleccionarCuenta(account.email, account.password)"
              >
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ account.nombre }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ account.detalle }}</p>
                </div>
                <span class="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">
                  {{ account.rol }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>