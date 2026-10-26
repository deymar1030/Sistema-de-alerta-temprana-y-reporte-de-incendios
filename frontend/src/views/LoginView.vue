
<script setup lang="ts">
import { ref } from 'vue'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Flame,
  LockKeyhole,
  Mail,
  RadioTower,
  ShieldCheck,
} from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const correo = ref('')
const password = ref('')
const mostrarPassword = ref(false)
const loading = ref(false)

const error = ref(
  route.query.access === 'mobile'
    ? 'Este acceso está disponible únicamente en la aplicación móvil.'
    : '',
)

const useDemoMode = import.meta.env.VITE_USE_MOCKS === 'true'

const demoAccounts = useDemoMode
  ? [
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
    ]
  : [] as const

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

const isCompatibleRedirect = (
  redirect: string | undefined,
  rol?: string
) => {
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

const seleccionarCuenta = (
  correoSeleccionado: string,
  passSeleccionada: string
) => {
  correo.value = correoSeleccionado
  password.value = passSeleccionada
  mostrarPassword.value = false
  error.value = ''
}

const ingresar = async () => {
  if (loading.value) return

  error.value = ''
  loading.value = true

  try {
    const user = await authStore.login(
      correo.value,
      password.value
    )

    const role = user.role ?? user.rol ?? 'ADMIN'

    const redirectPath =
      typeof route.query.redirect === 'string'
        ? route.query.redirect
        : undefined

    if (
      redirectPath &&
      isCompatibleRedirect(redirectPath, role)
    ) {
      await router.push(redirectPath)
      return
    }

    await router.push(homeByRole(role))
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main
    class="login-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-10"
  >
    <!-- Fondo decorativo -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-orange-100/60 blur-3xl"
    ></div>

    <div
      aria-hidden="true"
      class="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-slate-200/60 blur-3xl"
    ></div>

    <!-- Contenedor principal -->
    <div
      class="relative mx-auto grid w-full max-w-[1100px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] lg:min-h-[680px] lg:grid-cols-[0.94fr_1.06fr]"
    >
      <!-- PANEL IZQUIERDO -->
      <section
        class="relative hidden overflow-hidden bg-[#162430] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-12"
        aria-label="Acerca de ALERTA"
      >
        <!-- Decoración -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -right-32 -top-28 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl"
        ></div>

        <div
          aria-hidden="true"
          class="pointer-events-none absolute -bottom-40 -left-28 h-80 w-80 rounded-full bg-orange-600/10 blur-3xl"
        ></div>

        <div
          aria-hidden="true"
          class="pointer-events-none absolute right-8 top-16 h-52 w-52 rounded-full border border-white/5"
        ></div>

        <div class="relative">
          <!-- LOGO PRINCIPAL -->
          <div class="flex items-center gap-5">
            <div
              class="flex h-[120px] w-[108px] shrink-0 items-center justify-center rounded-[24px] border border-orange-100 bg-[#fffaf5] shadow-[0_16px_36px_rgba(0,0,0,0.20)]"
            >
              <img
                src="/logo-alerta-ave.svg"
                alt="Isotipo de ALERTA"
                class="h-[102px] w-[84px] object-contain"
              />
            </div>

            <div class="min-w-0">
              <p
                class="text-[12px] font-bold uppercase tracking-[0.25em] text-orange-300"
              >
                SISTEMA
              </p>

              <p
                class="mt-1 text-[30px] font-extrabold tracking-[0.06em] text-white"
              >
                ALERTA
              </p>

              <p class="mt-1 text-sm text-slate-300">
                Prevención de incendios
              </p>
            </div>
          </div>

          <!-- Mensaje principal -->
          <div
            class="mt-12 h-1 w-14 rounded-full bg-orange-500"
          ></div>

          <h1
            class="mt-5 max-w-[370px] text-[38px] font-bold leading-[1.16] tracking-tight"
          >
            Detectar a tiempo.

            <span class="block text-orange-300">
              Actuar mejor.
            </span>
          </h1>

          <p
            class="mt-5 max-w-[370px] text-base leading-7 text-slate-300"
          >
            Monitoreo de riesgos y coordinación de
            respuestas frente a emergencias por incendios.
          </p>

          <!-- Características -->
          <div class="mt-9 space-y-4">
            <div
              class="flex items-center gap-3 text-sm text-slate-200"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange-300"
              >
                <RadioTower
                  class="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              Monitoreo y alertas
            </div>

            <div
              class="flex items-center gap-3 text-sm text-slate-200"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange-300"
              >
                <Flame
                  class="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              Prevención y respuesta coordinada
            </div>
          </div>
        </div>

        <!-- Mensaje inferior -->
        <div
          class="relative mt-10 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4"
        >
          <ShieldCheck
            class="mt-0.5 h-5 w-5 shrink-0 text-orange-300"
            aria-hidden="true"
          />

          <div>
            <p
              class="text-sm font-semibold text-white"
            >
              Acceso al sistema
            </p>

            <p
              class="mt-1 text-sm leading-6 text-slate-300"
            >
              Ingresa con las credenciales asignadas
              a tu cuenta.
            </p>
          </div>
        </div>
      </section>

      <!-- PANEL DERECHO -->
      <section
        class="flex items-center justify-center px-5 py-9 sm:px-10 sm:py-12 xl:px-14"
      >
        <div class="w-full max-w-[440px]">
          <!-- Logo visible en celulares -->
          <div
            class="mb-9 flex items-center gap-3 lg:hidden"
          >
            <div
              class="flex h-[76px] w-[70px] shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-[#fffaf5] shadow-sm"
            >
              <img
                src="/logo-alerta-ave.svg"
                alt="Isotipo de ALERTA"
                class="h-[66px] w-[54px] object-contain"
              />
            </div>

            <div>
              <p
                class="text-2xl font-extrabold tracking-[0.08em] text-[#162430]"
              >
                ALERTA
              </p>

              <p class="text-sm text-slate-600">
                Prevención de incendios
              </p>
            </div>
          </div>

          <!-- Encabezado -->
          <span
            class="inline-flex items-center rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-700"
          >
            Bienvenido a ALERTA
          </span>

          <h2
            class="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-[36px]"
          >
            Inicia sesión
          </h2>

          <p
            class="mt-3 text-base leading-6 text-slate-600"
          >
            Accede a tu cuenta para continuar
            con el sistema.
          </p>

          <!-- FORMULARIO -->
          <form
            class="mt-8 space-y-5"
            @submit.prevent="ingresar"
          >
            <!-- CORREO -->
            <div>
              <label
                for="login-correo"
                class="mb-2 block text-sm font-semibold text-slate-800"
              >
                Correo electrónico
              </label>

              <div
                class="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 transition-colors focus-within:border-orange-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/15"
              >
                <Mail
                  class="h-5 w-5 shrink-0 text-slate-500"
                  aria-hidden="true"
                />

                <input
                  id="login-correo"
                  v-model="correo"
                  name="email"
                  type="email"
                  inputmode="email"
                  autocomplete="username"
                  autocapitalize="none"
                  spellcheck="false"
                  required
                  :disabled="loading"
                  placeholder="nombre@ejemplo.com"
                  class="min-w-0 flex-1 bg-transparent py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
                />
              </div>
            </div>

            <!-- CONTRASEÑA CON OJITO -->
            <div>
              <label
                for="login-password"
                class="mb-2 block text-sm font-semibold text-slate-800"
              >
                Contraseña
              </label>

              <div
                class="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 pl-4 pr-1 transition-colors focus-within:border-orange-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/15"
              >
                <LockKeyhole
                  class="h-5 w-5 shrink-0 text-slate-500"
                  aria-hidden="true"
                />

                <input
                  id="login-password"
                  v-model="password"
                  name="password"
                  :type="mostrarPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  :disabled="loading"
                  placeholder="Ingresa tu contraseña"
                  class="min-w-0 flex-1 bg-transparent py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
                />

                <!-- BOTÓN MOSTRAR / OCULTAR -->
                <button
                  type="button"
                  :aria-label="
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  "
                  :aria-pressed="mostrarPassword"
                  aria-controls="login-password"
                  :title="
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  "
                  :disabled="loading"
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-orange-50 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50"
                  @click="mostrarPassword = !mostrarPassword"
                >
                  <EyeOff
                    v-if="mostrarPassword"
                    class="h-5 w-5"
                    aria-hidden="true"
                  />

                  <Eye
                    v-else
                    class="h-5 w-5"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            <!-- MENSAJE DE ERROR -->
            <p
              v-if="error"
              role="alert"
              class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {{ error }}
            </p>

            <!-- INGRESAR -->
            <button
              type="submit"
              :disabled="loading"
              class="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#ed4b24] px-5 py-3.5 text-base font-bold text-white shadow-[0_10px_24px_rgba(237,75,36,0.18)] transition-colors hover:bg-[#d93e19] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                {{
                  loading
                    ? 'Ingresando...'
                    : 'Ingresar al sistema'
                }}
              </span>

              <ArrowRight
                v-if="!loading"
                class="h-5 w-5"
                aria-hidden="true"
              />
            </button>
          </form>

          <!-- TEXTO INFERIOR -->
          <div
            class="mt-7 flex items-start gap-2 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-500"
          >
            <ShieldCheck
              class="mt-0.5 h-5 w-5 shrink-0 text-slate-500"
              aria-hidden="true"
            />

            Usa las credenciales que te asignaron
            para acceder a tu rol.
          </div>

          <!-- CUENTAS DEMO -->
          <div
            v-if="demoAccounts.length"
            class="mt-8 border-t border-slate-100 pt-6"
          >
            <p
              class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
            >
              Cuentas de demostración
            </p>

            <div class="mt-3 flex flex-col gap-3">
              <button
                v-for="account in demoAccounts"
                :key="account.email"
                type="button"
                class="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                @click="
                  seleccionarCuenta(
                    account.email,
                    account.password
                  )
                "
              >
                <span class="min-w-0">
                  <span
                    class="block text-sm font-semibold text-slate-900"
                  >
                    {{ account.nombre }}
                  </span>

                  <span
                    class="mt-1 block text-xs text-slate-600"
                  >
                    {{ account.detalle }}
                  </span>
                </span>

                <span
                  class="shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800"
                >
                  {{ account.rol }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
