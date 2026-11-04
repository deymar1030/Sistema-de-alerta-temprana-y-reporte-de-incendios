<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { CheckCircle2, CircleAlert, RefreshCw, Save, ShieldCheck, UserRound } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth.store'
import { profileService, type OwnProfileChanges } from '../../services/profile.service'
import { getRoleLabel } from '../../types'

const auth = useAuthStore()
type FieldKey = 'nombre' | 'primer_apellido' | 'segundo_apellido' | 'correo' | 'telefono'
const form = reactive<Record<FieldKey, string>>({
  nombre: '', primer_apellido: '', segundo_apellido: '', correo: '', telefono: '',
})
const original = ref<Record<FieldKey, string>>({ ...form })
const saving = ref(false)
const error = ref('')
const success = ref('')
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const roleLabel = computed(() => auth.role ? getRoleLabel(auth.role) : 'Sin rol')
const institutionLabel = computed(() => auth.user?.institutionId ?? auth.user?.institucionId ?? null)
const changed = computed(() => (Object.keys(form) as FieldKey[]).some(key => form[key].trim() !== original.value[key]))

function syncFromUser() {
  const user = auth.user
  if (!user) return
  const firstName = String(user.firstName ?? '').trim()
  const combined = String(user.nombre ?? '').trim()
  form.nombre = firstName || combined
  form.primer_apellido = String(user.primerApellido ?? '').trim()
  form.segundo_apellido = String(user.segundoApellido ?? '').trim()
  // Si /auth/me no entrega apellidos separados, no adivinamos valores.
  form.correo = String(user.email ?? '').trim()
  form.telefono = String(user.telefono ?? user.phone ?? '').trim()
  original.value = { ...form }
}
watch(() => auth.user, () => { if (!saving.value) syncFromUser() }, { immediate: true })

async function reload() {
  error.value = ''
  success.value = ''
  try {
    await auth.refreshProfile()
    syncFromUser()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo actualizar la información.'
  }
}

async function save() {
  error.value = ''
  success.value = ''
  if (saving.value || !auth.user) return
  if (!form.nombre.trim()) { error.value = 'El nombre es obligatorio.'; return }
  if (!emailPattern.test(form.correo.trim())) { error.value = 'Escribe un correo electronico valido.'; return }
  const differences: OwnProfileChanges = {}
  for (const key of Object.keys(form) as FieldKey[]) {
    const value = form[key].trim()
    if (value !== original.value[key]) differences[key] = value
  }
  if (!Object.keys(differences).length) return
  saving.value = true
  try {
    const currentUserId = String(auth.user.id)
    await profileService.updateOwnProfile(currentUserId, differences)
    const confirmed = await auth.refreshProfile()
    syncFromUser()
    // No confirmar exito si /auth/me aun devuelve los datos previos.
    const reloaded: Record<FieldKey, string> = {
      nombre: String(confirmed.firstName ?? confirmed.nombre ?? '').trim(),
      primer_apellido: String(confirmed.primerApellido ?? '').trim(),
      segundo_apellido: String(confirmed.segundoApellido ?? '').trim(),
      correo: String(confirmed.email ?? '').trim(),
      telefono: String(confirmed.telefono ?? confirmed.phone ?? '').trim(),
    }
    const missing = (Object.keys(differences) as FieldKey[]).filter(key => {
      const expected = String(differences[key] ?? '').trim()
      const actual = reloaded[key]
      return key === 'correo' ? expected.toLowerCase() !== actual.toLowerCase() : expected !== actual
    })
    if (missing.length) {
      error.value = 'El servidor acepto la solicitud, pero los datos recargados todavia no reflejan todos los cambios. Verifica los permisos o consulta con backend.'
      return
    }
    success.value = 'Los datos de tu cuenta fueron actualizados en el servidor.'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No fue posible guardar tus datos.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="account-settings-title">
    <header class="border-b border-slate-200 bg-slate-50/70 px-5 py-5 sm:px-7">
      <div class="flex items-start gap-3">
        <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><UserRound class="h-5 w-5" aria-hidden="true" /></span>
        <div class="min-w-0">
          <h2 id="account-settings-title" class="text-xl font-extrabold text-slate-900">Datos de mi cuenta</h2>
          <p class="mt-1 text-sm text-slate-600">Edita tu información personal. Tu rol y tu institución son administrados por el sistema.</p>
        </div>
      </div>
    </header>

    <div v-if="!auth.user" role="alert" class="p-5 text-sm text-red-700">No hay una sesión iniciada.</div>
    <form v-else class="space-y-5 p-5 sm:p-7" @submit.prevent="save">
      <p v-if="error" role="alert" class="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span class="break-words">{{ error }}</span>
      </p>
      <p v-if="success" role="status" class="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{{ success }}</span>
      </p>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm font-semibold text-slate-700">Nombre <span class="text-red-700">*</span>
          <input v-model="form.nombre" class="form-input mt-1.5" type="text" name="given-name" autocomplete="given-name" maxlength="120" required :disabled="saving" />
        </label>
        <label class="block text-sm font-semibold text-slate-700">Primer apellido
          <input v-model="form.primer_apellido" class="form-input mt-1.5" type="text" name="family-name" autocomplete="family-name" maxlength="120" :disabled="saving" />
        </label>
        <label class="block text-sm font-semibold text-slate-700">Segundo apellido
          <input v-model="form.segundo_apellido" class="form-input mt-1.5" type="text" maxlength="120" :disabled="saving" />
        </label>
        <label class="block text-sm font-semibold text-slate-700">Teléfono
          <input v-model="form.telefono" class="form-input mt-1.5" type="tel" autocomplete="tel" maxlength="40" :disabled="saving" />
        </label>
        <label class="block text-sm font-semibold text-slate-700 sm:col-span-2">Correo electrónico <span class="text-red-700">*</span>
          <input v-model="form.correo" class="form-input mt-1.5" type="email" name="email" autocomplete="email" maxlength="254" required :disabled="saving" />
        </label>
      </div>

      <div class="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
        <div><div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><ShieldCheck class="h-4 w-4" aria-hidden="true" /> Rol asignado</div><p class="mt-1 font-semibold text-slate-800">{{ roleLabel }}</p></div>
        <div><p class="text-xs font-bold uppercase tracking-wide text-slate-500">Institución asignada</p><p class="mt-1 font-semibold text-slate-800">{{ institutionLabel ? `#${institutionLabel}` : 'Sin institución' }}</p></div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <button type="button" class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" :disabled="saving" @click="reload"><RefreshCw class="h-4 w-4" aria-hidden="true" /> Recargar datos</button>
        <button type="submit" class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50" :disabled="saving || !changed"><Save class="h-4 w-4" aria-hidden="true" /> {{ saving ? 'Guardando...' : 'Guardar cambios' }}</button>
      </div>
      <p class="text-xs leading-relaxed text-slate-500">El servidor valida los permisos y puede rechazar la edición de la propia cuenta. La contraseña, el rol y la institución no se modifican desde este formulario.</p>
    </form>
  </section>
</template>