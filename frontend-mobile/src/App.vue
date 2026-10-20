<template>
  <ion-app>
    <ion-router-outlet :class="{ 'router-shell-ready': !showSplash }" />
    <Transition name="splash-fade">
      <div v-if="showSplash" class="splash-screen" aria-label="ALERTA, Prevención de Incendios">
        <span class="splash-icon"><ion-icon :icon="flameOutline" aria-hidden="true" /></span>
        <strong>ALERTA</strong>
        <span>Prevención de Incendios</span>
      </div>
    </Transition>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonIcon, IonRouterOutlet } from '@ionic/vue'
import { flameOutline } from 'ionicons/icons'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const showSplash = ref(true)
let splashTimeout: number | undefined

onMounted(() => {
  splashTimeout = window.setTimeout(() => {
    showSplash.value = false
  }, 950)
})

onBeforeUnmount(() => {
  if (splashTimeout !== undefined) window.clearTimeout(splashTimeout)
})
</script>

<style scoped>
.router-shell-ready {
  opacity: 1;
  pointer-events: auto;
}
ion-router-outlet {
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
}
.splash-screen {
  position: fixed;
  z-index: 2000;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 10px;
  background: var(--alerta-canvas);
  color: var(--alerta-ink);
}
.splash-icon {
  display: grid;
  width: 58px;
  height: 58px;
  margin-bottom: 4px;
  place-items: center;
  border-radius: 18px;
  background: var(--alerta-orange-soft);
  color: var(--alerta-brand);
  font-size: 30px;
}
.splash-screen strong {
  color: var(--alerta-brand);
  font-size: 25px;
  font-weight: 800;
}
.splash-screen > span:last-child {
  color: var(--alerta-muted);
  font-size: 14px;
}
.splash-fade-enter-active,
.splash-fade-leave-active {
  transition: opacity 180ms ease;
}
.splash-fade-enter-from,
.splash-fade-leave-to {
  opacity: 0;
}
</style>
