<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useChatStore } from '../stores/chat.store'
import type { TipoCanalChat } from '../services/chat.service'

const authStore = useAuthStore()
const chatStore = useChatStore()

const tab = ref<TipoCanalChat>('GLOBAL')
const canal = computed(() => chatStore.canales[tab.value])
const texto = ref('')
const listEl = ref<HTMLElement | null>(null)

function formatHora(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
}

function esMio(idUsuario: string) {
  return String(authStore.user?.id ?? '') === String(idUsuario)
}

async function scrollAbajo() {
  await nextTick()
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
}

async function enviar() {
  const contenido = texto.value
  if (!contenido.trim() || canal.value.sending) return
  texto.value = ''
  try {
    await chatStore.enviar(tab.value, contenido)
    await scrollAbajo()
  } catch {
    // El error ya queda visible en canal.error; se conserva el texto para reintentar.
    texto.value = contenido
  }
}

function cambiarTab(nuevo: TipoCanalChat) {
  tab.value = nuevo
  void scrollAbajo()
}

watch(() => canal.value.mensajes.length, () => { void scrollAbajo() })

onMounted(async () => {
  await Promise.all([chatStore.cargar('GLOBAL'), chatStore.cargar('CATEGORIA')])
  await scrollAbajo()
  chatStore.startPolling()
})

onBeforeUnmount(() => {
  chatStore.stopPolling()
})
</script>

<template>
  <main class="al-modern-screen mx-auto flex max-w-[900px] flex-col space-y-4">
    <header>
      <h1 class="text-2xl font-extrabold text-slate-900 sm:text-3xl">Chat de coordinación</h1>
      <p class="mt-1 text-sm text-slate-600">Coordiná con otras instituciones quién está en camino, quién tiene personal disponible y otras situaciones en curso.</p>
    </header>

    <div class="flex gap-2 rounded-xl border border-slate-200 bg-white p-1" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'GLOBAL'"
        class="min-h-11 flex-1 rounded-lg px-4 text-sm font-bold transition-colors"
        :class="tab === 'GLOBAL' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-50'"
        @click="cambiarTab('GLOBAL')"
      >
        General
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'CATEGORIA'"
        class="min-h-11 flex-1 rounded-lg px-4 text-sm font-bold transition-colors"
        :class="tab === 'CATEGORIA' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-50'"
        @click="cambiarTab('CATEGORIA')"
      >
        Mi institución
      </button>
    </div>

    <section class="flex min-h-[60vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <p v-if="canal.error" role="alert" class="m-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ canal.error }}</p>

      <div ref="listEl" class="flex-1 space-y-3 overflow-y-auto p-4">
        <p v-if="canal.loading" role="status" class="text-center text-sm text-slate-500">Cargando mensajes...</p>

        <button
          v-else-if="canal.hayMas && canal.mensajes.length"
          type="button"
          class="mx-auto block rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          :disabled="canal.loadingMore"
          @click="chatStore.cargarMasAntiguos(tab)"
        >
          {{ canal.loadingMore ? 'Cargando...' : 'Ver mensajes anteriores' }}
        </button>

        <p v-if="!canal.loading && !canal.mensajes.length" class="text-center text-sm text-slate-500">Todavía no hay mensajes en este canal.</p>

        <div
          v-for="mensaje in canal.mensajes"
          :key="mensaje.id_mensaje"
        >
          <!-- Aviso automático (sin autor): centrado y distinto de una burbuja de conversación. -->
          <div v-if="mensaje.tipo_mensaje === 'SISTEMA'" class="flex justify-center">
            <p class="max-w-[90%] rounded-full bg-slate-100 px-3 py-1 text-center text-xs font-semibold text-slate-600">
              {{ mensaje.contenido }} · {{ formatHora(mensaje.fecha_hora) }}
            </p>
          </div>
          <div v-else class="flex" :class="esMio(mensaje.id_usuario) ? 'justify-end' : 'justify-start'">
            <div
              class="max-w-[80%] rounded-2xl px-4 py-2"
              :class="esMio(mensaje.id_usuario) ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-900'"
            >
              <p v-if="!esMio(mensaje.id_usuario)" class="text-xs font-bold text-orange-700">
                {{ mensaje.usuario_nombre ?? 'Usuario' }} · {{ mensaje.institucion_nombre ?? 'Institución' }}
              </p>
              <p class="whitespace-pre-wrap break-words text-sm">{{ mensaje.contenido }}</p>
              <p class="mt-1 text-right text-[11px] opacity-75">{{ formatHora(mensaje.fecha_hora) }}</p>
            </div>
          </div>
        </div>
      </div>

      <form class="flex items-end gap-2 border-t border-slate-200 p-3" @submit.prevent="enviar">
        <textarea
          v-model="texto"
          rows="1"
          maxlength="2000"
          placeholder="Escribí un mensaje..."
          class="form-input min-h-11 flex-1 resize-none"
          @keydown.enter.exact.prevent="enviar"
        ></textarea>
        <button
          type="submit"
          class="min-h-11 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
          :disabled="canal.sending || !texto.trim()"
        >
          {{ canal.sending ? 'Enviando...' : 'Enviar' }}
        </button>
      </form>
    </section>
  </main>
</template>
