<script setup lang="ts">
import { ref } from 'vue'
import { ImagePlus, MapPin, Send } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useCitizenReportStore } from '../stores/citizen-report.store'
import { useIncidentStore } from '../stores/incident.store'

const router = useRouter()
const citizenStore = useCitizenReportStore()
const incidentStore = useIncidentStore()
const descripcion = ref('')
const ubicacion = ref('Av. Busch, La Paz')
const factores = ref<string[]>([])
const fotoNombre = ref('')
const fotoUrl = ref('')
const sent = ref(false)
const factorOptions = ['humo visible', 'llamas visibles', 'personas en riesgo', 'explosiones']

const selectPhoto = (event: Event) => { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; fotoNombre.value = file.name; fotoUrl.value = URL.createObjectURL(file) }
const submit = async () => { const report = await citizenStore.createReport({ descripcion: descripcion.value || 'Reporte ciudadano de demostración.', ubicacion: ubicacion.value, latitud: -16.508, longitud: -68.121, factores: factores.value, fotoNombre: fotoNombre.value || undefined, fotoUrl: fotoUrl.value || undefined }); await incidentStore.createFromCitizenReport(report); sent.value = true }
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6"><section><p class="text-[10px] uppercase tracking-[0.24em] text-orange-700">Ciudadano · Datos de demostración</p><h2 class="mt-2 text-2xl font-semibold text-slate-900">Reportar incendio</h2><p class="mt-2 text-sm text-slate-600">Tu reporte será recibido y verificado por el Centro de Monitoreo.</p></section><section v-if="sent" class="rounded-2xl border border-emerald-300 bg-emerald-50 p-6"><h3 class="text-lg font-semibold text-slate-900">Reporte recibido</h3><p class="mt-2 text-sm text-slate-700">Tu reporte fue recibido y será verificado por el Centro de Monitoreo.</p><button class="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800" @click="router.push('/ciudadano/mis-reportes')">Ver mis reportes</button></section><form v-else class="space-y-5 rounded-2xl border border-slate-200 bg-white p-5" @submit.prevent="submit"><label class="block text-sm font-medium text-slate-800">Descripción<textarea v-model="descripcion" rows="4" class="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500" placeholder="Describe lo que observas"></textarea></label><label class="block text-sm font-medium text-slate-800">Ubicación<div class="mt-2 flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5"><MapPin class="h-4 w-4 text-orange-600" /><input v-model="ubicacion" class="w-full text-sm outline-none" /></div></label><div><p class="text-sm font-medium text-slate-800">¿Qué observas?</p><div class="mt-2 grid gap-2 sm:grid-cols-2"><label v-for="factor in factorOptions" :key="factor" class="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700"><input v-model="factores" type="checkbox" :value="factor" class="accent-orange-500" />{{ factor }}</label></div></div><label class="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-700"><ImagePlus class="h-5 w-5 text-orange-600" /><span>{{ fotoNombre || 'Adjuntar fotografía' }}</span><input type="file" accept="image/*" class="hidden" @change="selectPhoto" /></label><img v-if="fotoUrl" :src="fotoUrl" alt="Vista previa del reporte" class="max-h-64 rounded-xl object-cover" /><button type="submit" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"><Send class="h-4 w-4" /> Enviar reporte</button></form></div>
</template>