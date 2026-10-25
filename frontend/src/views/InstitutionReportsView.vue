
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue'

import { storeToRefs } from 'pinia'

import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Eye,
  FilePlus2,
  Pencil,
  RefreshCw,
  Search,
  X,
} from 'lucide-vue-next'

import { useAuthStore } from '../stores/auth.store'
import { useReportStore } from '../stores/report.store'

import {
  backendAlertsService,
  type BackendAlert,
} from '../services/backend-alerts.service'

import {
  reportService,
  type InformeAtencion,
  type InformeEstado,
  type CreateAttentionReportInput,
  type UpdateAttentionReportInput,
} from '../services/report.service'

type ModalMode = 'create' | 'edit' | 'detail'

type FormData = {
  id_alerta: string
  estado: InformeEstado
  fecha_incidente: string
  hora_recepcion: string
  hora_salida: string
  hora_llegada: string
  hora_control: string
  hora_finalizacion: string
  personal: string
  vehiculos: string
  personas_afectadas: string
  personas_evacuadas: string
  heridos: string
  fallecidos: string
  danos_materiales: string
  causa: string
  acciones: string
  observaciones: string
  recomendaciones: string
}

const numberFields = [
  { key: 'personal', label: 'Personal participante' },
  { key: 'vehiculos', label: 'Vehículos' },
  { key: 'personas_afectadas', label: 'Personas afectadas' },
  { key: 'personas_evacuadas', label: 'Personas evacuadas' },
  { key: 'heridos', label: 'Heridos' },
  { key: 'fallecidos', label: 'Fallecidos' },
] as const

const timeFields = [
  { key: 'hora_recepcion', label: 'Recepción' },
  { key: 'hora_salida', label: 'Salida' },
  { key: 'hora_llegada', label: 'Llegada' },
  { key: 'hora_control', label: 'Control' },
  { key: 'hora_finalizacion', label: 'Finalización' },
] as const

const textFields = [
  { key: 'danos_materiales', label: 'Daños materiales' },
  { key: 'causa', label: 'Causa' },
  { key: 'acciones', label: 'Acciones realizadas' },
  { key: 'observaciones', label: 'Observaciones' },
  { key: 'recomendaciones', label: 'Recomendaciones' },
] as const

const auth = useAuthStore()
const reportsStore = useReportStore()

const { reports, loading, error } = storeToRefs(reportsStore)

const institutionId = computed(() =>
  String(
    auth.user?.institucionId ??
    auth.user?.institutionId ??
    ''
  )
)

const userId = computed(() =>
  String(auth.user?.id ?? '')
)

const search = ref('')
const alertOptions = ref<BackendAlert[]>([])
const alertInfo = ref('')

const notice = ref('')
const noticeIsError = ref(false)

const busy = ref(false)
const modalOpen = ref(false)
const mode = ref<ModalMode>('create')
const editingId = ref<string | null>(null)
const formError = ref('')

const dialog = ref<HTMLElement | null>(null)
const firstInput = ref<HTMLInputElement | null>(null)

let beforeOpenFocus: HTMLElement | null = null
let oldOverflow = ''

function blankForm(): FormData {
  return {
    id_alerta: '',
    estado: 'BORRADOR',
    fecha_incidente: '',
    hora_recepcion: '',
    hora_salida: '',
    hora_llegada: '',
    hora_control: '',
    hora_finalizacion: '',
    personal: '',
    vehiculos: '',
    personas_afectadas: '',
    personas_evacuadas: '',
    heridos: '',
    fallecidos: '',
    danos_materiales: '',
    causa: '',
    acciones: '',
    observaciones: '',
    recomendaciones: '',
  }
}

const form = reactive<FormData>(blankForm())
let original = blankForm()

const visibleReports = computed(() => {
  const term = search.value.trim().toLocaleLowerCase()

  return reports.value
    .filter(
      (report) =>
        report.id_institucion === institutionId.value
    )
    .filter(
      (report) =>
        !term ||
        [
          report.id_informe_atencion,
          report.id_alerta,
          report.estado,
          report.causa,
          report.fecha_incidente,
        ].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(term)
        )
    )
})

const canWrite = computed(() =>
  Boolean(institutionId.value && userId.value)
)

const isReadOnly = computed(() =>
  mode.value === 'detail'
)

function friendlyError(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : 'No se pudo completar la operación.'
}

function display(value: unknown): string {
  return value === null ||
    value === undefined ||
    value === ''
    ? 'No registrado'
    : String(value)
}

function dateInput(value: string | null): string {
  return value?.slice(0, 10) ?? ''
}

function timeInput(value: string | null): string {
  return value?.slice(0, 5) ?? ''
}

function wholeId(raw: unknown, name: string): string {
  const text = String(raw ?? '').trim()

  if (
    !/^\d+$/.test(text) ||
    !Number.isSafeInteger(Number(text)) ||
    Number(text) < 1
  ) {
    throw new Error(
      `${name} debe ser un identificador válido.`
    )
  }

  return text
}

async function reload() {
  notice.value = ''

  if (!canWrite.value) {
    reportsStore.clear()

    notice.value =
      'Tu cuenta debe tener una institución y un usuario asignados para consultar informes.'

    noticeIsError.value = true
    return
  }

  await reportsStore.fetchReports()
}

async function loadAlertOptions() {
  alertInfo.value = ''

  if (!institutionId.value) return

  try {
    alertOptions.value =
      await backendAlertsService.byInstitution(
        institutionId.value
      )
  } catch {
    alertOptions.value = []

    alertInfo.value =
      'No se pudo cargar el catálogo de alertas. Puedes ingresar manualmente un ID válido.'
  }
}

function openDialog() {
  beforeOpenFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

  oldOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  modalOpen.value = true

  void nextTick(() => firstInput.value?.focus())
}

function closeDialog() {
  if (busy.value) return

  modalOpen.value = false
  document.body.style.overflow = oldOverflow

  void nextTick(() => beforeOpenFocus?.focus())
}

function newReport() {
  if (!canWrite.value) {
    notice.value =
      'Debes iniciar sesión con una institución asignada.'

    noticeIsError.value = true
    return
  }

  Object.assign(form, blankForm())

  original = { ...form }
  editingId.value = null
  formError.value = ''
  mode.value = 'create'

  openDialog()
}

function populateForm(report: InformeAtencion) {
  Object.assign(form, {
    id_alerta: report.id_alerta,
    estado: report.estado as InformeEstado,

    fecha_incidente: dateInput(
      report.fecha_incidente
    ),

    hora_recepcion: timeInput(report.hora_recepcion),
    hora_salida: timeInput(report.hora_salida),
    hora_llegada: timeInput(report.hora_llegada),
    hora_control: timeInput(report.hora_control),

    hora_finalizacion: timeInput(
      report.hora_finalizacion
    ),

    personal:
      report.personal === null
        ? ''
        : String(report.personal),

    vehiculos:
      report.vehiculos === null
        ? ''
        : String(report.vehiculos),

    personas_afectadas:
      report.personas_afectadas === null
        ? ''
        : String(report.personas_afectadas),

    personas_evacuadas:
      report.personas_evacuadas === null
        ? ''
        : String(report.personas_evacuadas),

    heridos:
      report.heridos === null
        ? ''
        : String(report.heridos),

    fallecidos:
      report.fallecidos === null
        ? ''
        : String(report.fallecidos),

    danos_materiales: report.danos_materiales ?? '',
    causa: report.causa ?? '',
    acciones: report.acciones ?? '',
    observaciones: report.observaciones ?? '',
    recomendaciones: report.recomendaciones ?? '',
  })

  original = { ...form }
}

async function showReport(
  id: string,
  selectedMode: 'detail' | 'edit'
) {
  formError.value = ''
  notice.value = ''
  busy.value = true

  try {
    const report = await reportService.getReportById(id)

    if (report.id_institucion !== institutionId.value) {
      throw new Error(
        'Este informe no pertenece a tu institución.'
      )
    }

    if (
      selectedMode === 'edit' &&
      !['BORRADOR', 'COMPLETADO'].includes(report.estado)
    ) {
      throw new Error(
        `El estado ${report.estado} no está documentado para editar informes.`
      )
    }

    populateForm(report)

    mode.value = selectedMode
    editingId.value = report.id_informe_atencion

    openDialog()
  } catch (cause) {
    notice.value = friendlyError(cause)
    noticeIsError.value = true
  } finally {
    busy.value = false
  }
}

function changedFields(): UpdateAttentionReportInput {
  const payload: Record<string, string | number> = {}

  if (
    mode.value === 'create' ||
    form.estado !== original.estado
  ) {
    if (
      !['BORRADOR', 'COMPLETADO'].includes(form.estado)
    ) {
      throw new Error(
        'Selecciona BORRADOR o COMPLETADO.'
      )
    }

    payload.estado = form.estado
  }

  const fields = [
    'fecha_incidente',
    ...timeFields.map((field) => field.key),
    ...textFields.map((field) => field.key),
    ...numberFields.map((field) => field.key),
  ] as const

  const numbers = new Set<string>(
    numberFields.map((field) => field.key)
  )

  for (const key of fields) {
    const next = String(form[key] ?? '').trim()
    const previous = String(original[key] ?? '').trim()

    if (
      mode.value !== 'create' &&
      next === previous
    ) {
      continue
    }

    if (!next) {
      if (
        mode.value !== 'create' &&
        previous
      ) {
        throw new Error(
          `No se ha confirmado cómo borrar el campo ${key}. Restaura su valor o consulta al backend.`
        )
      }

      continue
    }

    if (numbers.has(key)) {
      const numeric = Number(next)

      if (
        !Number.isSafeInteger(numeric) ||
        numeric < 0
      ) {
        throw new Error(
          `El campo ${key} debe ser un entero mayor o igual a cero.`
        )
      }

      payload[key] = numeric
    } else {
      payload[key] = next
    }
  }

  return payload as UpdateAttentionReportInput
}

async function save() {
  if (busy.value || isReadOnly.value) return

  formError.value = ''

  let changes: UpdateAttentionReportInput
  let idAlerta = ''

  try {
    idAlerta = wholeId(
      form.id_alerta,
      'El ID de alerta'
    )

    wholeId(
      institutionId.value,
      'El ID de institución'
    )

    wholeId(
      userId.value,
      'El ID de usuario'
    )

    changes = changedFields()

    if (
      mode.value === 'edit' &&
      Object.keys(changes).length === 0
    ) {
      formError.value = 'No hay cambios para guardar.'
      return
    }

    if (
      changes.estado === 'COMPLETADO' &&
      !window.confirm(
        '¿Confirmas que el informe debe quedar COMPLETADO en el servidor?'
      )
    ) {
      return
    }
  } catch (cause) {
    formError.value = friendlyError(cause)
    return
  }

  busy.value = true

  try {
    const wasEditing = mode.value === 'edit'

    if (wasEditing && editingId.value) {
      await reportsStore.updateReport(
        editingId.value,
        changes
      )
    } else {
      const input: CreateAttentionReportInput = {
        id_alerta: idAlerta,
        id_institucion: institutionId.value,
        id_usuario: userId.value,
        ...changes,
      }

      await reportsStore.createReport(input)
    }

    modalOpen.value = false
    document.body.style.overflow = oldOverflow

    void nextTick(() => beforeOpenFocus?.focus())

    await reportsStore.fetchReports()

    noticeIsError.value = Boolean(reportsStore.error)

    notice.value = reportsStore.error
      ? 'La operación fue aceptada por el servidor, pero no se pudo actualizar el listado. Usa Actualizar antes de repetirla.'
      : wasEditing
        ? 'Informe actualizado en el servidor.'
        : 'Informe creado en el servidor.'
  } catch (cause) {
    formError.value = friendlyError(cause)
  } finally {
    busy.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (!modalOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    closeDialog()
    return
  }

  if (
    event.key !== 'Tab' ||
    !dialog.value
  ) {
    return
  }

  const elements = [
    ...dialog.value.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]'
    ),
  ].filter(
    (element) =>
      element.getClientRects().length > 0
  )

  if (!elements.length) return

  const first = elements[0]!
  const last = elements[elements.length - 1]!

  if (
    event.shiftKey &&
    document.activeElement === first
  ) {
    event.preventDefault()
    last.focus()
  } else if (
    !event.shiftKey &&
    document.activeElement === last
  ) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)

  void reload()
  void loadAlertOptions()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)

  if (modalOpen.value) {
    document.body.style.overflow = oldOverflow
  }
})
</script>

<template>
  <main
    class="admin-page mx-auto w-full max-w-[1500px] space-y-5 p-0 sm:p-2 lg:p-4"
  >
    <header
      class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div class="min-w-0">
        <p
          class="text-xs font-bold uppercase tracking-widest text-orange-600"
        >
          Administración institucional
        </p>

        <h1
          class="mt-1 break-words text-2xl font-extrabold text-slate-900 sm:text-3xl"
        >
          Informes de atención
        </h1>

        <p
          class="mt-2 text-sm leading-relaxed text-slate-600"
        >
          Registra y consulta las actuaciones de tu institución.
          Los datos se guardan en el backend, sin PDF.
        </p>
      </div>

      <button
        type="button"
        :disabled="!canWrite"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
        @click="newReport"
      >
        <FilePlus2 class="h-5 w-5" aria-hidden="true" />
        Nuevo informe
      </button>
    </header>

    <div
      v-if="notice"
      role="status"
      class="flex min-w-0 items-start gap-3 rounded-xl border p-4 text-sm"
      :class="
        noticeIsError
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-emerald-200 bg-emerald-50 text-emerald-900'
      "
    >
      <AlertCircle
        v-if="noticeIsError"
        class="h-5 w-5 shrink-0"
        aria-hidden="true"
      />

      <CheckCircle2
        v-else
        class="h-5 w-5 shrink-0"
        aria-hidden="true"
      />

      <span class="min-w-0 flex-1 break-words">
        {{ notice }}
      </span>

      <button
        type="button"
        class="min-h-11 min-w-11"
        aria-label="Ocultar mensaje"
        @click="notice = ''"
      >
        <X class="mx-auto h-4 w-4" />
      </button>
    </div>

    <section
      class="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div
        class="flex min-w-0 flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div class="min-w-0">
          <h2
            class="flex items-center gap-2 text-lg font-bold text-slate-900"
          >
            <ClipboardList
              class="h-5 w-5 text-orange-600"
              aria-hidden="true"
            />
            Informes registrados
          </h2>

          <p class="mt-1 text-sm text-slate-600">
            {{ visibleReports.length }} informes visibles para tu institución
          </p>
        </div>

        <div class="flex min-w-0 flex-wrap gap-2">
          <label
            class="relative min-w-0 flex-1 sm:w-64 sm:flex-none"
          >
            <span class="sr-only">Buscar informes</span>

            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />

            <input
              v-model="search"
              type="search"
              placeholder="Buscar ID, alerta o estado"
              class="form-input pl-10"
            />
          </label>

          <button
            type="button"
            class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
            :disabled="loading"
            aria-label="Actualizar informes"
            @click="reload"
          >
            <RefreshCw
              class="h-4 w-4"
              :class="{ 'animate-spin': loading }"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <p
        v-if="!canWrite"
        class="m-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        role="alert"
      >
        Tu sesión no tiene un ID de institución asignado.
      </p>

      <p
        v-else-if="loading"
        role="status"
        class="p-8 text-center text-sm text-slate-600"
      >
        Cargando informes...
      </p>

      <p
        v-else-if="error"
        role="alert"
        class="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        {{ error }}
      </p>

      <p
        v-else-if="visibleReports.length === 0"
        class="p-10 text-center text-sm text-slate-600"
      >
        {{
          search
            ? 'No hay coincidencias con tu búsqueda.'
            : 'Todavía no hay informes registrados para esta institución.'
        }}
      </p>

      <template v-else>
        <div
          class="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:hidden"
        >
          <article
            v-for="report in visibleReports"
            :key="report.id_informe_atencion"
            class="min-w-0 space-y-3 rounded-xl border border-slate-200 p-4"
          >
            <div
              class="flex flex-wrap items-center justify-between gap-2"
            >
              <strong class="break-words text-slate-900">
                Informe #{{ report.id_informe_atencion }}
              </strong>

              <span
                class="rounded-full px-3 py-1 text-xs font-bold"
                :class="
                  report.estado === 'COMPLETADO'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                "
              >
                {{ report.estado }}
              </span>
            </div>

            <p class="text-sm text-slate-700">
              Alerta #{{ report.id_alerta }}
            </p>

            <p class="text-sm text-slate-600">
              Incidente: {{ display(report.fecha_incidente) }}
            </p>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="min-h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-700"
                @click="showReport(report.id_informe_atencion, 'detail')"
              >
                Ver detalle
              </button>

              <button
                type="button"
                class="min-h-11 rounded-lg border border-orange-200 px-3 text-sm font-semibold text-orange-700"
                @click="showReport(report.id_informe_atencion, 'edit')"
              >
                Editar
              </button>
            </div>
          </article>
        </div>

        <div class="hidden overflow-x-auto lg:block">
          <table
            class="w-full min-w-[650px] text-left text-sm"
          >
            <thead
              class="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"
            >
              <tr>
                <th scope="col" class="px-4 py-3">
                  Informe
                </th>
                <th scope="col" class="px-4 py-3">
                  Alerta
                </th>
                <th scope="col" class="px-4 py-3">
                  Fecha de incidente
                </th>
                <th scope="col" class="px-4 py-3">
                  Estado
                </th>
                <th scope="col" class="px-4 py-3 text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="report in visibleReports"
                :key="report.id_informe_atencion"
                class="border-t border-slate-100 hover:bg-slate-50"
              >
                <td
                  class="break-words px-4 py-4 font-semibold text-slate-900"
                >
                  #{{ report.id_informe_atencion }}
                </td>

                <td class="px-4 py-4">
                  #{{ report.id_alerta }}
                </td>

                <td class="px-4 py-4">
                  {{ display(report.fecha_incidente) }}
                </td>

                <td class="px-4 py-4">
                  <span
                    class="rounded-full px-3 py-1 text-xs font-bold"
                    :class="
                      report.estado === 'COMPLETADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    "
                  >
                    {{ report.estado }}
                  </span>
                </td>

                <td class="px-4 py-4">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
                      aria-label="Ver informe"
                      title="Ver informe"
                      @click="showReport(report.id_informe_atencion, 'detail')"
                    >
                      <Eye class="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-orange-700"
                      aria-label="Editar informe"
                      title="Editar informe"
                      @click="showReport(report.id_informe_atencion, 'edit')"
                    >
                      <Pencil class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>

    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/65 p-2 sm:p-5"
        @click.self="closeDialog"
      >
        <div
          ref="dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          class="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]"
        >
          <header
            class="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6"
          >
            <div class="min-w-0">
              <p
                class="text-xs font-bold uppercase tracking-widest text-orange-600"
              >
                Institución #{{ institutionId }}
              </p>

              <h2
                id="report-modal-title"
                class="mt-1 break-words text-xl font-extrabold text-slate-900 sm:text-2xl"
              >
                {{
                  mode === 'create'
                    ? 'Nuevo informe'
                    : mode === 'edit'
                      ? 'Editar informe'
                      : 'Detalle del informe'
                }}
              </h2>

              <p class="mt-1 text-sm text-slate-600">
                {{
                  mode === 'detail'
                    ? 'Información recuperada del servidor.'
                    : 'Los campos sin asterisco son opcionales.'
                }}
              </p>
            </div>

            <button
              type="button"
              class="min-h-11 min-w-11 shrink-0 rounded-xl border border-slate-200 text-slate-700"
              aria-label="Cerrar ventana"
              :disabled="busy"
              @click="closeDialog"
            >
              <X class="mx-auto h-5 w-5" />
            </button>
          </header>

          <form
            class="flex min-h-0 flex-1 flex-col"
            @submit.prevent="save"
          >
            <div
              class="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
            >
              <p
                v-if="formError"
                role="alert"
                class="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {{ formError }}
              </p>

              <p
                v-if="alertInfo && mode === 'create'"
                class="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
              >
                {{ alertInfo }}
              </p>

              <div
                class="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  ID de alerta
                  <span class="text-orange-600">*</span>

                  <input
                    ref="firstInput"
                    v-model="form.id_alerta"
                    type="number"
                    min="1"
                    step="1"
                    list="informe-alertas"
                    required
                    :disabled="mode !== 'create'"
                    placeholder="Ej. 12"
                    class="form-input mt-1 font-normal"
                  />

                  <datalist id="informe-alertas">
                    <option
                      v-for="alert in alertOptions"
                      :key="String(alert.id_alerta)"
                      :value="String(alert.id_alerta)"
                    >
                      Alerta #{{ alert.id_alerta }}
                    </option>
                  </datalist>

                  <span
                    class="mt-1 block text-xs font-normal text-slate-500"
                  >
                    Debe existir en el backend y corresponder a tu institución.
                  </span>
                </label>

                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Estado

                  <select
                    v-model="form.estado"
                    :disabled="isReadOnly"
                    class="form-input mt-1 font-normal"
                  >
                    <option value="BORRADOR">
                      Borrador
                    </option>
                    <option value="COMPLETADO">
                      Completado
                    </option>
                  </select>
                </label>

                <label
                  class="min-w-0 text-sm font-semibold text-slate-700"
                >
                  Fecha de incidente

                  <input
                    v-model="form.fecha_incidente"
                    type="date"
                    :disabled="isReadOnly"
                    class="form-input mt-1 font-normal"
                  />
                </label>
              </div>

              <div
                class="rounded-xl border border-slate-200 p-4"
              >
                <h3
                  class="mb-3 text-base font-bold text-slate-900"
                >
                  Horarios de atención
                </h3>

                <div
                  class="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <label
                    v-for="field in timeFields"
                    :key="field.key"
                    class="min-w-0 text-sm font-semibold text-slate-700"
                  >
                    {{ field.label }}

                    <input
                      v-model="form[field.key]"
                      type="time"
                      :disabled="isReadOnly"
                      class="form-input mt-1 font-normal"
                    />
                  </label>
                </div>
              </div>

              <div
                class="rounded-xl border border-slate-200 p-4"
              >
                <h3
                  class="mb-3 text-base font-bold text-slate-900"
                >
                  Recursos y personas
                </h3>

                <div
                  class="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <label
                    v-for="field in numberFields"
                    :key="field.key"
                    class="min-w-0 text-sm font-semibold text-slate-700"
                  >
                    {{ field.label }}

                    <input
                      v-model="form[field.key]"
                      type="number"
                      min="0"
                      step="1"
                      :disabled="isReadOnly"
                      placeholder="Sin registrar"
                      class="form-input mt-1 font-normal"
                    />
                  </label>
                </div>
              </div>

              <div
                class="space-y-3 rounded-xl border border-slate-200 p-4"
              >
                <h3
                  class="text-base font-bold text-slate-900"
                >
                  Descripción de la atención
                </h3>

                <label
                  v-for="field in textFields"
                  :key="field.key"
                  class="block min-w-0 text-sm font-semibold text-slate-700"
                >
                  {{ field.label }}

                  <textarea
                    v-model="form[field.key]"
                    rows="2"
                    :disabled="isReadOnly"
                    class="form-input mt-1 min-h-24 resize-y font-normal"
                    placeholder="Sin información registrada"
                  />
                </label>
              </div>

              <p class="text-sm text-slate-600">
                Los informes se envían como datos del formulario.
                Esta versión del backend no admite archivos PDF.
              </p>
            </div>

            <footer
              class="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6"
            >
              <button
                type="button"
                class="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700"
                :disabled="busy"
                @click="closeDialog"
              >
                {{ isReadOnly ? 'Cerrar' : 'Cancelar' }}
              </button>

              <button
                v-if="!isReadOnly"
                type="submit"
                :disabled="busy"
                class="min-h-11 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {{
                  busy
                    ? 'Guardando...'
                    : mode === 'create'
                      ? 'Crear informe'
                      : 'Guardar cambios'
                }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Teleport>
  </main>
</template>

