<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { TriangleAlert, CircleHelp } from 'lucide-vue-next'
import { useConfirm } from '../../composables/useConfirm'

const { current, settle } = useConfirm()
const dialog = ref<HTMLElement | null>(null)
const confirmButton = ref<HTMLButtonElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)
let previousFocus: HTMLElement | null = null
let previousOverflow = ''

watch(current, async (request, previous) => {
  if (request && !previous) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    // En acciones destructivas el foco inicial va a Cancelar, para que un Enter apurado no borre nada.
    ;(request.tone === 'danger' ? cancelButton.value : confirmButton.value)?.focus()
  } else if (!request && previous) {
    document.body.style.overflow = previousOverflow
    previousFocus?.focus()
  }
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    settle(false)
    return
  }
  if (event.key !== 'Tab' || !dialog.value) return
  const focusable = [cancelButton.value, confirmButton.value].filter((item): item is HTMLButtonElement => Boolean(item))
  const first = focusable[0]!, last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="current"
      class="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/55 p-4"
      @click.self="settle(false)"
      @keydown="onKeydown"
    >
      <div
        ref="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div class="flex items-start gap-4">
          <span
            class="grid h-11 w-11 shrink-0 place-items-center rounded-full"
            :class="current.tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'"
            aria-hidden="true"
          >
            <TriangleAlert v-if="current.tone === 'danger'" :size="22" />
            <CircleHelp v-else :size="22" />
          </span>
          <div class="min-w-0">
            <h2 id="confirm-dialog-title" class="text-lg font-bold text-slate-900">{{ current.title }}</h2>
            <p id="confirm-dialog-message" class="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-slate-600">{{ current.message }}</p>
          </div>
        </div>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref="cancelButton"
            type="button"
            class="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="settle(false)"
          >
            {{ current.cancelText ?? 'Cancelar' }}
          </button>
          <button
            ref="confirmButton"
            type="button"
            class="min-h-11 rounded-xl px-4 text-sm font-bold text-white"
            :class="current.tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'"
            @click="settle(true)"
          >
            {{ current.confirmText ?? 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
